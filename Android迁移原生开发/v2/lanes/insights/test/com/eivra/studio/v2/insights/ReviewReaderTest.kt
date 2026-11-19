package com.eivra.studio.v2.insights

import com.eivra.studio.v2.api.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import org.json.*
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.time.*

class ReviewReaderTest {
    private val clockDay = LocalDate.parse("2026-11-18")
    private val z = ZoneId.of("UTC")
    // One oracle shared with instrumentation; it is NEVER in the app's main assets.
    private val oracle by lazy { JSONObject(generateSequence(File(System.getProperty("user.dir")).absoluteFile) { it.parentFile }
        .flatMap { base -> sequenceOf("lanes/insights", "Android迁移原生开发/v2/lanes/insights").map { File(base,"$it/testAssets/insights-oracle.json") } }
        .first { it.isFile }.readText()) }
    private inner class Port : StudioPorts {
        override val state = MutableStateFlow(WorkspaceState("demo",1))
        var phase="before"; var gate: (suspend ()->Unit)?=null
        fun next() { phase="after"; state.value=state.value.copy(revision=2) }
        fun reader()=ReviewReader(this,state.value.mode,state.value.revision,z,clockDay)
        override suspend fun read(op:String,args:JSONArray):String {
            val period=when(op) { "analytics.getTeamsSnapshot" -> args.getString(1); "workspace.snapshot", "warReport.getCyclePeriods", "warReport.getWarReport" -> "all"; else -> args.getString(0) }
            val key=mapOf("workspace.snapshot" to "archive","analytics.getDashboardSnapshot" to "dashboard","analytics.getAnalysisSnapshot" to "analysis","analytics.getTeamsSnapshot" to "teams","analytics.getMetricsSnapshot" to "metrics","insights.getProbabilityReview" to "probability","warReport.getCyclePeriods" to "cycles","warReport.getWarReport" to "report").getValue(op)
            val raw=oracle.getJSONObject("$phase/$period").get(key).toString(); gate?.invoke(); return raw
        }
        override suspend fun write(op:String,args:JSONArray):String=error("Insights may not write: $op")
    }
    @Test fun exactIdentityBeatsWindowAndSimilarId() = runBlocking {
        val r=Port().reader(); val q=Query(Dest(Route.History),Window.Week,"0007",2)
        val pin=r.page(q).map { it.block }.filterIsInstance<Block.Line>().single();assertEquals(Dest(Route.History,"0007"),pin.dest)
        val details=r.page(q.copy(dest=pin.dest!!)).map { it.block }; val legs=details.filterIsInstance<Block.Match>()
        assertEquals(listOf("2–1","0–0"),legs.map { it.leg.score });assertEquals(listOf(true,false),legs.map { it.leg.correct });assertEquals(2,legs.first().leg.entries.size)
        val amount=details.filterIsInstance<Block.Stats>().single().values.associate { it.label to it.value }
        assertEquals("¥0.00",amount["返还"]);assertEquals("¥-20.00",amount["净盈亏"])
        assertEquals(30.0,r.ledger().exact("7")!!.revenue!!,0.0)
        val text=details.filterIsInstance<Block.Note>().first().body;assertTrue(text.contains("0.65"));assertTrue(text.contains("42.0%"))
        assertEquals(1,r.ledger().exact("7")!!.legs.size);assertNull(r.ledger().exact("007"))
        val pend=r.ledger().exact("unsettled")!!.legs.single();assertNull(pend.correct);assertNull(pend.score)
    }
    @Test fun sampleBasesAndAliasRoundTrip()=runBlocking {
        val r=Port().reader()
        suspend fun stats(route:Route,win:Window=Window.All)=r.page(Query(Dest(route),win)).map { it.block }.filterIsInstance<Block.Stats>().single().values
        assertEquals("50.0%",stats(Route.Dashboard).single { it.label=="整票命中率" }.value)
        assertEquals("66.7%",stats(Route.Metrics).single { it.label=="逐腿命中率" }.value)
        assertEquals("—",stats(Route.Metrics,Window.Week).single { it.label=="逐腿命中率" }.value)
        val team=r.page(Query(Dest(Route.Teams,"NTH"))).map { it.block }.filterIsInstance<Block.Line>();assertEquals(setOf("0007","unsettled"),team.map { it.dest!!.key }.toSet())
        val season=r.page(Query(Dest(Route.Seasons))).map { it.block };assertTrue(season.filterIsInstance<Block.Line>().any { it.dest==Dest(Route.History,"0007") });assertTrue(season.any { it is Block.Trace })
        assertEquals(2,r.page(Query(Dest(Route.Analysis))).count { it.block is Block.Slice });assertTrue(r.page(Query(Dest(Route.Metrics),cut=1)).any { (it.block as? Block.Line)?.tail=="预测 65.0% / 命中 50.0%" })
    }
    @Test fun oldAnswerFailsOnNewRevisionEvenIfPortReturnsLate()=runBlocking {
        val p=Port();val old=p.reader();val entered=CompletableDeferred<Unit>();val release=CompletableDeferred<Unit>()
        p.gate={ entered.complete(Unit); release.await() };val late=async { runCatching { old.page(Query(Dest(Route.History,"unsettled"))) } };entered.await();p.next();p.gate=null
        val fresh=p.reader().page(Query(Dest(Route.History,"unsettled"))).map { it.block }.filterIsInstance<Block.Match>().single();release.complete(Unit)
        assertTrue(late.await().isFailure);assertEquals("2–0",fresh.leg.score);assertEquals(true,fresh.leg.correct)
    }
    @Test fun dateBoundsUseLocalCalendarNotDuration() {
        val zone=ZoneId.of("Europe/London");val today=LocalDate.parse("2026-03-30")
        assertTrue(Window.Week.includes(Instant.parse("2026-03-23T00:00:00Z"),today,zone));assertFalse(Window.Week.includes(Instant.parse("2026-03-22T23:59:59.999Z"),today,zone));assertFalse(Window.Week.includes(Instant.parse("2026-03-30T23:00:00Z"),today,zone))
    }
}
