package com.eivra.studio.v2.insights

import com.eivra.studio.v2.api.*
import org.json.JSONObject

internal suspend fun Book.analysis(r: ReviewReader, q: Query) {
    val d = JSONObject(r.raw("analytics.getAnalysisSnapshot",q.window.wire))
    val (list, label, unit) = when(q.cut) {
        1 -> Triple("modeData","mode","腿"); 2 -> Triple("confData","confBucket","腿"); 3 -> Triple("entryTypeData","marketLabel","腿"); else -> Triple("strategyData","label","票")
    }
    val rows = d.getJSONArray(list).objects()
    section(SLICES.split('|')[q.cut], if(unit == "票") "以整票为一个样本" else "按比赛腿分摊本金和盈亏")
    for ((i,row) in rows.withIndex()) {
        val n = row.getInt("samples"); val title = row.getString(label)
        add("slice:$i:$title",Block.Slice(title,n,unit,row.number("hitRate").takeIf { n>0 },row.number("roi").takeIf { n>0 && (!row.has("inputs") || (row.number("inputs") ?: 0.0)>0) }))
    }
    if(rows.isEmpty()) note("这个切片还没有已结算样本", "切换时间窗口，或回到 Records 查看待结算记录。")
}

internal suspend fun Book.metrics(r: ReviewReader, q: Query) {
    when(q.cut) {
        1 -> {
            val d = JSONObject(r.raw("insights.getProbabilityReview",q.window.wire)); val points = d.getJSONArray("points").objects()
            val frozen = d.getJSONObject("frozen")
            section("冻结概率校准", "${frozen.getInt("samples")} 条已配对腿 · ${frozen.getInt("excluded")} 条未纳入")
            note("先有预测，再有结果", "只纳入赛前已冻结、可按选择身份配对且有明确对错的腿。分组比较预测概率均值与实测命中率，一条已登记的腿算一个观测。")
            frozen.getJSONArray("bins").objects().forEach { bin -> val n=bin.getInt("samples"); val label=bin.getString("label")
                add("reliability:$label",Block.Line(label,"$n 条腿",if(n==0) "— · 无样本" else "预测 ${bin.prob("meanPrediction").chance()} / 命中 ${bin.prob("observed").chance()}")) }
            section("滚动概率误差", "逐腿 Conf 对胜负 · ${d.getInt("eligible")} 个有效观测 · 窗宽 ${d.getInt("windowSize")}")
            note("怎样读这两条曲线", "Brier 与 LogLoss 越低越好。按登记时间滚动，比较单腿 Conf 和结果；不是整票命中概率，也不是样本外验证。")
            for ((field,name) in listOf("brier" to "Brier", "logLoss" to "LogLoss")) {
                val pts = points.map { p -> val v = p.getDouble(field); ReviewPoint(p.getString("label"),v,"${v.fmt(4)} · n=${p.getInt("n")} · ${p.getString("match")}",p.text("investmentId")?.let { Dest(Route.History,it) }) }
                if(pts.isNotEmpty()) add(field,Block.Trace(name,"",pts))
            }
            if(points.isEmpty()) note("不足以绘制滚动曲线", "本窗口至少需要 ${d.getInt("minWindow")} 个可评分观测；未画零线。")
        }
        2 -> {
            val d=JSONObject(r.raw("analytics.getDashboardSnapshot",q.window.wire)); section("判断尺度", "Conf 与归一化 AJR · 并非概率误差")
            d.getJSONArray("confCalibration").objects().forEach { j -> val n=j.getInt("samples"); val label=j.getString("label"); add("bin:$label",Block.Line(label,"$n 腿 · 均值",if(n==0) "— · 无样本" else "Conf ${j.number("expected").fmt()} / AJR ${j.number("actual").fmt()}")) }
        }
        else -> {
            val d=JSONObject(r.raw("analytics.getMetricsSnapshot",q.window.wire)); val h=d.getJSONObject("headline"); val rows=d.getJSONArray("matchRows").objects(); val a=r.ledger()
            // matchRows coerces unknown is_correct to false. Recover only presence of a grade,
            // by original id + split-index, never recompute the rate or reuse ticket wins.
            val graded=rows.count { row -> val id=requireNotNull(row.text("investmentId")); val i=row.getString("id").removePrefix("$id-").toInt(); a.exact(id)?.legs?.getOrNull(i)?.correct != null }
            val n=h.getInt("totalInvestments"); val inputs=h.number("totalInputs")
            stats(Stat("已结算投资",n.toString(),"${rows.size} 条比赛腿"),Stat("逐腿命中率",h.number("hitRate").takeIf { graded>0 }.pct(),"$graded 条已判定腿"),Stat("累计投入",inputs.cash(),"已结算本金"),Stat("净盈亏",h.number("totalProfit").cash(),"ROI ${h.number("roi").takeIf { (inputs ?: 0.0)>0 }.pct()}"))
            section("比赛样本", "点击对阵查看原始条目")
            rows.forEach { row -> val id=requireNotNull(row.text("investmentId")); add("sample:${row.id()}",Block.Line(row.getString("match"),"${row.text("dateLabel")} · #$id",row.text("result") ?: "—",Dest(Route.History,id))) }
            if(n==0) note("本窗口没有已结算样本", "待结算不参与统计。")
        }
    }
}

internal suspend fun Book.seasons(r: ReviewReader, q: Query) {
    val index=JSONObject(r.raw("warReport.getCyclePeriods")); val choices=index.getJSONArray("periods").objects().map { it.id() to it.getString("name") }
    if(choices.isEmpty()) { note("还没有资金周期", "可在 History 查看当前账本。"); return }
    val id=q.cycle?.takeIf { wanted -> choices.any { it.first == wanted } } ?: index.getString("currentId")
    add("cycles",Block.Choices(id,choices)); val d=JSONObject(r.raw("warReport.getWarReport",id)); val p=d.getJSONObject("period"); require(p.id()==id) { "返回的赛季不匹配" }
    val k=d.getJSONObject("kpi"); val n=k.getInt("settledCount"); val pending=k.getInt("pendingCount");val stake=k.number("totalInputs")
    section(p.getString("name"),"${p.text("startAt")?.take(10) ?: "创世"} — ${p.text("endAt")?.take(10) ?: "进行中"} · 资金结算周期")
    stats(Stat("赛季净盈亏",k.number("profit").cash(),"$n 笔已结算"),Stat("赛季 ROI",k.number("roi").takeIf { (stake ?: 0.0)>0 }.pct(),"已结算本金"),Stat("整票命中率",k.number("hitRate").takeIf { n>0 }.pct(),"$pending 笔待结算不计入"),Stat("期末余额",p.number("endBalance").cash(),"期初 ${p.number("baseCapital").cash()}"))
    val pts=d.getJSONArray("curve").objects().map { pt -> val b=pt.getDouble("balance"); ReviewPoint(pt.text("label") ?: "余额",b,b.cash()) }
    if(pts.isNotEmpty()) add("balance",Block.Trace("资金轨迹","¥",pts))
    section("赛季记录","${k.getInt("totalCount")} 笔 · 点击回到原票")
    d.getJSONArray("entries").objects().forEach { row -> val first=row.getJSONArray("matches").optJSONObject(0); val title=first?.let { "${it.text("homeTeam") ?: "—"} vs ${it.text("awayTeam") ?: "—"}" } ?: "未记录对阵"
        add("entry:${row.id()}",Block.Line(title,"${row.text("fullDateLabel")} · #${row.id()}",if(row.getBoolean("settled")) row.number("profit").cash() else "待结算",Dest(Route.History,row.id()))) }
    if(n==0) note("本赛季尚无已结算投资", "期初余额不是收益样本。")
}
