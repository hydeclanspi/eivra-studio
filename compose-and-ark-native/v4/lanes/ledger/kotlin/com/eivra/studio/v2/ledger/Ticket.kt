package com.eivra.studio.v2.ledger

import java.math.BigDecimal
import java.util.UUID
import org.json.JSONArray
import org.json.JSONObject

internal fun uid() = UUID.randomUUID().toString()
internal fun JSONObject.text(key: String, fallback: String = ""): String = when (val v = opt(key)) {
    null, JSONObject.NULL -> fallback
    is String, is Number -> v.toString()
    else -> error("字段 $key 不是文本或数字；已保留来源草稿")
}
internal fun JSONArray.objects() = (0 until length()).map { getJSONObject(it) }
internal fun arr(vararg values: Any): JSONArray = JSONArray().also { a -> values.forEach { a.put(it) } }
internal fun <T> List<T>.at(i: Int, f: (T) -> T): List<T> = mapIndexed { j, v -> if (i == j) f(v) else v }
private val decimalPattern = Regex("[+-]?(?:[0-9]+(?:\\.[0-9]+)?|\\.[0-9]+)")
// Parse at a boundary, never in onValueChange. '2.' is a draft, not yet a submitted price.
internal fun decimal(s: String): Double? = s.trim().takeIf(decimalPattern::matches)?.toDoubleOrNull()?.takeIf { it.isFinite() }
internal fun probability(s: String) = decimal(s)?.takeIf { it in 0.0..1.0 }
private fun percentText(s: String): String = s.toBigDecimalOrNull()?.movePointLeft(2)?.stripTrailingZeros()?.toPlainString() ?: s
private fun JSONObject.without(vararg keys: String) = JSONObject(toString()).apply { keys.forEach(::remove) }
internal enum class Stage { Pre, Post }
internal data class Entry(val name: String = "", val odds: String = "", val extra: String = "{}", val key: String = uid()) {
    val empty get() = name.isBlank() && odds.isBlank() && extra == "{}"
    fun json(editing: Boolean) = JSONObject(extra).put("name", if (editing) name else name.trim())
        .put("odds", if (editing) odds else requireNotNull(decimal(odds)))
}
internal data class GoalWindow(val lo: Int, val hi: Int, val modes: Map<Int, String> = emptyMap()) {
    fun json(center: Int) = JSONObject().put("lo", lo).put("hi", hi).put("center", center.coerceIn(lo,hi))
        .put("modes", JSONObject().also { o -> modes.forEach { (i,m) -> o.put(i.toString(), m) } })
    companion object {
        fun initial(n: Int) = GoalWindow((n-1).coerceIn(0,6), (n+1).coerceIn(0,6))
        fun from(o: JSONObject): GoalWindow {
            val lo=o.getInt("lo"); val hi=o.getInt("hi"); require(lo in 0..6 && hi in lo..6)
            val m=o.optJSONObject("modes") ?: JSONObject()
            return GoalWindow(lo,hi,m.keys().asSequence().associate { k ->
                k.toInt().also { require(it in 0..6) } to m.getString(k).also { require(it in listOf("auto","boost","zero")) }
            })
        }
    }
}
private val scoreLabel = Regex("^\\s*(\\d{1,2})\\s*[-:：–]\\s*(\\d{1,2})\\s*$")
internal data class Leg(
    val home: String = "", val away: String = "", val rows: List<Entry> = listOf(Entry(), Entry()),
    val conf: String = "", val confirmed: Boolean = false, val mode: String = "常规",
    val tysH: String = "M", val tysA: String = "M", val fid: String = "0.4",
    val fseH: String = "0.1", val fseA: String = "0.1", val note: String = "",
    val windows: Pair<GoalWindow,GoalWindow>? = null, val extra: String = "{}", val key: String = uid()
) {
    val score get() = rows.firstNotNullOfOrNull { e -> scoreLabel.matchEntire(e.name)?.destructured?.let { (h,a) -> h.toInt() to a.toInt() } }
    fun issue(pre: Boolean): String? = when {
        home.isBlank() || away.isBlank() -> "请填完主队和客队"
        home.trim().equals(away.trim(), ignoreCase = true) -> "主客队不能相同"
        rows.all { it.empty } -> "至少登记一条 Entry"
        rows.any { !it.empty && (it.name.isBlank() || (decimal(it.odds) ?: 0.0) <= 1) } -> "每条已登记 Entry 都需要名称和大于 1 的完整赔率"
        (pre || conf.isNotBlank()) && (probability(conf) == null || !confirmed) -> "请本人确认 0–1 的 Conf"
        listOf(fid, fseH, fseA).any { probability(it) == null } -> "请检查 γ、δ（0–1）"
        else -> null
    }
    fun json(editing: Boolean): JSONObject = JSONObject(extra).apply {
        put("id",key); put("home_team",if (editing) home else home.trim()); put("away_team",if (editing) away else away.trim())
        put("entries",JSONArray((if (editing) rows else rows.filterNot { it.empty }).map { it.json(editing) }))
        put("conf",if (editing) conf else probability(conf) ?: JSONObject.NULL); put("conf_confirmed",confirmed)
        put("mode",mode); put("tys_home",tysH); put("tys_away",tysA); put("fid",if (editing) fid else requireNotNull(decimal(fid)))
        put("fse_home",if (editing) fseH else requireNotNull(decimal(fseH))); put("fse_away",if (editing) fseA else requireNotNull(decimal(fseA)))
        put("note",note); windows?.let { (h,a) -> score?.let { (x,y) -> put("ledger_goal_windows",arr(h.json(x),a.json(y))) } }
    }
    companion object {
        fun from(o: JSONObject, parsed: Boolean): Leg {
            val rows=o.getJSONArray("entries").objects().map { Entry(it.text("name"),it.text("odds"),it.without("name","odds").toString()) }
            val win=o.optJSONArray("ledger_goal_windows")?.let { require(it.length()==2); GoalWindow.from(it.getJSONObject(0)) to GoalWindow.from(it.getJSONObject(1)) }
            fun ratio(k: String, fallback: String): String {
                val s=o.text(k,fallback); return if (!parsed) s else if(s=="default") "0.1" else percentText(s)
            }
            val c=o.text("conf"); val source=o.without("id","home_team","away_team","entries","conf","conf_confirmed","mode","tys_home","tys_away","fid","fse_home","fse_away","note","ledger_goal_windows")
            if(parsed) { source.remove("homeTeam"); source.remove("awayTeam") }
            return Leg(o.text(if(parsed) "homeTeam" else "home_team"),o.text(if(parsed) "awayTeam" else "away_team"),rows.ifEmpty { listOf(Entry()) },
                if(parsed && (c=="50" || c=="50.0")) "" else if(parsed) percentText(c) else c,
                !parsed && o.opt("conf_confirmed") == true, o.text("mode","常规"),o.text("tys_home","M"),o.text("tys_away","M"),o.text("fid","0.4"),
                ratio("fse_home",if(parsed) "10" else "0.1"),ratio("fse_away",if(parsed) "10" else "0.1"),o.text("note"),win,source.toString(),o.text("id").ifBlank(::uid))
        }
    }
}
internal data class Ticket(val legs: List<Leg> = listOf(Leg()), val amount: String = "", val title: String = "", val stage: Stage = Stage.Pre,
                          val quick: String = "", val extra: String = "{}") {
    fun issue(stake: Boolean): String? {
        if(legs.isEmpty()) return "至少要有一场比赛"
        legs.forEachIndexed { i,m -> m.issue(stage==Stage.Pre)?.let { return "第 ${i+1} 场：$it" } }
        return if(stake && (decimal(amount) ?: 0.0)<=0) "请填写大于 0 的实际投入" else null
    }
    fun matches(editing: Boolean) = JSONArray(legs.map { it.json(editing) })
    fun checkpoint() = JSONObject(extra).put("matches",matches(true)).put("combo_name",title).put("inputs",amount)
        .put("entry_mode",if(stage==Stage.Pre) "pre" else "post").put("ledger_quick_text",quick)
    fun record(id: String, stamp: String): JSONObject {
        require(issue(true)==null) { issue(true).orEmpty() }
        val o=JSONObject(extra)
        // Never forward old model output, record identity or settlement labels as a new observation.
        val derived=listOf("forecast_snapshot","expected_return","expected_rating","expected_rating_semantics","combined_odds","ticket_hit_probability","ticket_profit_probability","suggested_amount","settled_at","outcome_available_at","profit","revenues","actual_rating","rep")
        require(derived.none { !o.isNull(it) }) { "草稿含已冻结或已结算数据；请由来源导出可编辑草稿" }
        derived.forEach(o::remove)
        return o.put("id",id).put("created_at",stamp).put("entry_mode",if(stage==Stage.Pre) "pre" else "post").put("status","pending")
            .put("combo_name",title.trim()).put("inputs",requireNotNull(decimal(amount))).put("parlay_size",legs.size).put("matches",matches(false))
    }
    companion object {
        fun from(o: JSONObject, parsed: Boolean=false): Ticket {
            val legs=o.getJSONArray("matches").objects().map { Leg.from(it,parsed) }; require(legs.isNotEmpty()) { "没有可填入的场次" }
            require(legs.map { it.key }.distinct().size==legs.size) { "重复的场次 ID" }
            val stage=when(o.text("entry_mode","pre")){"pre"->Stage.Pre;"post"->Stage.Post;else->error("无法识别草稿模式")}
            val extra=if(parsed) JSONObject() else o.without("matches","inputs","combo_name","entry_mode","ledger_quick_text")
            return Ticket(legs,o.text(if(parsed) "actualInput" else "inputs"),o.text("combo_name"),stage,o.text("ledger_quick_text"),extra.toString())
        }
    }
}
