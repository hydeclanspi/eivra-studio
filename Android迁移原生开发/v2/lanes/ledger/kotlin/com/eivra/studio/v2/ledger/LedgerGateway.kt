package com.eivra.studio.v2.ledger

import com.eivra.studio.v2.api.StudioPorts
import java.time.Instant
import kotlin.math.abs
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

internal data class Preview(val odds: Double, val mean: Double, val suggested: Double, val hit: Double, val stamp: String)
internal data class ScoreCell(val h: Int, val a: Int, val p: Double)
internal data class Parsed(val ticket: Ticket, val diagnostics: String)
internal data class ResultLeg(val results: String="", val hit: Boolean?=null, val ajr: String="", val rep: String="", val note: String="") {
    fun json() = JSONObject().put("results",results.trim()).put("isCorrect",requireNotNull(hit)).put("matchRating",ajr.trim()).put("matchRep",rep.trim()).put("postNote",note.trim())
}
internal data class ResultForm(val legs: List<ResultLeg>, val revenue: String="") {
    fun issue(): String? {
        legs.forEachIndexed { i,l ->
            if(l.hit==null) return "第 ${i+1} 场：请选择是否命中"
            if(l.ajr.isNotBlank() && decimal(l.ajr)?.let { it in 0.0..0.8 } != true) return "第 ${i+1} 场：AJR 需在 0–0.8 之间，或留空"
            if(l.rep.isNotBlank() && decimal(l.rep)==null) return "第 ${i+1} 场：请检查 REP"
        }
        return if(legs.isEmpty() || decimal(revenue)?.let { it>=0 }!=true) "请输入整笔实际回款；没有回款请写 0" else null
    }
    fun json() = JSONObject().put("matches",JSONArray(legs.map { it.json() })).put("revenues",revenue.trim())
}
internal data class StoredLeg(val key: String,val home: String,val away: String,val entryLine: String,val defaults: ResultLeg)
internal data class Stored(val id: String,val title: String,val status: String,val inputs: String,val revenue: String,val legs: List<StoredLeg>,val created: String) {
    val initial get() = ResultForm(legs.map { it.defaults },revenue)
    companion object {
        fun from(o: JSONObject): Stored {
            val legs=o.getJSONArray("matches").objects().mapIndexed { i,m ->
                val desc=m.optJSONArray("entries")?.objects()?.joinToString("  ·  ") { e -> listOf(e.text("name"),e.text("odds")).filter { it.isNotBlank() }.joinToString(" @ ") }?.ifBlank { null } ?: m.text("entry_text")
                StoredLeg(m.text("id","#$i"),m.text("home_team"),m.text("away_team"),desc,ResultLeg(m.text("results"),m.opt("is_correct") as? Boolean,m.text("match_rating"),m.text("match_rep"),m.text("post_note")))
            }
            return Stored(o.text("id").also { require(it.isNotBlank()) },o.text("combo_name"),o.text("status"),o.text("inputs"),o.text("revenues"),legs,o.text("created_at"))
        }
    }
}
private fun JSONObject.finite(k: String): Double = (get(k) as? Number)?.toDouble()?.takeIf { it.isFinite() } ?: error("模型返回的 $k 无效")
internal fun canWrite(mode: String) = mode == "owner" || mode == "demo"
internal class LedgerGateway(private val ports: StudioPorts, private val mode: String = ports.state.value.mode) {
    private fun writable() = check(canWrite(mode) && ports.state.value.mode==mode) { "当前工作区不可写；草稿仍在本页" }
    private fun receipt(raw: String, durable: Boolean): String {
        val o=JSONObject(raw); val id=o.opt("id") as? String
        require(!id.isNullOrBlank()) { "没有收到有效记录 ID；请在待结算中核对，不要重复新建" }
        if(durable) require(o.opt("revision") is Number && o.getLong("revision")>=0) { "缺少写入版本，请核对账本" }
        return id
    }
    suspend fun load(key: String) = withContext(Dispatchers.IO) { Ticket.from(JSONObject(ports.read("draft.get",arr(key)))) }
    suspend fun checkpoint(t: Ticket) = withContext(Dispatchers.IO) { writable(); receipt(ports.write("draft.put",arr(t.checkpoint())),false) }
    suspend fun parse(s: String) = withContext(Dispatchers.IO) {
        val r=JSONObject(ports.read("naturalInputParser.parseNaturalInput",arr(s)))
        val msg=r.optJSONArray("diagnostics")?.objects()?.joinToString("；") { it.text("message") }.orEmpty()
        require(r.optJSONArray("matches")?.length()?.let { it>0 }==true) { msg.ifBlank { "未识别到比赛；请写主队、客队和判断，再解析" } }
        Parsed(Ticket.from(r,true),msg)
    }
    suspend fun predict(t: Ticket, stamp: String=Instant.now().toString()) = withContext(Dispatchers.IO) {
        require(t.stage==Stage.Pre && t.issue(false)==null) { t.issue(false) ?: "投后不回算预测" }
        val raw=JSONObject(ports.read("forecast.buildDraft",arr(t.matches(false),stamp)))
        check(raw.getJSONObject("combinedProfile").opt("valid")!=false) { "赔率分布无效，未冻结" }
        val snap=raw.optJSONObject("forecastSnapshot") ?: error("内核没有生成有效快照，未冻结")
        val states=snap.getJSONArray("states").objects(); require(states.isNotEmpty() && states.all { it.finite("probability") in 0.0..1.0 && it.finite("gross")>=0 } && abs(states.sumOf { it.finite("probability") }-1)<1e-6) { "预测概率分布不完整，未冻结" }
        require(snap.getJSONArray("legs").length()==t.legs.size && Instant.parse(snap.getString("generated_at"))==Instant.parse(stamp)) { "快照不是本次判断的结果" }
        val mean=raw.finite("expectedRating"); val odds=raw.finite("combinedOdds"); val suggested=raw.finite("recommendedInvest"); val hit=snap.finite("ticket_hit_probability")
        require(mean in 0.0..1.0 && odds>0 && suggested>=0 && hit in 0.0..1.0) { "内核指标超出有效范围" }
        Preview(odds,mean,suggested,hit,stamp)
    }
    suspend fun save(t: Ticket, stableId: String): String = withContext(Dispatchers.IO) {
        writable(); val at=Instant.now().toString(); val r=t.record(stableId,at)
        if(t.stage==Stage.Pre) predict(t,at) // commit-time preflight; platform still freezes inside its transaction
        writable(); receipt(ports.write(if(t.stage==Stage.Pre) "workspace.saveInvestment" else "workspace.importInvestment",arr(r)),true)
    }
    suspend fun records(key: String?=null) = withContext(Dispatchers.IO) {
        JSONObject(ports.read("workspace.snapshot")).getJSONArray("investments").objects()
            .filter { if(key!=null) it.text("id")==key else it.text("status")=="pending" }.map(Stored::from)
            .also { rows -> require(rows.distinctBy { it.id }.size==rows.size) { "账本中有重复的记录 ID" } }
    }
    suspend fun settle(target: Stored, f: ResultForm): String = withContext(Dispatchers.IO) {
        writable(); require(f.issue()==null && f.legs.size==target.legs.size) { f.issue() ?: "场数已变更" }
        val now=records(target.id).singleOrNull() ?: error("指定记录不存在")
        require(target==now && now.status=="pending") { "记录已改变或已结算，请刷新后核对" }
        writable(); val id=receipt(ports.write("workspace.settleInvestment",arr(target.id,f.json())),true)
        require(id==target.id) { "回执不是当前记录，请核对 History" }; id
    }
    suspend fun cells(h: GoalWindow,a: GoalWindow,score: Pair<Int,Int>) = withContext(Dispatchers.IO) {
        suspend fun weights(w: GoalWindow, c: Int): JSONArray = JSONArray(ports.read("preMatchOpinion.weightsFromSlider",arr(w.json(c)))).also { require(it.length()==7) }
        val cells=JSONArray(ports.read("preMatchOpinion.jointScoreCells",arr(weights(h,score.first),weights(a,score.second)))).objects().map { ScoreCell(it.getInt("home"),it.getInt("away"),it.finite("p")) }
        require(cells.all { it.h in 0..6 && it.a in 0..6 && it.p in 0.0..1.0 } && abs(cells.sumOf { it.p }-1)<1e-6) { "比分分布无效" }; cells
    }
}
