package com.eivra.studio.v2

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Rect
import android.os.Build
import android.os.SystemClock
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.*
import kotlinx.coroutines.runBlocking
import com.eivra.studio.v2.platform.openPorts
import java.io.File
import org.json.*
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.Locale
import kotlin.math.*

/** The real Activity, a physical input tap, a real kernel solve and a real wall clock. No Compose test rule,
 * synthetic UI, artificial delay in the application, or animation phase injection. */
@RunWith(AndroidJUnit4::class)
class LiveSolveMotion {
 @Test fun observeActualSolve(){
  val inst=InstrumentationRegistry.getInstrumentation();val ctx=inst.targetContext;val pkg=ctx.packageName;val args=InstrumentationRegistry.getArguments();val vp=requireNotNull(args.getString("studioViewport"));assertEquals("com.eivra.studio.v2.v41",pkg);assertTrue(Build.HARDWARE in setOf("ranchu","goldfish") || Build.FINGERPRINT.contains("generic"));assertEquals("true",args.getString("eivraDisposableDemo"))
  val d=UiDevice.getInstance(inst);val dir=File(ctx.filesDir,"v41-$vp").apply{mkdirs()};val old=Configurator.getInstance().waitForIdleTimeout;Configurator.getInstance().waitForIdleTimeout=120
  fun log(t:String){android.util.Log.i("EivraMotion",t);File(dir,"live-trace.txt").appendText("$t\n")}
  fun byTag(s:String)=By.res(s)
  fun find(tag:String,ms:Long=8000):UiObject2= requireNotNull(d.wait(Until.findObject(byTag(tag)),ms)){"Not displayed: $tag"}
  fun box(b:Rect)=JSONArray().put(b.left).put(b.top).put(b.right).put(b.bottom)
  fun writeBitmap(b:Bitmap,name:String){File(dir,name).outputStream().use{assertTrue(b.compress(Bitmap.CompressFormat.PNG,100,it))}}
  fun cut(b:Rect,name:String){val shot=requireNotNull(inst.uiAutomation.takeScreenshot());try{require(b.left>=0&&b.top>=0&&b.right<=shot.width&&b.bottom<=shot.height&&b.width()>0&&b.height()>0);val region=Bitmap.createBitmap(shot,b.left,b.top,b.width(),b.height());try{writeBitmap(region,name)}finally{if(region!==shot)region.recycle()}}finally{shot.recycle()}}
  try{
    ctx.startActivity(Intent(ctx,MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK));val p=openPorts(ctx);val time=SystemClock.elapsedRealtime();while(p.state.value.mode=="unavailable" && SystemClock.elapsedRealtime()-time<20000) SystemClock.sleep(50);assertEquals("demo",p.state.value.mode);val frozen=p.state.value;val pack=runBlocking{JSONArray(p.read("portfolio.candidates"))};assertTrue(pack.length()>0);log("mode=demo rev=${frozen.revision} candidates=${pack.length()}")
    if(vp.startsWith("390")){find("menu").click();val item=d.wait(Until.findObject(By.text("Portfolio")),8000);requireNotNull(item).click()}else find("nav-Portfolio").click();log("opened portfolio")
    val dims=vp.split("x").map(String::toInt);val w=dims[0];val h=dims[1];var target:UiObject2?=null
    for(i in 0..7){val obj=d.findObject(byTag("generate"));if(obj!=null && obj.isEnabled && obj.visibleBounds.height()>=25){target=obj;break};if(i==0){SystemClock.sleep(900)}else{val x=if(w<600) w/2 else w/4;d.swipe(x,(h*.79f).roundToInt(),x,(h*.42f).roundToInt(),19);SystemClock.sleep(240)}}
    val go=requireNotNull(target){"Could not reveal the real enabled Generate button"};log("generate ${go.visibleBounds}");val start=SystemClock.elapsedRealtime();go.click()
    val indicator=find("tide.wait",15000);val bounds=indicator.visibleBounds;assertTrue(bounds.width()>110&&bounds.height()>=34);val working=d.wait(Until.findObject(By.textContains("正在按当前选择求解")),3000);assertNotNull("Must be the actual solve, not the candidates read",working);log("actual solve ${bounds} after ${SystemClock.elapsedRealtime()-start}ms")
    val px=ctx.resources.displayMetrics.density;fun dp(a:Float)= (px*a).roundToInt()
    val label=requireNotNull(working).visibleBounds;val wide=bounds.width()>=dp(408f);val prism=Rect(bounds.left,bounds.centerY()-dp(20f),bounds.left+dp(42f),bounds.centerY()+dp(20f));val rail=if(wide){val len=(bounds.width()*.28f).roundToInt().coerceIn(dp(105f),dp(220f));Rect(bounds.right-len,bounds.centerY()-dp(3f),bounds.right,bounds.centerY()+dp(4f))} else Rect(bounds.left+dp(52f),bounds.centerY()+dp(5f),bounds.right,bounds.bottom)
    val screenshot=requireNotNull(inst.uiAutomation.takeScreenshot());writeBitmap(screenshot,"solve-live.png");screenshot.recycle();assertTrue(android.animation.ValueAnimator.areAnimatorsEnabled());val times=JSONArray();val wall=SystemClock.elapsedRealtime()
    var n=0;while(n<36 && (n<14 || SystemClock.elapsedRealtime()-wall<6900)){val stamp=SystemClock.elapsedRealtime()-wall;cut(bounds,"motion-%02d.png".format(Locale.ROOT,n));times.put(stamp);n++;SystemClock.sleep(110)}
    assertNotNull(d.findObject(By.textContains("正在按当前选择求解")));assertEquals(frozen,p.state.value)
    val g=JSONObject().put("scene","visible real portfolio.generate, system ValueAnimator clock, no Compose test clock").put("tide.wait",box(bounds)).put("tide.prism",box(prism)).put("tide.rail",box(rail)).put("label",box(label)).put("wallMs",times).put("candidates",pack.length());File(dir,"motion.json").writeText(g.toString());log("${times.length()} real clock frames in ${SystemClock.elapsedRealtime()-wall}ms")
    d.executeShellCommand("settings put global animator_duration_scale 0");SystemClock.sleep(520);cut(bounds,"reduce-a.png");SystemClock.sleep(380);cut(bounds,"reduce-b.png");assertNotNull(d.findObject(By.textContains("正在按当前选择求解")));log("reduce motion: two static samples")
  }catch(e:Throwable){runCatching{d.dumpWindowHierarchy(File(dir,"live-failure.xml"));val b=inst.uiAutomation.takeScreenshot();if(b!=null){writeBitmap(b,"live-failure.png");b.recycle()}};throw e}
  finally{Configurator.getInstance().waitForIdleTimeout=old;d.executeShellCommand("settings put global animator_duration_scale 0")}
 }
}
