package com.eivra.studio.v2

import android.os.Build
import android.util.Log
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.eivra.studio.v2.platform.openPorts
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import java.util.UUID

/** Opt-in on a disposable emulator; never clear a ledger or write an owner's workspace. */
class IntegratedLedgerJourney {
    @get:Rule val ui = createAndroidComposeRule<MainActivity>()
    private fun node(tag: String) = ui.onNodeWithTag(tag)
    private fun exists(tag: String) = ui.onAllNodesWithTag(tag).fetchSemanticsNodes().isNotEmpty()
    private fun fill(tag: String, text: String) { node(tag).performScrollTo().performTextReplacement(text) }
    private fun rows(bundle: JSONObject): List<JSONObject> = bundle.getJSONArray("investments").let { a -> (0 until a.length()).map(a::getJSONObject) }
    @Test fun saveFreezeSettleAndReadSameRecord() {
        val inst=InstrumentationRegistry.getInstrumentation();val args=InstrumentationRegistry.getArguments()
        assumeTrue(args.getString("eivraDisposableDemo")=="true" && (Build.HARDWARE in setOf("ranchu","goldfish") || Build.FINGERPRINT.contains("generic")))
        assertEquals("com.eivra.studio.v2.v41",inst.targetContext.packageName)
        val ports=openPorts(inst.targetContext);ui.waitUntil(45_000){ports.state.value.mode=="demo" && exists("home-0")}
        fun snapshot():JSONObject = runBlocking { JSONObject(ports.read("workspace.snapshot")) }
        val before=rows(snapshot());val label="HostQA-"+UUID.randomUUID().toString().take(8)
        fill("home-0",label);fill("away-0","Chelsea");fill("entry-0-0","主胜");fill("odds-0-0","2.00");fill("stake","10")
        node("save").assertIsNotEnabled()
        val gateStart=android.os.SystemClock.elapsedRealtime()
        try {
            val mark=node("alpha-0-0.6").performScrollTo().assertIsDisplayed()
            mark.performTouchInput { click(center) };mark.assertIsSelected()
            val selectedValue=node("conf-0").fetchSemanticsNode().config[androidx.compose.ui.semantics.SemanticsProperties.EditableText].text
            assertEquals(0.6, selectedValue.toDouble(), 0.000001)
            ui.waitUntil(60_000){ui.onAllNodes(hasTestTag("save") and isEnabled()).fetchSemanticsNodes().isNotEmpty()}
        } catch (failure: Throwable) {
            // Test class already requires opt-in + emulator + demo. Never dump an owner ledger.
            if (ports.state.value.mode=="demo") runCatching {
                val tags=listOf("home-0","away-0","entry-0-0","odds-0-0","stake","conf-0","confirm-0","alpha-0-0.6","ledger-actions","save")
                for(tag in tags){ val n=ui.onAllNodesWithTag(tag,useUnmergedTree=true).fetchSemanticsNodes().firstOrNull(); Log.e("EivraGate","tag=$tag config=${n?.config}") }
                val msg=ui.onRoot(useUnmergedTree=true).printToString(maxDepth=40)
                java.io.File(inst.targetContext.filesDir,"i03-gate.txt").writeText(msg)
                inst.uiAutomation.takeScreenshot()?.let { b -> java.io.File(inst.targetContext.filesDir,"i03-gate.png").outputStream().use { b.compress(android.graphics.Bitmap.CompressFormat.PNG,100,it) }; b.recycle() }
            }
            throw failure
        }
        Log.i("EivraGate","enabled=true waitMs=${android.os.SystemClock.elapsedRealtime()-gateStart}")
        assertEquals("demo",ports.state.value.mode);node("save").performScrollTo().performClick()
        ui.waitUntil(60_000){exists("workspace-Settle")}
        val after=rows(snapshot());val record=after.single{it.optJSONArray("matches")?.optJSONObject(0)?.optString("home_team")==label};val id=record.getString("id")
        assertTrue(id.isNotBlank());assertEquals(before.size+1,after.size);assertEquals("pending",record.getString("status"));val frozen=record.getJSONObject("forecast_snapshot").toString()
        ui.waitUntil(45_000){exists("ledger-settle-scroll") && ui.onAllNodesWithText("记录 ID · $id").fetchSemanticsNodes().isNotEmpty()}
        val list=node("ledger-settle-scroll");list.performScrollToNode(hasTestTag("result-0"));node("result-0").performTextReplacement("2-1")
        list.performScrollToNode(hasTestTag("hit-0"));node("hit-0").performClick();list.performScrollToNode(hasTestTag("revenue"));node("revenue").performTextReplacement("20")
        assertEquals("demo",ports.state.value.mode);list.performScrollToNode(hasTestTag("settle"));node("settle").assertIsEnabled().performClick()
        ui.waitUntil(60_000){exists("workspace-History")};ui.activityRule.scenario.recreate();node("workspace-History").assertIsDisplayed()
        ui.waitUntil(45_000){ui.onAllNodes(hasTestTag("review-list") and SemanticsMatcher.expectValue(androidx.compose.ui.semantics.SemanticsProperties.StateDescription,"已读取")).fetchSemanticsNodes().isNotEmpty()}
        node("review-list").performScrollToKey("leg:$id:0")
        val legTag="review:leg:$id:0";node(legTag).assertIsDisplayed()
        ui.onNode((hasText("2-1") or hasText("2–1")) and hasAnyAncestor(hasTestTag(legTag)), useUnmergedTree=true).performScrollTo().assertIsDisplayed()
        val final=rows(snapshot());val r=final.single{it.getString("id")==id};val m=r.getJSONArray("matches").getJSONObject(0)
        assertEquals(after.size,final.size);assertEquals("win",r.getString("status"));assertEquals(20.0,r.getDouble("revenues"),.0001);assertEquals("2-1",m.getString("results"));assertTrue(m.getBoolean("is_correct"));assertEquals(frozen,r.getJSONObject("forecast_snapshot").toString())
        assertEquals(before.filter{it.optString("status")=="pending"}.map{it.getString("id")}.toSet(),final.filter{it.optString("status")=="pending"}.map{it.getString("id")}.toSet())
        val viewport=requireNotNull(args.getString("studioViewport"));val c=inst.targetContext
        val signature=java.security.MessageDigest.getInstance("SHA-256").digest(frozen.toByteArray()).joinToString(""){"%02x".format(it)}
        java.io.File(c.cacheDir,"i03-receipt-$viewport.json").writeText(JSONObject().put("id",id).put("pid",android.os.Process.myPid()).put("count",final.size).put("frozen",signature).toString())
        ui.waitForIdle();val screenshot=requireNotNull(inst.uiAutomation.takeScreenshot())
        java.io.File(c.filesDir,"history-$viewport.png").outputStream().use { assertTrue(screenshot.compress(android.graphics.Bitmap.CompressFormat.PNG,100,it)) };screenshot.recycle()
        Log.i("EivraJourney", "viewport=$viewport demo-only records=${before.size}->${after.size}->${final.size} saved-and-settled=$id score=2-1 revenue=20 frozen=true; history-score-verified-on-screen; record-verified-via-ports")
    }
}
