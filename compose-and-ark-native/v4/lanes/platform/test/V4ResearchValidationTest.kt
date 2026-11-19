package com.eivra.studio.v2.platform

import kotlinx.coroutines.runBlocking
import org.json.*
import org.junit.*
import org.junit.Assert.*
import org.junit.rules.TemporaryFolder

class V4ResearchValidationTest {
 @get:Rule val temp=TemporaryFolder()
 private fun a(vararg xs:Any?)=JSONArray().apply{xs.forEach{put(it)}}
 private fun guard(p:LocalPorts)=JSONObject().put("workspace",p.state.value.mode).put("revision",p.state.value.revision)
 private fun spec()=JSONObject().put("name","Controlled draw").put("team","").put("market","result").put("outcome","draw").put("venue","any").put("stakePerMatch",10).put("manualOdds",3).put("probMode","custom").put("customProb",.3)
 @Test fun officialReplayRequiresPrematchPricesAndWorksWithInferredEvent()=runBlocking{
    val p=LocalPorts({temp.root},PlatformTest.Companion::realEngine);p.write("workspace.switch",a("owner"));assertTrue(JSONObject(p.read("quant.replay",a(spec(),60,60))).getBoolean("empty"))
    fun event()=JSONObject().put("home","切尔西").put("away","阿森纳").put("source","fixture").put("kickoff","2026-01-10T12:00:00.000Z")
    fun quote(side:String,price:Double)=event().put("market","result").put("selection",side).put("odds",price).put("observedAt","2026-01-10T10:59:00.000Z").put("tradable",true)
    val payload=JSONObject().put("schemaVersion",1).put("events",JSONArray()).put("quotes",a(quote("home",2.5),quote("draw",2.0))).put("results",a(event().put("homeGoals",1).put("awayGoals",1).put("availableAt","2026-01-10T15:00:00.000Z")))
    p.write("quant.importEvidence",a(JSONObject().put("evidence",payload),guard(p)));val rev=p.state.value.revision;val result=JSONObject(p.read("quant.replay",a(spec(),60,60)));assertFalse(result.getBoolean("empty"));val s=result.getJSONObject("summary");assertEquals(1,s.getInt("n"));assertEquals(1,s.getInt("hits"));assertEquals(10.0,s.getDouble("totalProfit"),1e-10);assertEquals(0,result.getJSONObject("baseline").getInt("hits"));assertEquals(rev,p.state.value.revision);assertEquals(0,p.state.value.pendingCount)
    val no=JSONObject(p.read("quant.replay",a(spec(),120,60)));assertEquals(0,no.getJSONObject("summary").getInt("n"));assertTrue(no.getJSONArray("excluded").length()>0)
 }
 @Test fun originalRankingsFdrAndWalkAreReadOnlyAndWindowed()=runBlocking {
    val p=LocalPorts({temp.root},PlatformTest.Companion::realEngine);p.write("workspace.switch",a("owner"));val csv=(listOf("date,home,away,homeGoals,awayGoals")+(1..13).map{"2026-01-%02d,切尔西,阿森纳,1,%d".format(java.util.Locale.ROOT,it,if(it<5||it>=11)0 else 1)}).joinToString("\n");p.write("quant.importResults",a(csv,guard(p)));val rev=p.state.value.revision
    val d=JSONObject(p.read("quant.environment"));assertEquals(2,d.getJSONArray("teams").length());assertEquals(13,d.getJSONObject("regime").getJSONObject("recent").getInt("n"));val scan=JSONObject(p.read("quant.scan",a(3,.1)));assertTrue(scan.getInt("total")>0);assertTrue(scan.getInt("survivors") in 0..scan.getInt("total"));assertEquals(0,JSONObject(p.read("quant.scan",a(200,.1))).getInt("total"))
    val idx=JSONObject(p.read("matchResults.getResultsIndex"));val input=JSONObject().put("spec",spec()).put("resultsIndex",idx).put("startDate","2026-01-01").put("endDate","2026-01-13").put("trainDays",7).put("testDays",3).put("minTrainingSamples",2).put("outcomeOptions",a("win","draw"));val walk=JSONObject(p.read("quantValidation.evaluateParameterValidation",a(input)));assertTrue(walk.getJSONArray("folds").length()>0);assertEquals(rev,p.state.value.revision);assertEquals(0,p.state.value.pendingCount)
 }
}
