@file:OptIn(androidx.compose.ui.test.ExperimentalTestApi::class)

package com.eivra.studio.v2.insights

import android.graphics.Bitmap
import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.eivra.studio.v2.StudioHost
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.StudioTheme
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import org.json.*
import org.junit.*
import java.io.File

class ReviewJourney {
    @get:Rule val ui=createAndroidComposeRule<ComponentActivity>()
    private val instrument get()=InstrumentationRegistry.getInstrumentation()
    private val oracle by lazy { JSONObject(instrument.context.assets.open("insights-oracle.json").bufferedReader().use { it.readText() }) }
    private inner class Fixture : StudioPorts {
        override val state=MutableStateFlow(WorkspaceState("demo",1,1))
        @Volatile var fail=false
        @Volatile var gate: CompletableDeferred<Unit>?=null
        val entered=CompletableDeferred<Unit>()
        override suspend fun read(op:String,args:JSONArray):String {
            if(fail) error("fixture read failed")
            val active=state.value;val phase=if(active.revision>1) "after" else "before"
            val period=when(op) { "analytics.getTeamsSnapshot"->args.getString(1);"workspace.snapshot","warReport.getCyclePeriods","warReport.getWarReport"->"all";else->args.getString(0) }
            if(op=="analytics.getDashboardSnapshot" && period=="all") gate?.let { entered.complete(Unit);withContext(NonCancellable){it.await()} }
            val row=oracle.getJSONObject("$phase/$period")
            return when(op) {
                "workspace.snapshot"->if(active.mode=="owner") "{\"investments\":[],\"team_profiles\":[]}" else row.getJSONObject("archive").toString()
                "analytics.getDashboardSnapshot"->row.getJSONObject("dashboard").toString()
                "analytics.getAnalysisSnapshot"->row.getJSONObject("analysis").toString()
                "analytics.getMetricsSnapshot"->row.getJSONObject("metrics").toString()
                "insights.getProbabilityReview"->row.getJSONObject("probability").toString()
                "analytics.getTeamsSnapshot"->row.getJSONArray("teams").toString()
                "warReport.getCyclePeriods"->row.getJSONObject("cycles").toString()
                "warReport.getWarReport"->row.getJSONObject("report").also { check(it.getJSONObject("period").getString("id")==args.getString(0)) }.toString()
                else->error("unexpected read: $op")
            }
        }
        override suspend fun write(op:String,args:JSONArray):String=error("read-only violation")
    }
    private val port=Fixture()
    private lateinit var restore: androidx.compose.ui.test.junit4.StateRestorationTester
    @Before fun start() { restore=androidx.compose.ui.test.junit4.StateRestorationTester(ui);restore.setContent { StudioTheme { StudioHost(port) } } }
    @Test fun restoringQueryRereadsCurrentRecord() {
        open(Route.History);ui.onNodeWithContentDescription("搜索记录").performTextInput("unsettled");waitState("已读取");scroll("pin:unsettled");ui.onNodeWithText("按完整 ID 打开").performClick();waitState("已读取")
        ui.runOnIdle { port.state.value=WorkspaceState("demo",2,0) };restore.emulateSavedInstanceStateRestore();waitState("已读取");scroll("leg:unsettled:0");ui.onNodeWithText("2–0").assertExists();ui.onNodeWithText("比分未记录").assertDoesNotExist()
    }
    private fun waitState(state:String) { ui.waitUntil(10000) { ui.onAllNodes(hasTestTag("review-list") and SemanticsMatcher.expectValue(SemanticsProperties.StateDescription,state)).fetchSemanticsNodes().isNotEmpty() } }
    private fun open(r:Route, wait:Boolean=true) {
        if(ui.onAllNodesWithTag("menu").fetchSemanticsNodes().isNotEmpty()) { ui.onNodeWithTag("menu").performClick(); ui.onNodeWithTag("go-${r.name}").performClick() }
        else { ui.onNodeWithTag("nav-${r.section}").performClick(); val name=when(r) {Route.Dashboard->"Overview"; Route.History->"Records"; else->r.name};ui.onNode(isPopup().let { hasAnyAncestor(it) } and hasText(name)).performClick() }
        ui.onNodeWithTag("workspace-${r.name}").assertIsDisplayed(); if(wait) waitState("已读取")
    }
    private fun scroll(k:String) { ui.onNodeWithTag("review-list").performScrollToKey(k) }
    private fun openRecord(id:String) { scroll("inv:$id");ui.onNode(hasClickAction() and hasText("#$id",substring=true)).performClick();waitState("已读取") }
    @Test fun routeToExactTicketThenTeamThenSource() {
        open(Route.Dashboard);ui.onNodeWithText("查看历史 →").performClick(); waitState("已读取")
        ui.onNodeWithContentDescription("搜索记录").performTextInput("0007");waitState("已读取");scroll("pin:0007");ui.onNodeWithText("按完整 ID 打开").performClick();waitState("已读取")
        scroll("leg:0007:0");ui.onNodeWithText("2–1").performScrollTo().assertIsDisplayed();ui.onNodeWithText("命中").assertExists()
        scroll("leg:0007:1");ui.onNodeWithText("0–0").performScrollTo().assertIsDisplayed();ui.onNodeWithText("未命中").assertExists()
        scroll("leg:0007:0");ui.onNodeWithText("North 档案 →").performScrollTo().performClick();waitState("已读取");scroll("team-leg:0007:0");ui.onNode(hasClickAction() and hasText("#0007",substring=true)).performClick();waitState("已读取");ui.onNodeWithText("记录复盘").assertExists()
    }
    @Test fun laterRevisionAndModeDoNotKeepOldResult() {
        open(Route.History);openRecord("unsettled");scroll("leg:unsettled:0");ui.onNodeWithText("未判定").assertExists()
        ui.runOnIdle { port.state.value=WorkspaceState("demo",2,0) };waitState("已读取");scroll("leg:unsettled:0");ui.onNodeWithText("2–0").assertExists();ui.onNodeWithText("未判定").assertDoesNotExist()
        ui.runOnIdle { port.state.value=WorkspaceState("owner",2,0) };waitState("已读取");ui.onNodeWithText("未找到这笔记录").assertExists();ui.onNodeWithText("2–0").assertDoesNotExist()
    }
    @Test fun lateAllReadMustNotReplaceWeekAndErrorIsNotAnEmptyWindow() {
        val release=CompletableDeferred<Unit>();port.gate=release
        try { open(Route.Dashboard,false);ui.waitUntil(10000) { port.entered.isCompleted };ui.onNodeWithText("近一周").performClick();waitState("已读取");release.complete(Unit);ui.waitForIdle();scroll("note:当前时间窗口暂无投资数据");ui.onNodeWithText("当前时间窗口暂无投资数据").assertExists() }
        finally { release.complete(Unit);port.gate=null }
        ui.runOnIdle { port.fail=true };scroll("window");ui.onNodeWithText("全部").performClick();waitState("读取失败");ui.onNodeWithText("当前时间窗口暂无投资数据").assertDoesNotExist();port.fail=false;ui.onNodeWithText("重新读取").performClick();waitState("已读取");scroll("stats");ui.onNodeWithText("50.0%").assertExists()
    }
    @Test fun captureSameSyntheticState() {
        Assume.assumeTrue(InstrumentationRegistry.getArguments().getString("capture")=="1")
        for(r in listOf(Route.Dashboard,Route.Analysis,Route.Metrics,Route.Seasons,Route.Teams,Route.History)) { open(r);scroll("heading");capture(r.name) }
        openRecord("0007");scroll("leg:0007:0");ui.onNodeWithText("2–1").assertExists();capture("Record-0007")
        ui.onNodeWithText("North 档案 →").performScrollTo().performClick();waitState("已读取");scroll("section:North");capture("Team-North")
    }
    @Suppress("DEPRECATION") private fun capture(name:String) {
        ui.waitForIdle();instrument.waitForIdleSync();val bmp=requireNotNull(instrument.uiAutomation.takeScreenshot());val dir=File(instrument.targetContext.filesDir,"insights-evidence").apply { mkdirs() }
        File(dir,"$name.png").outputStream().use { check(bmp.compress(Bitmap.CompressFormat.PNG,100,it)) }
        val conf=ui.activity.resources.configuration;val meta=JSONObject().put("route",name).put("fixture","before/all").put("px","${bmp.width}x${bmp.height}").put("dpi",conf.densityDpi).put("fontScale",conf.fontScale.toDouble());bmp.recycle()
        ui.runOnIdle { val insets=ui.activity.window.decorView.rootWindowInsets;meta.put("insetsPx",listOf(insets.systemWindowInsetLeft,insets.systemWindowInsetTop,insets.systemWindowInsetRight,insets.systemWindowInsetBottom).joinToString(",")) };File(dir,"$name.json").writeText(meta.toString())
    }
}
