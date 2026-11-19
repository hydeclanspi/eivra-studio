package com.eivra.studio.v2

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.test.platform.app.InstrumentationRegistry
import android.graphics.Bitmap
import android.os.SystemClock
import java.io.File
import org.junit.Rule
import org.junit.Test
import org.junit.Assert.*

class PolishViews {
 @get:Rule val ui=createAndroidComposeRule<MainActivity>()
 private fun exists(tag:String)=ui.onAllNodesWithTag(tag).fetchSemanticsNodes().isNotEmpty()
 private fun page(route:String, group:String?=null){
   if(exists("menu")){ui.onNodeWithTag("menu").performClick();ui.onNodeWithTag("go-$route").performScrollTo().performClick()}
   else if(group!=null){ui.onNodeWithTag("nav-$group").performClick();ui.onNodeWithTag("go-$route").performClick()} else ui.onNodeWithTag("nav-$route").performClick()
   ui.onNodeWithTag("workspace-$route").assertIsDisplayed()
 }
 private fun shoot(name:String) {
   val inst=InstrumentationRegistry.getInstrumentation();val view=InstrumentationRegistry.getArguments().getString("studioViewport")!!
   val dir=File(inst.targetContext.filesDir,"polish-$view");dir.mkdirs();ui.waitForIdle();SystemClock.sleep(220)
   val bmp=requireNotNull(inst.uiAutomation.takeScreenshot()) { "No Android framebuffer" }; File(dir,"$name.png").outputStream().use{assertTrue(bmp.compress(Bitmap.CompressFormat.PNG,100,it))};bmp.recycle()
   File(dir,"$name.txt").writeText(ui.onRoot(useUnmergedTree=true).printToString(maxDepth=18))
 }
 @Test fun actualPreviewStates(){
   ui.waitUntil(45000){exists("conf-0")};ui.onNodeWithTag("conf-0").performScrollTo();shoot("new-controls")
   page("Portfolio");val row=SemanticsMatcher("actual selectable candidate"){it.config.getOrNull(SemanticsProperties.TestTag)?.startsWith("candidate:")==true}
   ui.waitUntil(60000){ui.onAllNodes(row).fetchSemanticsNodes().isNotEmpty()};assertTrue(ui.onAllNodesWithText("Unregistered operation",substring=true).fetchSemanticsNodes().isEmpty());shoot("combo-loaded")
   val details=SemanticsMatcher("candidate detail action"){n->n.config.getOrNull(SemanticsProperties.ContentDescription)?.any{it.endsWith(" 明细")}==true};ui.onAllNodes(details).onFirst().performScrollTo().performClick();ui.onNodeWithTag("quote-detail").assertIsDisplayed();shoot("combo-expanded")
   page("Quants");ui.onNodeWithText("从研究问题开始").assertIsDisplayed();shoot("quants-lab");for((tab,anchor) in listOf("研究台" to "继续研究","策略库" to "策略与实验档案","影子观察" to "", "数据中心" to "数据决定可以回答的问题")){ui.onNodeWithText(tab).performClick();if(anchor.isNotEmpty())ui.waitUntil(60000){ui.onAllNodesWithText(anchor).fetchSemanticsNodes().isNotEmpty()};shoot(when(tab){"研究台"->"quants-research";"策略库"->"quants-library";"影子观察"->"quants-forward";else->"quants-data"})}
   page("Dashboard","Dashboard");ui.waitUntil(60000){ui.onAllNodes(SemanticsMatcher("loaded review"){it.config.getOrNull(SemanticsProperties.StateDescription)=="已读取"}).fetchSemanticsNodes().isNotEmpty()};shoot("overview");page("Seasons","Dashboard");ui.waitUntil(60000){ui.onAllNodes(SemanticsMatcher("loaded seasons"){it.config.getOrNull(SemanticsProperties.StateDescription)=="已读取"}).fetchSemanticsNodes().isNotEmpty()};shoot("seasons");page("History","History");shoot("records");page("Console");shoot("console");ui.onNodeWithTag("console-list").performScrollToNode(hasTestTag("cloud.panel"));ui.onNodeWithText("云端同步（Git）").assertIsDisplayed();ui.onNodeWithText("连接官网个人工作区").assertDoesNotExist();shoot("console-git-demo")
 }
}
