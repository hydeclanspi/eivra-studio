package com.eivra.studio.v2

import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import android.view.FrameMetrics
import android.view.Window
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.espresso.Espresso.pressBack
import androidx.test.platform.app.InstrumentationRegistry
import java.util.Collections
import java.util.Locale
import kotlin.math.ceil
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

/** Only header actions: never save/settle/edit an owner's records from shell acceptance. */
class NavigationSmoke {
    @get:Rule val ui = createAndroidComposeRule<MainActivity>()
    private fun compact() = ui.onAllNodesWithTag("menu").fetchSemanticsNodes().isNotEmpty()
    private fun to(r:String,group:String?=null){
        if(compact()){
            ui.onNodeWithTag("menu").performClick()
            ui.onNodeWithTag("go-$r").performScrollTo().assertIsDisplayed().performClick()
        } else if(group!=null){
            ui.onNodeWithTag("nav-$group").assertIsDisplayed().performClick()
            ui.onNodeWithTag("go-$r").assertIsDisplayed().performClick()
        } else ui.onNodeWithTag("nav-$r").assertIsDisplayed().performClick()
        ui.onNodeWithTag("workspace-$r").assertIsDisplayed()
    }
    @Test fun navigationAndSystemBack(){ to("Portfolio");pressBack();ui.onNodeWithTag("workspace-New").assertIsDisplayed() }
    @Test fun groupedRoutesSurviveRecreation(){
        to("Metrics","Dashboard");ui.activityRule.scenario.recreate();ui.onNodeWithTag("workspace-Metrics").assertIsDisplayed()
        to("Teams","History");ui.onNodeWithTag("brand-home").performClick();ui.onNodeWithTag("workspace-New").assertIsDisplayed();pressBack();ui.onNodeWithTag("workspace-Teams").assertIsDisplayed()
    }
    @Test fun viewportAndMenuBack(){
        val view=InstrumentationRegistry.getArguments().getString("studioViewport")
        if(view!=null){val width=ui.activity.resources.configuration.screenWidthDp;assertTrue("viewport $view vs ${width}dp",kotlin.math.abs(width-view.substringBefore('x').toInt())<=48);assertEquals(view=="390x844",compact())}
        ui.onNodeWithTag(if(compact()) "menu" else "nav-Dashboard").performClick();pressBack();ui.onNodeWithTag("workspace-New").assertIsDisplayed();ui.onNodeWithTag("studio-header").assertIsDisplayed()
    }
    @Test fun navigationFrameSample(){
        val thread=HandlerThread("host-frame-sample");thread.start();val values=Collections.synchronizedList(mutableListOf<Long>());val drops=java.util.concurrent.atomic.AtomicInteger();val window=ui.activity.window
        val listener=Window.OnFrameMetricsAvailableListener{_,fm,lost->val t=fm.getMetric(FrameMetrics.TOTAL_DURATION);if(t>0) values.add(t);drops.addAndGet(lost)}
        try{
            ui.runOnUiThread{window.addOnFrameMetricsAvailableListener(listener,Handler(thread.looper))}
            repeat(4){to("Portfolio");ui.onNodeWithTag("brand-home").performClick();ui.onNodeWithTag("workspace-New").assertIsDisplayed()}
            ui.waitUntil(5_000){values.isNotEmpty()}
        }finally{ui.runOnUiThread{window.removeOnFrameMetricsAvailableListener(listener)};thread.quitSafely();thread.join(1000)}
        val times=synchronized(values){values.sorted()};assertTrue("No measured window frames",times.isNotEmpty());fun p(q:Double)=times[(ceil(q*times.size).toInt()-1).coerceIn(times.indices)]/1e6
        Log.i("EivraHostStats",String.format(Locale.US,"viewport=%s workload=4x_New_Portfolio_New window=activity_only frames=%d droppedCallbacks=%d p50_ms=%.2f p95_ms=%.2f",InstrumentationRegistry.getArguments().getString("studioViewport"),times.size,drops.get(),p(.5),p(.95)))
    }
}
