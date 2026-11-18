package com.eivra.studio.v2.strategy

import com.eivra.studio.v2.api.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

internal fun JSONArray.objects(): List<JSONObject> = List(length()) { getJSONObject(it) }
internal fun JSONObject.text(key: String): String? = if (isNull(key)) null else opt(key)?.toString()?.takeIf { it.isNotBlank() }
internal fun JSONObject.id(key: String) = (get(key) as? String)?.takeIf { it.isNotBlank() } ?: error("缺少有效标识：$key")
internal fun JSONObject.number(key: String): Double? = if (isNull(key)) null else optDouble(key, Double.NaN).takeIf { it.isFinite() }
internal fun Double?.fmt(n: Int = 2): String = this?.let { String.format(Locale.ROOT, "%.${n}f", it) } ?: "—"
internal fun Double?.pct() = this?.let { (100 * it).fmt(1) + "%" } ?: "—"
internal fun args(vararg xs: Any?): JSONArray = JSONArray().apply { xs.forEach { put(it ?: JSONObject.NULL) } }
internal fun obj(vararg xs: Pair<String, Any?>): JSONObject = JSONObject().apply { xs.forEach { (k,v) -> put(k, v ?: JSONObject.NULL) } }
internal fun roleName(s: String?) = when(s) { "stable" -> "稳"; "lever" -> "杠杆"; "neutral_plus" -> "中＋信"; "neutral_soft" -> "中－守"; else -> "未分型" }

internal data class Entry(val name: String, val quote: String?, val market: String?)
internal data class Leg(val key: String, val home: String, val away: String, val role: String?, val conf: Double?, val odds: Double?, val entries: List<Entry>, val issue: String?, val draft: String?, val handoffIssue: String?) {
    val title get() = "$home vs $away"
}
internal data class Plan(val id: String, val rank: Int, val layer: String, val ev: String, val win: String, val odds: Double, val amount: Double, val sharpe: String, val explanation: String, val legs: List<Leg>)
internal sealed interface Report {
    data class Missing(val why: String) : Report
    data class Infeasible(val why: String) : Report
    data class Ready(val plans: List<Plan>, val candidates: Int, val qualified: Int, val simulation: JSONObject?) : Report
}
internal fun decodeLeg(row: JSONObject): Leg {
    val raw = row.getJSONArray("entries")
    val entries = raw.objects().map { Entry(it.id("name"), it.text("odds"), it.text("market_type")) }
    val m = row.optJSONObject("draftMatch")
    val why = when {
        m == null -> "缺少可交接的投前原稿"
        m.text("home_team") != row.text("homeTeam") || m.text("away_team") != row.text("awayTeam") -> "原稿对阵与当前方案不一致"
        entries.isEmpty() || m.optJSONArray("entries")?.let { !sameJson(it,raw) } != false -> "Entry 不完整或原稿与方案不符"
        else -> null
    }
    return Leg(row.id("key"),row.id("homeTeam"),row.id("awayTeam"),row.text("autoRole"),row.number("conf"),row.number("odds"),entries,row.text("inputIssue"),m?.toString(),why)
}
// JSON object order is immaterial; entry array order, nulls and nested metadata are not.
private fun sameJson(a: Any?, b: Any?): Boolean = when {
    a is JSONObject && b is JSONObject -> a.length()==b.length() && a.keys().asSequence().all { b.has(it) && sameJson(a.get(it),b.get(it)) }
    a is JSONArray && b is JSONArray -> a.length()==b.length() && (0 until a.length()).all { sameJson(a.get(it),b.get(it)) }
    a is Number && b is Number -> a.toString().toBigDecimal().compareTo(b.toString().toBigDecimal())==0
    else -> a==b
}
internal fun decodeReport(raw: String, selected: Set<String>): Report {
    val r = JSONObject(raw)
    return when(r.id("status")) {
        "insufficient" -> Report.Missing(r.id("reason"))
        "infeasible" -> Report.Infeasible(r.id("reason"))
        "ready" -> {
            val plans = r.getJSONArray("recommendations").objects().map { p ->
                val legs = p.getJSONArray("subset").objects().map(::decodeLeg)
                require(legs.isNotEmpty() && legs.size==p.getInt("legs") && legs.map { it.key }.distinct().size==legs.size && legs.all { it.key in selected }) { "返回的组合腿数或候选标识不一致" }
                val e = p.optJSONObject("explain")
                Plan(p.id("id"),p.getInt("rank"),p.id("layer"),p.id("ev"),p.id("winRate"),p.number("combinedOdds") ?: error("缺少等效赔率"),p.number("amount") ?: error("缺少分配金额"),p.text("sharpe") ?: "—","U ${p.number("utility").fmt(3)}  ·  同源集中度 ${e?.number("corr").fmt()}  ·  ${when(e?.opt("thresholdPass")){true->"通过阈值"; false->"软约束保留"; else->"阈值未报告"}}",legs)
            }
            require(plans.isNotEmpty() && plans.map { it.id }.distinct().size==plans.size) { "引擎返回了空的或重复的有效方案" }
            Report.Ready(plans,r.getInt("candidateCombos"),r.getInt("qualifiedCombos"),r.optJSONObject("simulation"))
        }
        else -> error("无法识别的求解状态")
    }
}
internal data class Constraints(val risk: Int=50, val minLegs: Int=2, val strategy: String="softPenalty", val allocation: String="balanced", val solver: String="heuristic", val minWin: Int=5, val maxCorr: Int=85, val coverage: Int=55, val gate: Boolean=true, val overlap: Int=60, val beta: Int=12, val lambda: Int=55, val eta: Int=15) {
    fun request(keys: List<String>) = obj("keys" to JSONArray(keys),"riskPref" to risk,"comboStrategy" to strategy,"allocationMode" to allocation,"solverMode" to solver,"qualityFilter" to obj("minWinRate" to minWin,"maxCorr" to maxCorr/100.0,"minCoveragePercent" to coverage,"minCoverageEnabled" to gate,"antiOverlapPercent" to overlap),"comboStructure" to obj("minLegs" to minLegs,"parlayBeta" to beta/100.0,"mmrLambda" to lambda/100.0,"coverageEta" to eta/100.0))
}
internal fun canonicalDraft(p: Plan): JSONObject {
    require(p.legs.isNotEmpty()) { "不能传送空方案" }
    val matches = JSONArray()
    for (leg in p.legs) {
        require(leg.handoffIssue == null && leg.issue == null && leg.draft != null) { leg.handoffIssue ?: leg.issue ?: "缺原稿" }
        matches.put(JSONObject(leg.draft))
    }
    return obj("matches" to matches)
}
internal suspend fun putPlan(ports: StudioPorts, p: Plan, expected: WorkspaceState): Dest = withContext(Dispatchers.IO) {
    check(ports.state.value.let { it.mode==expected.mode && it.revision==expected.revision }) { "工作区已变化，请重新生成。" }
    val receipt = JSONObject(ports.write("draft.put",args(canonicalDraft(p))))
    check(ports.state.value.mode==expected.mode) { "工作区已切换，未打开另一工作区的草稿。" }
    Dest(Route.New, receipt.id("id"))
}
