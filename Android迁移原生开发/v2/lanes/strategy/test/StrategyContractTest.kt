package com.eivra.studio.v2.strategy

import com.eivra.studio.v2.api.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import org.json.*
import org.junit.Assert.*
import org.junit.Test

class StrategyContractTest {
    private val ws=WorkspaceState("demo",7)
    private fun leg(k:String):JSONObject {
        val e=args(obj("name" to "win","odds" to 2.4,"semantic_key" to "$k:w"),obj("name" to "draw","odds" to null,"metadata" to obj("why" to "keep")))
        val m=obj("home_team" to "H$k","away_team" to "A$k","source_match_id" to k,"event_id" to "event-$k","entries" to e,"note" to "$k 投前", "conf" to null)
        return obj("key" to k,"homeTeam" to "H$k","awayTeam" to "A$k","entries" to e,"draftMatch" to m)
    }
    private fun generated(a:JSONObject=leg("x"),b:JSONObject=leg("y"))=obj("status" to "ready","candidateCombos" to 1,"qualifiedCombos" to 1,"recommendations" to args(obj("id" to "combo-1","legs" to 2,"rank" to 1,"layer" to "次推","ev" to "+1.0%","winRate" to "25%","combinedOdds" to 4.1,"amount" to 10,"subset" to args(a,b)))).toString()
    private fun plan(raw:String=generated())=(decodeReport(raw,setOf("x","y")) as Report.Ready).plans.single()
    private class DraftPort(val receipt:String="{\"id\":\"issued-by-port\"}"):StudioPorts {
        override val state=MutableStateFlow(WorkspaceState("demo",7)); val ops=mutableListOf<String>(); lateinit var saved:JSONObject
        override suspend fun read(op:String,args:JSONArray):String=error("unexpected read $op")
        override suspend fun write(op:String,args:JSONArray):String { ops+=op; check(op=="draft.put"); saved=JSONObject(args.getJSONObject(0).toString()); return receipt }
    }
    @Test fun twoMatchesTwoEntriesEachStayIntactAndOnlyDraftPut()=runBlocking {
        val ports=DraftPort(); assertEquals(Dest(Route.New,"issued-by-port"),putPlan(ports,plan(),ws)); assertEquals(listOf("draft.put"),ports.ops)
        val ms=ports.saved.getJSONArray("matches"); assertEquals(2,ms.length()); listOf("x","y").forEachIndexed { i,k -> val m=ms.getJSONObject(i); assertEquals(k,m.getString("source_match_id"));assertTrue(m.isNull("conf")); assertFalse(m.has("conf_confirmed")); val e=m.getJSONArray("entries");assertEquals(2,e.length());assertEquals("$k:w",e.getJSONObject(0).getString("semantic_key"));assertTrue(e.getJSONObject(1).isNull("odds"));assertEquals("keep",e.getJSONObject(1).getJSONObject("metadata").getString("why")) }
    }
    @Test fun badReceiptNeverResolvesADestination()=runBlocking { for(receipt in listOf("{}","{\"id\":null}","{\"id\":23}","{\"id\":\"  \"}")) { val port=DraftPort(receipt); assertTrue(runCatching { putPlan(port,plan(),ws) }.isFailure); assertEquals(listOf("draft.put"),port.ops) } }
    @Test fun missingSecondEntryIsNotSilentlyRebuilt()=runBlocking { val a=leg("x");a.getJSONObject("draftMatch").put("entries",args(a.getJSONArray("entries").get(0)));val port=DraftPort();assertTrue(runCatching {putPlan(port,plan(generated(a)),ws)}.isFailure); assertTrue(port.ops.isEmpty()) }
    @Test fun mismatchedSelectionAndRevisionBlockHandoff()=runBlocking { assertTrue(runCatching {decodeReport(generated(),setOf("x"))}.isFailure);val p=DraftPort();p.state.value=ws.copy(revision=8);assertTrue(runCatching{putPlan(p,plan(),ws)}.isFailure);assertTrue(p.ops.isEmpty()) }
    @Test fun missingInfeasibleAndReadyAreNotInterchangeable() { assertTrue(decodeReport("{\"status\":\"insufficient\",\"reason\":\"missing quote\"}",emptySet()) is Report.Missing);assertTrue(decodeReport("{\"status\":\"infeasible\",\"reason\":\"strict\"}",emptySet()) is Report.Infeasible);assertEquals(2,plan().legs.size); assertTrue(runCatching{decodeReport("{}",emptySet())}.isFailure) }
    @Test fun staleNonCooperativeSuccessCannotReplaceLatest()=runBlocking {
        val slot=LatestRead<String>(this); val started=CompletableDeferred<Unit>();val release=CompletableDeferred<Unit>();val finished=CompletableDeferred<Unit>();val thread=Thread.currentThread()
        slot.start { assertNotSame(thread,Thread.currentThread()); started.complete(Unit); withContext(NonCancellable){release.await()};finished.complete(Unit);"old" }
        withTimeout(5000){started.await()};slot.start {"new"};withTimeout(5000){slot.state.first { it==ReadState.Value("new") }};release.complete(Unit);withTimeout(5000){finished.await()};coroutineContext[Job]!!.children.toList().joinAll(); assertEquals(ReadState.Value("new"),slot.state.value)
    }
    @Test fun cancellationDiscardsEvenLateFailure()=runBlocking {
        val slot=LatestRead<String>(this);val began=CompletableDeferred<Unit>();val release=CompletableDeferred<Unit>()
        slot.start { began.complete(Unit);withContext(NonCancellable){release.await()};error("old failure") };withTimeout(5000){began.await()};slot.invalidate();release.complete(Unit);coroutineContext[Job]!!.children.toList().joinAll();assertEquals(ReadState.Idle,slot.state.value)
    }
}
