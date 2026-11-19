package com.eivra.studio.v2.platform

import android.os.SystemClock
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.json.*
import org.junit.Test
import org.junit.Assert.*
import java.io.File

class V4ReadTiming {
 @Test fun packagedColdWarmAndExplicitSolve()=runBlocking {
    val ctx=InstrumentationRegistry.getInstrumentation().targetContext;val scratch=File(ctx.cacheDir,"timing-${java.util.UUID.randomUUID()}");val p=makeLocalPorts({scratch}){ctx.assets.open("platform-kernel.js").bufferedReader().use{it.readText()}}
    suspend fun timed(block:suspend ()->String):Pair<String,Double>{val t=SystemClock.elapsedRealtimeNanos();val s=block();return s to (SystemClock.elapsedRealtimeNanos()-t)/1e6}
    val (_,seed)=timed{p.start().mode};val (rows,cold)=timed{p.read("portfolio.candidates")};val list=JSONArray(rows);assertTrue(list.length()>0);val warm=JSONArray();repeat(6){val (v,ms)=timed{p.read("portfolio.candidates")};assertEquals(rows,v);warm.put(ms)}
    val keys=JSONArray();for(i in 0 until list.length()){val r=list.getJSONObject(i);if(r.isNull("inputIssue"))keys.put(r.getString("key"))};val (solve,ms)=timed{p.read("portfolio.generate",JSONArray().put(JSONObject().put("keys",keys).put("riskPref",50)))};val status=JSONObject(solve).getString("status");assertTrue(status in setOf("ready","infeasible","insufficient"));assertFalse(File(scratch,"demo.json").exists())
    val view=InstrumentationRegistry.getArguments().getString("studioViewport");File(ctx.filesDir,"v4-perf-$view.json").writeText(JSONObject().put("mode","disposable demo; APK debug, API35 emulator").put("seedMs",seed).put("candidates",list.length()).put("coldCandidatesMs",cold).put("warmCandidatesMs",warm).put("solveMs",ms).put("solveStatus",status).toString());Unit
 }
}
