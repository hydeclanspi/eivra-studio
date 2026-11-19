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
   page("Dashboard","Dashboard");shoot("overview");page("History","History");shoot("records");page("Console");shoot("console")
 }
}
