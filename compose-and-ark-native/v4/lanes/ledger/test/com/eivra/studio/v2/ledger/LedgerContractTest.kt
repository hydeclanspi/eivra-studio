package com.eivra.studio.v2.ledger

import androidx.lifecycle.SavedStateHandle
import com.eivra.studio.v2.api.WorkspaceState
import kotlinx.coroutines.*
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class LedgerContractTest {
    private suspend fun waitFor(check:()->Boolean) = withTimeout(5000) { while(!check()) delay(4) }
    private fun priced(f: FixturePorts): Ticket = Ticket.from(f.draft).let { it.copy(legs=it.legs.map { m->m.copy(confirmed=true) }) }
    @Test fun portfolioToReceiptToResultToHistory() = runBlocking {
        val p=FixturePorts(); val g=LedgerGateway(p);val s=EditSession(this,SavedStateHandle())
        s.enter(g,p.key);waitFor { s.ready };val l=s.ticket.legs.single()
        assertEquals(listOf("主胜","2-1"),l.rows.map { it.name });assertFalse(l.confirmed)
        s.submit(g);assertFalse(s.writing);assertFalse(p.calls.contains("workspace.saveInvestment"))
        s.leg(0){it.copy(confirmed=true,rows=it.rows.at(1){e->e.copy(odds="4.75")})}
        s.submit(g);s.submit(g);waitFor { !s.writing };assertEquals(p.returned,s.receipt);assertEquals(1,p.calls.count { it=="workspace.saveInvestment" })
        val sent=requireNotNull(p.lastRecord);assertNotEquals(p.returned,sent.getString("id"));assertFalse(sent.has("forecast_snapshot"));assertEquals("p7",sent.getString("source_plan"));val row=sent.getJSONArray("matches").getJSONObject(0)
        assertEquals("fixture-event",row.getString("event_id"));assertEquals("q1",row.getJSONArray("entries").getJSONObject(0).getString("quote_id"));assertEquals(4.75,row.getJSONArray("entries").getJSONObject(1).getDouble("odds"),0.0)
        val target=g.records(s.receipt).single();val st=SettlementSession(this,SavedStateHandle());st.open(target)
        st.edit(ResultForm(listOf(ResultLeg("2-1",true,"0.6","","核对")),"28"));st.submit(g);st.submit(g);waitFor { !st.writing };assertEquals(1,p.calls.count { it=="workspace.settleInvestment" });assertEquals(s.receipt,st.receipt)
        val history=g.records(st.receipt).single();assertEquals("win",history.status);assertEquals("2-1",history.legs.single().defaults.results);assertEquals("28",history.revenue);assertEquals(p.decoy,g.records().single().id)
    }
    @Test fun editableCheckpointsDoNotRoundOrDropMetadata() = runBlocking {
        val p=FixturePorts();val g=LedgerGateway(p); val t=priced(p)
        for(raw in listOf("",".","2.","2.070")){
            val edited=t.copy(quick="草稿",legs=t.legs.at(0){l->l.copy(rows=l.rows.at(0){it.copy(odds=raw)})});val restored=g.load(g.checkpoint(edited));assertEquals(raw,restored.legs.single().rows[0].odds);assertEquals("草稿",restored.quick);assertEquals(raw!="2.070",restored.issue(true)!=null)
        };assertFalse(p.calls.contains("workspace.saveInvestment"))
    }
    @Test fun twoMatchesTwoEntriesEachInOrder(){val p=FixturePorts();val leg=p.draft.getJSONArray("matches").getJSONObject(0);p.draft.getJSONArray("matches").put(JSONObject(leg.toString()).put("id","leg-b").put("home_team","金陵").put("away_team","南山"));val r=priced(p).record("attempt","2026-01-01T00:00:00Z").getJSONArray("matches");assertEquals(listOf("leg-a","leg-b"),r.objects().map { it.getString("id") });assertEquals(listOf(2,2),r.objects().map{it.getJSONArray("entries").length()})}
    @Test fun parserDoesNotConfirmFiftyOrInventPrices()=runBlocking {
        val p=LedgerGateway(FixturePorts()).parse("样例").ticket.legs.single();assertEquals("",p.conf);assertFalse(p.confirmed);assertEquals("",p.rows.single().odds);assertEquals("0.1",p.fseA)
    }
    @Test fun lateParseCannotReplaceNewTyping()=runBlocking {
        val f=FixturePorts();f.holdParse=CompletableDeferred();val g=LedgerGateway(f);val s=EditSession(this,SavedStateHandle());s.enter(g,null);s.edit(s.ticket.copy(quick="先解析"));s.parse(g);withTimeout(5000){f.parseStarted.await()};s.leg(0){it.copy(home="我刚改的主队")};f.holdParse!!.complete(Unit);coroutineContext.job.children.toList().joinAll();assertNull(s.parsed);assertEquals("我刚改的主队",s.ticket.legs.single().home)
    }
    @Test fun invalidDistributionCannotReachWrite()=runBlocking {val p=FixturePorts();val g=LedgerGateway(p);val t=priced(p);p.valid=false;assertTrue(runCatching{g.save(t,"a")}.isFailure);p.valid=true;p.mass=0.6;assertTrue(runCatching{g.save(t,"a")}.isFailure);assertFalse(p.calls.contains("workspace.saveInvestment"))}
    @Test fun postImportCanBeUnratedButNeverPretendsToBePre()=runBlocking {val p=FixturePorts();val t=priced(p).let { it.copy(stage=Stage.Post,legs=it.legs.at(0){l->l.copy(conf="",confirmed=false)}) };val g=LedgerGateway(p);assertEquals(p.returned,g.save(t,"attempt"));assertEquals(listOf("workspace.importInvestment"),p.calls.toList());assertTrue(p.lastRecord!!.getJSONArray("matches").getJSONObject(0).isNull("conf"));assertFalse(p.lastRecord!!.has("forecast_snapshot"));assertTrue(runCatching{g.save(t.copy(extra="""{"forecast_snapshot":{"old":1}}"""),"other")}.isFailure)}
    @Test fun missingReceiptOrPermissionIsNotSuccess()=runBlocking {val p=FixturePorts();val t=priced(p);val g=LedgerGateway(p);p.missingId=true;assertTrue(runCatching{g.save(t,"a")}.isFailure);p.state.value=WorkspaceState("read_only");val before=p.calls.size;assertTrue(runCatching{g.save(t,"b")}.isFailure);assertEquals(before,p.calls.size)}
    @Test fun missingRouteKeyNeverFallsBackToDecoy()=runBlocking {val p=FixturePorts();val g=LedgerGateway(p);assertTrue(g.records("missing").isEmpty());assertTrue(runCatching{g.load("missing")}.isFailure);assertEquals("pending",p.records.getValue(p.decoy).getString("status"))}
    @Test fun unsetHitAndBlankRevenueDifferFromExplicitLossAndZero(){val n=ResultLeg();assertNotNull(ResultForm(listOf(n),"0").issue());assertNotNull(ResultForm(listOf(n.copy(hit=false)),"").issue());assertNull(ResultForm(listOf(n.copy(hit=false)),"0").issue());assertNotNull(ResultForm(listOf(n.copy(hit=true,ajr="0.81")),"1").issue())}
    @Test fun failedWriteKeepsTypedStakeAndCheckpointRestoresAfterNewSession()=runBlocking {val p=FixturePorts();val g=LedgerGateway(p);val keys=SavedStateHandle();val s=EditSession(this,keys);s.enter(g,p.key);waitFor{s.ready};s.leg(0){it.copy(confirmed=true)};s.edit(s.ticket.copy(amount="31.40"));s.submit(g,true);waitFor{!s.writing};p.failWrite=true;s.submit(g);waitFor{!s.writing};assertNull(s.receipt);val other=EditSession(this,keys);other.enter(g,p.key);waitFor{other.ready};assertEquals("31.40",other.ticket.amount);assertTrue(other.ticket.legs.single().confirmed)}
}
