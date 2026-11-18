package com.eivra.studio.v2.insights

import com.eivra.studio.v2.api.*
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONArray
import org.json.JSONObject
import java.time.*

data class ReviewPoint internal constructor(val label: String, val value: Double, val readout: String, val dest: Dest? = null)
internal data class Stat(val label: String, val value: String, val basis: String)
internal sealed interface Block {
    data class Stats(val values: List<Stat>) : Block
    data class Section(val name: String, val hint: String = "") : Block
    data class Note(val title: String, val body: String) : Block
    data class Line(val title: String, val detail: String, val tail: String, val dest: Dest? = null) : Block
    data class Trace(val title: String, val unit: String, val points: List<ReviewPoint>) : Block
    data class Match(val index: Int, val leg: Leg, val home: String, val away: String) : Block
    data class Slice(val name: String, val n: Int, val unit: String, val hit: Double?, val roi: Double?) : Block
    data class Choices(val active: String, val options: List<Pair<String,String>>) : Block
}
internal data class Cell(val key: String, val block: Block)
internal data class Query(val dest: Dest, val window: Window = Window.All, val search: String = "", val cut: Int = 0, val cycle: String? = null)
internal const val SLICES = "持仓结构|模式|Conf 区间|Entry 类型"
internal const val METRICS = "概览|概率误差|判断尺度"
internal const val RECORDS = "全部状态|已结算|待结算|已归档"
internal class Book {
    val rows = mutableListOf<Cell>()
    fun add(key: String, block: Block) { rows.add(Cell(key,block)) }
    fun note(title: String, body: String) = add("note:$title",Block.Note(title,body))
    fun section(title: String, hint: String = "") = add("section:$title",Block.Section(title,hint))
    fun stats(vararg values: Stat) = add("stats",Block.Stats(values.toList()))
    fun ticket(t: Ticket, hint: String = t.created.stamp()) = add("inv:${t.id}",Block.Line(t.label,"$hint · ${t.legs.size} 腿 · #${t.id}",t.statusText,Dest(Route.History,t.id)))
}

/** One reader per version + foreground epoch. No result or ledger is persisted. Called on Dispatchers.Default. */
internal class ReviewReader(private val ports: StudioPorts, private val mode: String, private val revision: Long,
    private val zone: ZoneId = ZoneId.systemDefault(), private val today: LocalDate = LocalDate.now(zone)) {
    private val lock = Mutex()
    private var archive: Archive? = null
    private suspend fun valid() {
        currentCoroutineContext().ensureActive()
        check(ports.state.value.let { it.mode == mode && it.revision == revision }) { "工作区已更新" }
    }
    internal suspend fun raw(op: String, vararg args: String): String {
        valid(); val result = ports.read(op, JSONArray(args.toList())); valid(); return result
    }
    internal suspend fun ledger(): Archive = lock.withLock {
        valid(); archive ?: Archive.parse(raw("workspace.snapshot"),zone).also { archive = it }
    }
    suspend fun page(q: Query): List<Cell> {
        val out = Book()
        with(out) {
            when(q.dest.route) {
                Route.History -> history(q)
                Route.Teams -> teams(q)
                Route.Dashboard -> overview(q)
                Route.Analysis -> analysis(this@ReviewReader, q)
                Route.Metrics -> metrics(this@ReviewReader, q)
                Route.Seasons -> seasons(this@ReviewReader, q)
                else -> error("不是复盘页面")
            }
        }
        valid(); return out.rows
    }
    private suspend fun Book.history(q: Query) {
        val a = ledger(); val id = q.dest.key
        if (id != null) {
            val t = a.exact(id)
            if (t == null || (mode == "demo" && t.demoSeed)) { note("未找到这笔记录", "当前工作区没有可查看的 #$id。返回 Records 按完整 ID 搜索。"); return }
            section(t.label,"#${t.id} · ${t.statusText}${if (t.archived) " · 已归档" else ""}")
            stats(Stat("投入",t.inputs.cash(),"${t.legs.size} 腿"),Stat("返还",t.revenue.takeUnless { t.pending }.cash(),"含本金"),Stat("净盈亏",t.profit.takeUnless { t.pending }.cash(),if(t.pending) "等待结算" else "已结算"))
            note("当时的判断", buildString {
                append("登记  ${t.created.stamp()}\n")
                append(if(t.ratingBasis == "mean_calibrated_leg_probability") "Expected Rating（单场均值）" else "Expected Rating（原记录评级）")
                append("  ${t.rating.fmt()}\n不是整票命中率。\n")
                if(t.frozenAt == null) append("未记录投前预测快照，不作事后补算。")
                else append("冻结  ${t.frozenAt}\n整票命中概率  ${t.ticketProbability.chance()}")
                if(!t.pending) append("\n结算  ${t.settledAt.stamp()}")
            })
            section("逐腿复盘", "比分始终按主队 : 客队排列。")
            t.legs.forEachIndexed { i,l -> add("leg:$id:$i",Block.Match(i+1,l,a.canonical(l.home),a.canonical(l.away))) }
            if(t.legs.isEmpty()) note("没有逐腿信息", "原记录没有比赛明细。")
            return
        }
        val exact = a.exact(q.search.trim())?.takeUnless { mode == "demo" && it.demoSeed }
        if (exact != null && q.search.isNotBlank()) add("pin:${exact.id}",Block.Line("按完整 ID 打开", "全账本精确匹配 · #${exact.id}","查看 →",Dest(Route.History,exact.id)))
        val rows = a.visible(mode,q.window,today,zone).filter { t -> t.matches(q.search) && when(q.cut) {
            3 -> t.archived; 2 -> !t.archived && t.pending; 1 -> !t.archived && !t.pending; else -> !t.archived
        } }
        section("投资记录", "${rows.size} 笔 · 按登记时间倒序")
        if(rows.isEmpty()) note("没有符合条件的记录", "可清除搜索或将时间改为全部。完整 ID 可跨筛选定位。")
        rows.forEach { ticket(it) }
    }
    private suspend fun Book.overview(q: Query) {
        val d = JSONObject(raw("analytics.getDashboardSnapshot",q.window.wire))
        val n = d.getInt("settledPeriod"); val pending = d.getInt("pendingPeriod")
        val series = d.getJSONArray("periodInvestmentRoiSeries").objects(); val hasStake = series.any { (it.number("inputs") ?: 0.0) > 0 }
        val ratings = d.getJSONArray("ratingRows").length()
        stats(Stat("蓄水池余额",d.number("poolBalance").cash(),"当前周期 · 不随窗口切换"),Stat("窗口 ROI",d.number("roiPeriod").takeIf { hasStake }.pct(),"已结算本金"),
            Stat("整票命中率",d.number("hitRatePeriod").takeIf { n > 0 }.pct(),"$n 笔已结算"),Stat("评级拟合",d.number("ratingFit").takeIf { ratings > 0 }.fmt(),"$ratings 个评级样本"))
        if(n == 0) note(if(pending>0) "本窗口尚无已结算样本" else "当前时间窗口暂无投资数据", "待结算 $pending 笔。没有分母时不显示收益率或命中率。")
        val a = ledger()
        val latest = a.visible(mode,q.window,today,zone).filter { !it.pending && !it.archived && it.settledAt != null }.maxByOrNull { it.settledAt!! }
        latest?.let { add("last-settled",Block.Line("最近结算 · ${it.label}","${it.settledAt.stamp()} · #${it.id}","复盘 →",Dest(Route.History,it.id))) }
        section("近期投资", "${d.getInt("periodInvestments")} 笔 · 待结算 $pending 笔")
        val recent = d.getJSONArray("recent").objects()
        recent.forEach { j -> val t = a.exact(j.id()); if(t != null && !(mode == "demo" && t.demoSeed)) ticket(t,j.text("entry") ?: t.created.stamp()) }
        val pts = series.mapNotNull { row -> row.number("roi")?.takeIf { (row.number("inputs") ?: 0.0) > 0 }?.let { v -> ReviewPoint(row.text("dateLabel").orEmpty(),v,"${row.text("match")} · ${v.pct()}",Dest(Route.History,row.id())) } }
        if(pts.isNotEmpty()) add("roi-series",Block.Trace("逐笔 ROI","%",pts))
    }
    private suspend fun Book.teams(q: Query) {
        val a = ledger(); val key = q.dest.key
        val canonical = key?.let(a::canonical)
        val rows = JSONArray(raw("analytics.getTeamsSnapshot",canonical ?: q.search.trim(),q.window.wire)).objects()
        if(canonical == null) {
            section("球队索引","${rows.size} 支球队 · 按已结算腿样本排序")
            rows.forEach { row -> val name=row.getString("name"); val n=row.getInt("totalSamples")
                add("team:$name",Block.Line(name,"${row.text("abbr").orEmpty()} · $n 个样本",row.number("roi").takeIf { n>0 && (row.number("totalInputs") ?: 0.0)>0 }.pct(),Dest(Route.Teams,name))) }
            if(rows.isEmpty()) note("没有匹配的球队", "可改用球队全名或清除搜索。")
            return
        }
        val t = rows.firstOrNull { it.getString("name").equals(canonical,true) }
        val occurrences = a.visible(mode,q.window,today,zone).filterNot { it.archived }.flatMap { inv -> inv.legs.mapIndexedNotNull { i,l ->
            if(listOf(l.home,l.away).any { a.canonical(it).equals(canonical,true) }) Triple(inv,i,l) else null
        } }
        section(canonical, "球队档案 · 主客比分保留原顺序")
        val n = t?.getInt("totalSamples") ?: 0
        stats(Stat("已结算样本",n.toString(),"拆分到比赛腿"),Stat("归因 ROI",t?.number("roi").takeIf { n>0 && (t?.number("totalInputs") ?: 0.0)>0 }.pct(),"按分摊本金"))
        section("关联记录", "${occurrences.size} 条腿 · 含待结算，不混入上方分母")
        occurrences.forEach { (inv,i,l) -> add("team-leg:${inv.id}:$i",Block.Line(l.match,"#${inv.id} · 第 ${i+1} 腿 · ${inv.created.stamp()}","${l.score ?: "—"} · ${l.outcome}",Dest(Route.History,inv.id))) }
        if(occurrences.isEmpty()) note("当前窗口无比赛记录", "可切换到全部时间。")
    }
}
