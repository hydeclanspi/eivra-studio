package com.eivra.studio.v2.ledger

import android.graphics.Bitmap
import android.view.WindowInsets as AndroidInsets
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.test.platform.app.InstrumentationRegistry
import com.eivra.studio.v2.StudioHost
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.StudioTheme
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.Assert.*
import java.io.File

class LedgerJourneyTest {
    @get:Rule val ui=createAndroidComposeRule<ComponentActivity>()
    private fun tag(id:String)=ui.onNodeWithTag(id)
    private fun waitTag(id:String){ui.waitUntil(12000){ui.onAllNodesWithTag(id).fetchSemanticsNodes().isNotEmpty()}}
    private fun field(id:String,text:String){val n=tag(id).performScrollTo();n.performClick();n.performTextReplacement(text)}
    private fun enabled(id:String){ui.waitUntil(12000){runCatching {tag(id).assertIsEnabled()}.isSuccess}}
    private fun ime()=ui.activity.window.decorView.rootWindowInsets?.isVisible(AndroidInsets.Type.ime())==true
    private fun hideIme(){if(ime()){InstrumentationRegistry.getInstrumentation().uiAutomation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK);ui.waitUntil(4000){!ime()}}}
    private fun photo(name:String){ui.waitForIdle();val inst=InstrumentationRegistry.getInstrumentation();val b=requireNotNull(inst.uiAutomation.takeScreenshot());val root=File(inst.targetContext.filesDir,"ledger-evidence/${b.width}x${b.height}");root.mkdirs();val png=File(root,"$name.png");png.outputStream().use {check(b.compress(Bitmap.CompressFormat.PNG,100,it))};b.recycle()}

    @Test fun portfolioEditFreezeSettleAndFindSameId(){
        val f=FixturePorts();var route by mutableStateOf(Dest(Route.New,f.key));val restore=StateRestorationTester(ui)
        restore.setContent {val holder= rememberSaveableStateHolder();val d=route;StudioTheme {BoxWithConstraints(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing).imePadding()){
            holder.SaveableStateProvider("${d.route.name}/${d.key}") {when(d.route){
                Route.New,Route.Settle -> LedgerScreen(StudioEnv(d,maxWidth.value.toInt(),f){route=it})
                Route.History -> {var row by remember {mutableStateOf<Stored?>(null)};LaunchedEffect(d){row=LedgerGateway(f).records(d.key).single()};row?.let {Text("${it.id} · ${it.legs.single().defaults.results}",Modifier.testTag("fixture-history"))}}
                else->Text("导航往返检查")
            }}
        }}}
        waitTag("odds-0-1");field("odds-0-1","");tag("odds-0-1").assertTextEquals("");field("odds-0-1","4.");hideIme()
        ui.runOnIdle{route=Dest(Route.Portfolio)};ui.runOnIdle{route=Dest(Route.New,f.key)};waitTag("odds-0-1");tag("odds-0-1").assertTextEquals("4.");restore.emulateSavedInstanceStateRestore();waitTag("odds-0-1");tag("odds-0-1").assertTextEquals("4.")
        field("odds-0-1","4.75");hideIme();tag("confirm-0").performScrollTo().performClick();enabled("save");tag("save").performScrollTo().performClick()
        waitTag("ledger-settle-scroll");assertEquals(Dest(Route.Settle,f.returned),route);val scroll=tag("ledger-settle-scroll");scroll.performScrollToNode(hasTestTag("result-0"));field("result-0","2-1");hideIme();tag("hit-0").performScrollTo().performClick();scroll.performScrollToNode(hasTestTag("revenue"));field("revenue","28");hideIme();tag("settle").performScrollTo().performClick()
        waitTag("fixture-history");tag("fixture-history").assertTextEquals("${f.returned} · 2-1");assertEquals(Dest(Route.History,f.returned),route);assertEquals("pending",f.records.getValue(f.decoy).getString("status"));assertEquals(1,f.calls.count {it=="workspace.settleInvestment"})
    }
    @Test fun nativeScreensAndKeyboard(){
        val f=FixturePorts()
        // Public demo fixture: the two legs expanded at the top of the deployed Settle page.
        f.records[f.decoy]=org.json.JSONObject("""{"id":"also-pending","status":"pending","inputs":10,"combined_odds":6.82,"matches":[{"id":"public-a","home_team":"AC米兰","away_team":"国际米兰","entries":[{"name":"win","odds":2.9}],"note":"米兰德比 · 经典对抗 · 平局倾向较高"},{"id":"public-b","home_team":"多特蒙德","away_team":"勒沃库森","entries":[{"name":"-1 draw","odds":2.35}]}]}""")
        ui.setContent {StudioTheme {StudioHost(f)}};waitTag("home-0");photo("new-empty")
        field("home-0","青岚");field("away-0","北港");field("entry-0-0","主胜");field("odds-0-0","1.86");field("entry-0-1","2-1");field("odds-0-1","4.30");hideIme()
        tag("stage-pre").performScrollTo();tag("ledger-new-scroll").performTouchInput {swipeDown()};ui.waitForIdle();photo("pre-filled");tag("stage-post").performScrollTo().performClick();photo("post-filled");field("odds-0-1","4.");ui.waitUntil(5000){ime()};photo("odds-ime");hideIme();tag("odds-0-1").assertTextEquals("4.")
        if(ui.onAllNodesWithTag("menu").fetchSemanticsNodes().isNotEmpty()){tag("menu").performClick();tag("go-Settle").performClick()}else tag("nav-Settle").performClick()
        waitTag("open-${f.decoy}");tag("open-${f.decoy}").performClick();waitTag("ledger-settle-scroll");ui.waitUntil(8000){ui.onAllNodesWithText("记录 ID · ${f.decoy}").fetchSemanticsNodes().isNotEmpty()};photo("settle-target")
    }
}
