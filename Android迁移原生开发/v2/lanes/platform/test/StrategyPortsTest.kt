package com.eivra.studio.v2.platform

import kotlinx.coroutines.runBlocking
import org.junit.*
import org.junit.Assert.*
import org.junit.rules.TemporaryFolder
import org.json.*

class StrategyPortsTest {
    @get:Rule val tmp=TemporaryFolder()
    @Test fun proposalIsOneEditableDraftAndResearchCannotCommit()=runBlocking {
        val p=LocalPorts({tmp.root},PlatformTest.Companion::realEngine);p.write("workspace.switch",PlatformTest.args("owner"))
        val matches=PlatformTest.cases.getJSONObject(1).getJSONArray("matches");matches.getJSONObject(0).getJSONArray("entries").getJSONObject(0).put("origin_note","synthetic")
        val rec=PlatformTest.record("candidate",matches);val first=p.write("workspace.saveInvestment",PlatformTest.args(rec));val count=p.state.value.pendingCount;val rev=p.state.value.revision
        assertEquals(first,p.write("workspace.saveInvestment",PlatformTest.args(JSONObject(rec.toString()).put("created_at","2026-11-18T00:00:03Z"))))
        val rows=JSONArray(p.read("portfolio.candidates"));assertEquals(2,rows.length());val keys=JSONArray().put(rows.getJSONObject(0).getString("key")).put(rows.getJSONObject(1).getString("key"))
        val g=JSONObject(p.read("portfolio.generate",PlatformTest.args(JSONObject().put("keys",keys))));assertEquals("ready",g.getString("status"));val subset=g.getJSONArray("recommendations").getJSONObject(0).getJSONArray("subset");assertTrue(subset.length()>0)
        val legs=JSONArray();for(i in 0 until subset.length()){val m=subset.getJSONObject(i).getJSONObject("draftMatch");assertFalse(m.getBoolean("conf_confirmed"));assertFalse(m.has("is_correct"));legs.put(m)}
        assertEquals("synthetic",rows.getJSONObject(0).getJSONObject("draftMatch").getJSONArray("entries").getJSONObject(0).getString("origin_note"))
        val index=JSONObject(p.read("matchResults.getResultsIndex"));val spec=JSONObject("""{"market":"score","score":{"for":1,"against":1},"oddsMode":"manual","manualOdds":6.5,"probMode":"custom","customProb":0.12,"stakePerMatch":20,"matchesPlanned":6}""")
        assertEquals(0,JSONObject(p.read("quantStrategy.backtestStrategy",PlatformTest.args(spec,index,6.5))).getInt("n"));assertTrue(JSONObject(p.read("quantStrategy.analyzeStrategy",PlatformTest.args(spec,JSONArray(),JSONObject()))).has("monteCarlo"))
        val cycle=JSONObject(p.read("warReport.getCyclePeriods")).getString("currentId");assertTrue(JSONObject(p.read("warReport.getWarReport",PlatformTest.args(cycle))).has("kpi"));assertTrue(JSONObject(p.read("insights.getProbabilityReview",PlatformTest.args("all"))).has("frozen"));assertEquals(rev,p.state.value.revision)
        val draft=JSONObject().put("matches",legs);val key=JSONObject(p.write("draft.put",PlatformTest.args(draft))).getString("id");PlatformTest.same(draft,JSONObject(p.read("draft.get",PlatformTest.args(key))));assertEquals(count,p.state.value.pendingCount)
    }
}
