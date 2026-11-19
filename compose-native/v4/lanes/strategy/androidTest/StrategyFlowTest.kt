package com.eivra.studio.v2.strategy

import android.graphics.Bitmap
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.flow.MutableStateFlow
import org.json.*
import org.junit.*
import org.junit.runner.RunWith
import java.io.File
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicReference

/** Uses output of test/web-parity.mjs, not an engine substitute in the application. */
@RunWith(AndroidJUnit4::class)
class StrategyFlowTest {
    @get:org.junit.Rule val ui=createAndroidComposeRule<ComponentActivity>()
    private val ins get()=InstrumentationRegistry.getInstrumentation()
    private val fixture by lazy {JSONObject(ins.context.assets.open("engine-synthetic.json").bufferedReader().use { it.readText() })}
    private val writes=CopyOnWriteArrayList<String>()
    private val sent=AtomicReference<JSONObject>()
    private val requests=CopyOnWriteArrayList<JSONObject>()
    private val arrived=AtomicReference<Dest>()
    private val port=object:StudioPorts {
        override val state=MutableStateFlow(WorkspaceState("demo",10))
        override suspend fun read(op:String,args:JSONArray):String=when(op){
            "portfolio.candidates"->fixture.getJSONArray("candidates").toString()
            "portfolio.generate"->{requests.add(JSONObject(args.getJSONObject(0).toString()));fixture.getJSONObject("output").toString()}
            "draft.get"->{check(args.getString(0)=="fixture-port-id");sent.get().toString()}
            "matchResults.getResultsIndex"->"{\"matches\":[]}"
            else->error("Unexpected read: $op")
        }
        override suspend fun write(op:String,args:JSONArray):String { writes+=op;check(op=="draft.put");sent.set(JSONObject(args.getJSONObject(0).toString()));return "{\"id\":\"fixture-port-id\"}" }
    }
    private fun show(route:Route) {ui.setContent { StudioTheme { BoxWithConstraints(Modifier.fillMaxSize().safeDrawingPadding().padding(12.dp)) { MoonScene(Modifier.fillMaxSize());StrategyScreen(StudioEnv(Dest(route),maxWidth.value.toInt(),port) {arrived.set(it)}) } } }}
    private fun findIn(pane:String,matcher:SemanticsMatcher):SemanticsNodeInteraction {
        ui.onNodeWithTag("desk.$pane").performScrollToNode(matcher)
        return ui.onNode(matcher and hasAnyAncestor(hasTestTag("desk.$pane"))).performScrollTo()
    }
    private fun capture(name:String) {
        if(InstrumentationRegistry.getArguments().getString("strategyShots")!="1") return
        ui.waitForIdle();val dir=File(ins.targetContext.filesDir,"strategy-evidence").apply{mkdirs()}
        // Screenshot failure is diagnosed separately by the capture script. Business assertions remain authoritative.
        runCatching { val image=requireNotNull(ins.uiAutomation.takeScreenshot());File(dir,"$name.png").outputStream().use { check(image.compress(Bitmap.CompressFormat.PNG,100,it)) };image.recycle() }.onFailure{File(dir,"$name.error").writeText(it.toString())}
    }
    @Test fun selectConstrainInspectAndSendOnlyTheIssuedDraft() {
        show(Route.Portfolio);ui.waitUntil(8000){ui.onAllNodesWithTag("candidate:p-0").fetchSemanticsNodes().isNotEmpty()};capture("portfolio-pool")
        findIn("input",hasTestTag("candidate:p-1")).performClick();findIn("input",hasTestTag("generate")).performClick();ui.onNodeWithText("当前约束无解").assertExists();capture("portfolio-infeasible")
        ui.onAllNodesWithText("构建").fetchSemanticsNodes().takeIf{it.isNotEmpty()}?.let{ui.onNodeWithText("构建").performClick()}
        findIn("input",hasTestTag("candidate:p-1")).performClick();findIn("input",hasText("1 标")).performClick();findIn("input",hasText("2 标")).performClick();findIn("input",hasTestTag("generate")).performClick()
        ui.waitUntil(10000){ui.onAllNodesWithTag("inspect:combo-1").fetchSemanticsNodes().isNotEmpty()};findIn("output",hasTestTag("inspect:combo-1")).performClick()
        Assert.assertEquals(2,requests.last().getJSONObject("comboStructure").getInt("minLegs"));Assert.assertEquals(listOf("p-0","p-1"),requests.last().getJSONArray("keys").let{a->List(a.length()){a.getString(it)}})
        findIn("output",hasTestTag("handoff")).assertIsEnabled();capture("portfolio-inspect");ui.onNodeWithTag("handoff").performClick();ui.waitUntil(6000){arrived.get()!=null}
        Assert.assertEquals(Dest(Route.New,"fixture-port-id"),arrived.get());Assert.assertEquals(listOf("draft.put"),writes.toList())
        val draft=kotlinx.coroutines.runBlocking{JSONObject(port.read("draft.get",JSONArray().put(arrived.get().key)))};val matches=draft.getJSONArray("matches");Assert.assertEquals(2,matches.length());for(i in 0..1){val m=matches.getJSONObject(i);Assert.assertEquals("s$i",m.getString("source_match_id"));Assert.assertEquals(2,m.getJSONArray("entries").length());Assert.assertEquals("d",m.getJSONArray("entries").getJSONObject(1).getJSONObject("extra").getString("side"))}
    }
    @Test fun quantsEmptyHistoryIsNotZeroPerformance(){show(Route.Quants);capture("quants-editor");findIn("input",hasText("运行实验") and hasClickAction()).performClick();ui.waitUntil(8000){ui.onAllNodesWithText("缺少样本").fetchSemanticsNodes().isNotEmpty()};capture("quants-insufficient");Assert.assertTrue(writes.isEmpty())}
}
