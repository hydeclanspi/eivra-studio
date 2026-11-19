package com.eivra.studio.v2.strategy

import com.eivra.studio.v2.api.StudioPorts
import kotlinx.coroutines.CancellationException
import org.json.*
import java.io.Serializable
import java.time.Instant

internal data class Rule(val team:String="",val venue:String="any",val market:String="score",val scoreFor:String="1",val against:String="1",val outcome:String="win",val odds:String="6.5",val stake:String="20",val count:String="6",val prob:String="12",val probMode:String="base",val ratio:Int=70,val train:String="180",val test:String="30",val minimum:String="20",val name:String="",val hypothesis:String="",val falsifier:String="") : Serializable {
    fun issue(kind:String):String? = when {
        odds.toDoubleOrNull()?.let{it.isFinite() && it>1.0}!=true -> "假定赔率必须大于 1。"
        stake.toDoubleOrNull()?.let{it.isFinite() && it>0}!=true -> "每场单位必须是正数。"
        market=="score" && listOf(scoreFor,against).any { it.toIntOrNull() !in 0..9 } -> "比分两侧都需要 0–9 的整数。"
        kind=="simulation" && count.toIntOrNull() !in 1..20 -> "模拟场次须为 1–20。"
        kind=="simulation" && probMode=="custom" && prob.toDoubleOrNull()?.let { it.isFinite() && it in 0.0..100.0 }!=true -> "自定义概率须在 0–100% 之间。"
        kind=="rolling" && (train.toIntOrNull() !in 7..3650 || test.toIntOrNull() !in 1..365 || minimum.toIntOrNull() !in 1..10000) -> "训练窗 7–3650 天、后窗 1–365 天，最低训练样本 1–10000。"
        else -> null
    }
    fun spec()=obj("name" to name,"team" to team.trim(),"venue" to venue,"market" to market,"score" to if(market=="score") obj("for" to scoreFor.toInt(),"against" to against.toInt()) else null,"outcome" to outcome,"manualOdds" to odds.toDouble(),"oddsMode" to "manual","probMode" to probMode,"stakePerMatch" to stake.toDouble(),"matchesPlanned" to count.toIntOrNull(),"customProb" to prob.toDoubleOrNull()?.div(100))
    fun rolling(index:JSONObject)=obj("spec" to spec(),"resultsIndex" to index,"trainDays" to train.toInt(),"testDays" to test.toInt(),"minTrainingSamples" to minimum.toInt(),"venueOptions" to args(venue),"assumedOddsOptions" to args(odds.toDouble()))
}
internal data class EvidenceRow(val title:String,val detail:String,val more:String="")
internal data class Sheet(val title:String,val boundary:String,val rows:List<EvidenceRow> = emptyList(),val facts:List<Pair<String,String>> = emptyList(),val missing:Boolean=false)
internal suspend fun StudioPorts.objectRead(op:String,vararg a:Any?)=JSONObject(read(op,args(*a)))
internal fun missing(s:String)=Sheet("缺少样本",s,missing=true)
private fun windowRow(label:String,w:JSONObject):EvidenceRow {
    val n=w.getInt("n"); val ci=w.optJSONObject("hitCI")
    return EvidenceRow(label,"${w.getInt("hits")} / $n 命中 · ${w.number("hitRate").pct()}",if(n==0) "没有可用场次" else "95% 区间 ${ci?.number("low").pct()} – ${ci?.number("high").pct()}\n假定价 ROI ${w.number("roi").pct()}")
}
internal suspend fun experiment(p:StudioPorts,r:Rule,kind:String):Sheet {
    require(r.issue(kind)==null) {r.issue(kind) ?: "参数不合法"}; val spec=r.spec()
    if(kind=="simulation") {
        val a=p.objectRead("quantStrategy.analyzeStrategy",spec,JSONArray(),obj("now" to Instant.now().toString()))
        if(a.opt("available")==false) return missing(a.text("message") ?: "概率不可用")
        val mc=a.getJSONObject("monteCarlo");val legs=a.getJSONArray("legs").objects();if(legs.isEmpty() || mc.getInt("iterations")<1) return missing("没有可用的模拟腿。")
        return Sheet("条件推演 · ${legs.size} 场","使用手动赔率；没有联网报价。估计场次不是已开赛或已结算场次。",legs.mapIndexed { i,l->EvidenceRow("${i+1} · ${l.text("label") ?: "估计场次"}","p ${l.number("p").pct()}  ·  ×${l.number("odds").fmt()}",if(l.optBoolean("estimated")) "估计场次 · 仅用于条件推演" else "已匹配赛程") },listOf("抽样次数" to mc.getInt("iterations").toString(),"盈利概率" to mc.number("pProfit").pct(),"中位损益" to mc.number("medianProfit").fmt(),"P5 / P95" to "${mc.number("p5").fmt()} / ${mc.number("p95").fmt()}"))
    }
    val index=p.objectRead("matchResults.getResultsIndex"); if(index.getJSONArray("matches").length()==0) return missing("本地没有历史赛果。可在 Console 导入可信样本；这里不会自动联网。")
    return when(kind) {
        "scenario" -> {
            val b=p.objectRead("quantStrategy.backtestStrategy",spec,index,r.odds.toDouble());if(b.getInt("n")==0) missing("当前球队与场地口径下没有比赛。") else Sheet("历史假定价情景",b.id("disclaimer"),listOf(windowRow("整个样本",b))+b.getJSONArray("equityCurve").objects().map { EvidenceRow("第 ${it.getInt("i")} 场","累计情景损益 ${it.number("cum").fmt()}") },listOf("情景赔率" to b.number("assumedOdds").fmt(),"最大回撤" to b.number("maxDrawdown").fmt()))
        }
        "walk" -> {
            val w=p.objectRead("quantStrategy.walkForwardStrategy",spec,index,obj("trainRatio" to r.ratio/100.0,"assumedOdds" to r.odds.toDouble()));val tr=w.getJSONObject("train");val te=w.getJSONObject("test")
            if(te.getInt("n")==0) missing("训练段 ${tr.getInt("n")} 场，后段没有可检验比赛。") else Sheet("按时序留后检验","一次时间切分，不是独立前瞻验证；仅比较同一假定价格下的两段。",listOf(windowRow("训练段",tr),windowRow("后段",te)),listOf("切分位置" to w.getInt("splitAt").toString(),"假定赔率" to w.number("assumedOdds").fmt()))
        }
        "rolling" -> {
            val v=try { p.objectRead("quantValidation.evaluateParameterValidation",r.rolling(index)) } catch(c:CancellationException){throw c} catch(e:Exception){val msg=e.message.orEmpty();if("没有具备有效日期" in msg || "不足一个训练窗" in msg)return missing(msg);throw e}
            val folds=v.getJSONArray("folds").objects();val n=v.getJSONObject("summary").getInt("n");val rows=folds.map { f -> val tr=f.getJSONObject("trainingRange");val te=f.getJSONObject("testingRange");val summary=f.getJSONObject("summary");EvidenceRow("窗口 ${f.getInt("number")} · ${te.id("start")} 至 ${te.id("endExclusive")}（不含）","后窗 ${summary.getInt("n")} 场 · ${summary.number("hitRate").pct()}","训练 [${tr.id("start")}, ${tr.id("endExclusive")})\n${f.text("selectedCandidateId") ?: "训练样本未达门槛"} · 排除 ${f.getJSONArray("excluded").length()} 场") }
            Sheet(if(n==0) "缺少可比较的后窗样本" else "滚动观察 · $n 场后窗","仅以声明的规则运行；日期末 UTC 结算是假设，后窗已被查看。",rows,listOf("窗口数" to folds.size.toString(),"配对样本" to n.toString()),missing=n==0)
        }
        else -> error("未知实验类型")
    }
}

internal fun guard(ws:com.eivra.studio.v2.api.WorkspaceState)=obj("workspace" to ws.mode,"revision" to ws.revision)
