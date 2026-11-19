package com.eivra.studio.v2

import android.graphics.Bitmap
import android.os.Build
import android.os.SystemClock
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.test.platform.app.InstrumentationRegistry
import com.eivra.studio.v2.platform.openPorts
import org.json.*
import kotlinx.coroutines.runBlocking
import java.io.File
import java.security.MessageDigest
import kotlin.math.roundToInt
import org.junit.*
import org.junit.Assert.*

class V41Acceptance {
 @get:Rule val ui=createAndroidComposeRule<MainActivity>()
 private val ins get()=InstrumentationRegistry.getInstrumentation();private val ctx get()=ins.targetContext
 private val vp get()=InstrumentationRegistry.getArguments().getString("studioViewport")!!
 private val dir get()=File(ctx.filesDir,"v41-$vp").apply{mkdirs()}
 private fun exists(s:String)=ui.onAllNodesWithTag(s,true).fetchSemanticsNodes().isNotEmpty()
 private fun node(s:String)=ui.onNodeWithTag(s,true)
 private fun page(route:String,group:String?=null){if(exists("menu")){node("menu").performClick();node("go-$route").performScrollTo().performClick()}else if(group!=null){node("nav-$group").performClick();node("go-$route").performClick()}else node("nav-$route").performClick();node("workspace-$route").assertIsDisplayed()}
 private fun shot(name:String){val b=requireNotNull(ins.uiAutomation.takeScreenshot());File(dir,"$name.png").outputStream().use{assertTrue(b.compress(Bitmap.CompressFormat.PNG,100,it))};b.recycle()}
 private fun box(tag:String):JSONArray{val b=node(tag).fetchSemanticsNode().boundsInRoot;return JSONArray().put(b.left.roundToInt()).put(b.top.roundToInt()).put(b.right.roundToInt()).put(b.bottom.roundToInt())}
 private fun hash(s:String)=MessageDigest.getInstance("SHA-256").digest(s.toByteArray()).joinToString(""){"%02x".format(it)}
 private fun guard(){assertEquals("com.eivra.studio.v2.v41",ctx.packageName);assertTrue(Build.HARDWARE in setOf("ranchu","goldfish")||Build.FINGERPRINT.contains("generic"));assertEquals("true",InstrumentationRegistry.getArguments().getString("eivraDisposableDemo"));ui.waitUntil(45000){openPorts(ctx).state.value.mode=="demo" && exists("quick.heading")}}
 @Test fun quickOptics(){guard();val tags=listOf("quick-panel","quick.heading","quick.chevron","quick.title","quick.badge","quick");val geo=JSONObject();tags.forEach{geo.put(it,box(it))};assertTrue(geo.getJSONArray("quick.chevron").getInt(2)<geo.getJSONArray("quick.title").getInt(0));shot("quick-open");node("quick.heading").performClick();assertFalse(exists("quick"));shot("quick-closed");node("quick.heading").performClick();node("quick").assertIsDisplayed();File(dir,"quick.json").writeText(geo.toString())}
 @Test fun newSeasonAndCancel(){guard();val ports=openPorts(ctx);fun read(op:String):JSONObject {return runBlocking{JSONObject(ports.read(op))}}
    val before=read("warReport.getCyclePeriods");val beforeRows=hash(read("workspace.snapshot").getJSONArray("investments").toString());val pending=ports.state.value.pendingCount;val rev=ports.state.value.revision
    page("Seasons","Dashboard");ui.waitUntil(60000){exists("season.new")};node("season.new").performScrollTo().assertIsDisplayed();shot("seasons-rail");node("season.new").performClick();ui.onNodeWithText("取消").performClick();assertEquals(rev,ports.state.value.revision)
    node("season.new").performClick();ui.waitUntil(20000){ui.onAllNodes(hasTestTag("season.confirm") and isEnabled(),true).fetchSemanticsNodes().isNotEmpty()};shot("season-dialog");node("season.title").performTextReplacement("27–28");node("season.capital").performTextReplacement("250.75");node("season.confirm").performClick();val label="S${before.getJSONArray("periods").length()+1} 27–28";ui.waitUntil(60000){ui.onAllNodes(hasText(label) and isSelected()).fetchSemanticsNodes().isNotEmpty()};ui.onNode(hasText(label) and isSelected()).assertIsDisplayed();shot("season-created");val idx=read("warReport.getCyclePeriods");val id=idx.getString("currentId");val p=idx.getJSONArray("periods").getJSONObject(0);assertEquals(250.75,p.getDouble("baseCapital"),.001);assertNotEquals(before.getString("currentId"),id);assertEquals(beforeRows,hash(read("workspace.snapshot").getJSONArray("investments").toString()));assertEquals(pending,ports.state.value.pendingCount);File(dir,"season.json").writeText(JSONObject().put("id",id).put("ordinal",p.getInt("ordinal")).put("name",label).put("previous",before.getString("currentId")).put("count",idx.getJSONArray("periods").length()).put("rowsHash",beforeRows).put("pid",android.os.Process.myPid()).toString())
 }
 @Test fun coldSeason(){guard();val rc=JSONObject(File(dir,"season.json").readText());assertNotEquals(rc.getInt("pid"),android.os.Process.myPid());val ports=openPorts(ctx);val idx=runBlocking{JSONObject(ports.read("warReport.getCyclePeriods"))};assertEquals(rc.getString("id"),idx.getString("currentId"));assertEquals(rc.getInt("count"),idx.getJSONArray("periods").length());assertEquals(rc.getString("rowsHash"),hash(runBlocking{JSONObject(ports.read("workspace.snapshot"))}.getJSONArray("investments").toString()));page("Seasons","Dashboard");ui.waitUntil(60000){ui.onAllNodes(hasText(rc.getString("name")) and isSelected()).fetchSemanticsNodes().isNotEmpty()};ui.onNode(hasText(rc.getString("name")) and isSelected()).assertIsDisplayed();File(dir,"season-cold.json").writeText(rc.put("newPid",android.os.Process.myPid()).toString())}
 @Test fun actualSolveShowsMovingPrismAndRail(){guard();page("Portfolio");ui.waitUntil(60000){ui.onAllNodes(hasTestTag("pool.count") and hasText("7/7",substring=true),true).fetchSemanticsNodes().isNotEmpty()||ui.onAllNodes(hasTestTag("pool.count") and hasText("已勾选",substring=true),true).fetchSemanticsNodes().isNotEmpty()};node("generate").performScrollTo().assertIsEnabled();assertTrue(android.animation.ValueAnimator.areAnimatorsEnabled());ui.mainClock.autoAdvance=false
    try{node("generate").performClick();var n=0;while(n++<110 && !exists("tide.rail")){ui.mainClock.advanceTimeBy(64);SystemClock.sleep(25)};node("tide.wait").assertIsDisplayed();assertEquals(ProgressBarRangeInfo.Indeterminate,node("tide.wait").fetchSemanticsNode().config[SemanticsProperties.ProgressBarRangeInfo]);val geom=JSONObject();for(tag in listOf("tide.wait","tide.rail","tide.prism"))geom.put(tag,box(tag));val frames=JSONArray()
    for(i in 0 until 31){ui.mainClock.advanceTimeBy(192);SystemClock.sleep(20);if(i==0)shot("solve-live");val im=node("tide.wait").captureToImage().asAndroidBitmap();File(dir,"motion-%02d.png".format(java.util.Locale.ROOT,i)).outputStream().use{assertTrue(im.compress(Bitmap.CompressFormat.PNG,100,it))};frames.put(ui.mainClock.currentTime)};geom.put("clockMs",frames).put("scene","real portfolio.generate, demo; Compose test clock, 192 ms per sample");File(dir,"motion.json").writeText(geom.toString())
    }finally{ui.mainClock.autoAdvance=true}
 }
}
