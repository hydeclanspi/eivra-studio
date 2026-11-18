package com.eivra.studio.v2.platform

import android.graphics.Bitmap
import androidx.compose.foundation.layout.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.platform.LocalConfiguration
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.StudioTheme
import com.eivra.studio.v2.ui.MoonScene
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*
import org.json.*
import java.io.File
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class PlatformDeviceTest {
    @get:Rule val ui=createComposeRule()
    private val inst=InstrumentationRegistry.getInstrumentation()
    private val ctx=inst.targetContext
    // Explicit test store; never open the installed app's demo/owner files.
    private val temp by lazy{File(ctx.cacheDir,"platform-check-${UUID.randomUUID()}")}
    private fun fresh()=makeLocalPorts({temp}){ctx.assets.open("platform-kernel.js").bufferedReader().use{it.readText()}}
    @Test fun androidAbiSaveSettleAndReopen()=runBlocking {
        val p=fresh();p.write("workspace.switch",JSONArray().put("owner"));val parsed=JSONObject(p.read("naturalInputParser.parseNaturalInput",JSONArray().put("利兹联 win 拜仁 2.4 30块")))
        val match=parsed.getJSONArray("matches").getJSONObject(0);val m=JSONObject().put("home_team",match.getString("homeTeam")).put("away_team",match.getString("awayTeam")).put("entries",match.getJSONArray("entries")).put("conf",0.64).put("conf_confirmed",true)
        val record=JSONObject().put("id","device-a").put("inputs",30).put("matches",JSONArray().put(m));p.write("workspace.saveInvestment",JSONArray().put(record));p.write("workspace.settleInvestment",JSONArray().put("device-a").put(JSONObject("""{"revenues":"72","matches":[{"isCorrect":true,"results":"2-1"}]}""")))
        val row=JSONObject(fresh().read("workspace.snapshot")).getJSONArray("investments").getJSONObject(0);assertEquals("device-a",row.getString("id"));assertEquals(42,row.getInt("profit"));assertTrue(row.getJSONObject("forecast_snapshot").has("generated_at"))
    }
    @Test fun consoleDemoFirstFold(){val p=fresh();runBlocking { p.start() }
        ui.setContent { val width=LocalConfiguration.current.screenWidthDp;StudioTheme{Box(Modifier.fillMaxSize()){MoonScene(Modifier.matchParentSize());PlatformScreen(StudioEnv(Dest(Route.Console),width,p) {})}} }
        ui.waitUntil(timeoutMillis=60000){ui.onAllNodes(androidx.compose.ui.test.hasText("最近",substring=true)).fetchSemanticsNodes().isNotEmpty()};ui.onNodeWithText("参数后台").assertIsDisplayed()
        // Optional diagnostic, separate from business assertions. Copy back only from this test's cache path.
        runCatching { val shot=inst.uiAutomation.takeScreenshot();if(shot!=null){File(ctx.cacheDir,"platform-console-demo.png").outputStream().use {shot.compress(Bitmap.CompressFormat.PNG,100,it)};shot.recycle()} }
    }
}
