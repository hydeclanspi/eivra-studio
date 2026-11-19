package com.eivra.studio.v2.strategy

import com.eivra.studio.v2.api.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.runBlocking
import org.json.*
import org.junit.Assert.*
import org.junit.Test
import java.io.File

class ResearchContractTest {
    // One source of truth for JVM + instrumented test assets. Never in main assets.
    private fun golden():JSONObject {
        val root=generateSequence(File(System.getProperty("user.dir")).absoluteFile){it.parentFile}.map { File(it,"lanes/strategy/testAssets/engine-synthetic.json") }.first{it.isFile}
        return JSONObject(root.readText())
    }
    private class Reads(val answer:(String,JSONArray)->JSONObject):StudioPorts {
        override val state=MutableStateFlow(WorkspaceState("demo",1));val ops=mutableListOf<String>()
        override suspend fun read(op:String,args:JSONArray):String {ops+=op;return answer(op,args).toString()}
        override suspend fun write(op:String,args:JSONArray):String=error("preview must not write: $op")
    }
    @Test fun realWebOutputDecodesWithoutDroppingASecondEntry() {
        val g=golden();val pool=g.getJSONArray("candidates").objects().map(::decodeLeg);val r=decodeReport(g.getJSONObject("output").toString(),pool.map{it.key}.toSet());val valid=verifySelection(r,pool,2) as Report.Ready
        val p=valid.plans.single();val m=canonicalDraft(p).getJSONArray("matches");assertEquals(4.93,p.odds,0.0);assertEquals(50000,valid.simulation!!.getInt("iterations"));assertEquals(listOf(2,2),m.objects().map{it.getJSONArray("entries").length()});assertEquals("d",m.getJSONObject(1).getJSONArray("entries").getJSONObject(1).getJSONObject("extra").getString("side"));assertTrue(verifySelection(r,pool,3) is Report.Infeasible)
        assertTrue(runCatching{verifySelection(r,pool.map{it.copy(entries=it.entries.take(1))},2)}.isFailure)
    }
    @Test fun noHistoryIsNotAZeroReturnOrAMissingPort()=runBlocking {
        val p=Reads {_,_->obj("matches" to JSONArray())};assertTrue(experiment(p,Rule(),"walk").missing);assertEquals(listOf("matchResults.getResultsIndex"),p.ops)
        val broken=Reads{_,_->error("Unregistered operation")};assertTrue(runCatching{experiment(broken,Rule(),"walk")}.isFailure)
    }
    @Test fun conditionalSimulationDoesNotReadHistoryOrPlaceAnOrder()=runBlocking {
        val p=Reads {op,a-> assertEquals("quantStrategy.analyzeStrategy",op);assertEquals(0,a.getJSONArray(1).length());golden().getJSONObject("sim")};val s=experiment(p,Rule(probMode="custom"),"simulation");assertFalse(s.missing);assertEquals(6,s.rows.size);assertTrue(s.rows.all{"估计场次" in it.more})
    }
    @Test fun walkForwardLabelsSeparateTrainingAndHeldOut()=runBlocking {
        val p=Reads {op,a->if(op=="matchResults.getResultsIndex")obj("matches" to args(obj("date" to "2026-01-01"))) else {assertEquals("quantStrategy.walkForwardStrategy",op);assertEquals(.7,a.getJSONObject(2).getDouble("trainRatio"),0.0);golden().getJSONObject("wf")}};val s=experiment(p,Rule(),"walk");assertFalse(s.missing);assertTrue(s.rows[0].detail.contains("/ 16"));assertTrue(s.rows[1].detail.contains("/ 8"))
    }
    @Test fun partialEditsNeverBecomeDefaultInputs() {assertNotNull(Rule(odds=".").issue("scenario"));assertNotNull(Rule(probMode="custom",prob="").issue("simulation"));assertNotNull(Rule(train="2").issue("rolling"));assertNull(Rule().issue("walk"))}
}
