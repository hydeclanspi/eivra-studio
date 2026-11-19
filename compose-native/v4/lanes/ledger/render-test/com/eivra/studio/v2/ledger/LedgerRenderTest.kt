package com.eivra.studio.v2.ledger

import android.graphics.Bitmap
import androidx.activity.ComponentActivity
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.eivra.studio.v2.StudioHost
import com.eivra.studio.v2.ui.StudioTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/** Headless Android native graphics: no emulator, no IME or system-bar claims. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class LedgerRenderTest {
    @get:Rule val ui=createAndroidComposeRule<ComponentActivity>()
    @Test @Config(sdk=[35],qualifiers="zh-rCN-w390dp-h844dp-port-mdpi") fun phone()=capture("phone")
    @Test @Config(sdk=[35],qualifiers="zh-rCN-w1280dp-h800dp-land-mdpi") fun tablet()=capture("tablet")
    private fun capture(size:String){
        val f=FixturePorts();f.records[f.decoy]=org.json.JSONObject("""{"id":"also-pending","inputs":10,"status":"pending","combined_odds":6.82,"matches":[{"home_team":"AC米兰","away_team":"国际米兰","entries":[{"name":"win","odds":2.9}]},{"home_team":"多特蒙德","away_team":"勒沃库森","entries":[{"name":"-1 draw","odds":2.35}]}]}""")
        ui.setContent { StudioTheme {StudioHost(f)} };val out=File(System.getProperty("ledger.frames"),size);out.mkdirs()
        fun photo(name:String){ui.waitForIdle();val b=ui.runOnUiThread { val view=ui.activity.window.decorView; check(view.width>0 && view.height>0); Bitmap.createBitmap(view.width,view.height,Bitmap.Config.ARGB_8888).also { bitmap -> view.draw(android.graphics.Canvas(bitmap)) } };File(out,"$name.png").outputStream().use {check(b.compress(Bitmap.CompressFormat.PNG,100,it))}}
        fun tag(id:String)=ui.onNodeWithTag(id)
        fun await(id:String){ui.waitUntil(10000){ui.onAllNodesWithTag(id).fetchSemanticsNodes().isNotEmpty()}}
        await("home-0");photo("pre-empty")
        for((k,v) in listOf("home-0" to "青岚","away-0" to "北港","entry-0-0" to "主胜","odds-0-0" to "1.86","entry-0-1" to "2-1","odds-0-1" to "4.30"))tag(k).performTextReplacement(v)
        tag("ledger-new-scroll").performSemanticsAction(androidx.compose.ui.semantics.SemanticsActions.ScrollBy){it(0f,-100000f)};photo("pre-filled");tag("stage-post").performClick();photo("post-filled")
        if(ui.onAllNodesWithTag("menu").fetchSemanticsNodes().isNotEmpty()){tag("menu").performClick();tag("go-Settle").performClick()}else tag("nav-Settle").performClick()
        await("open-${f.decoy}");tag("open-${f.decoy}").performClick();ui.waitUntil(10000){ui.onAllNodesWithText("记录 ID · ${f.decoy}").fetchSemanticsNodes().isNotEmpty()};photo("settle-demo")
    }
}
