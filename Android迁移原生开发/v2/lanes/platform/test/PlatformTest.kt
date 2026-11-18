package com.eivra.studio.v2.platform

import kotlinx.coroutines.*
import org.json.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File
import java.net.URLClassLoader
import java.lang.reflect.InvocationTargetException

class PlatformTest {
    @get:Rule val tmp = TemporaryFolder()
    companion object {
        val lane = sequenceOf(File(".").absoluteFile.normalize()).flatMap { generateSequence(it) { f -> f.parentFile } }.map { File(it,"lanes/platform") }.first { File(it,"assets/platform-kernel.js").isFile }
        val source by lazy { File(lane,"assets/platform-kernel.js").readText() }
        // Isolate host JNI loader from the Android AAR's System.loadLibrary implementation.
        val engine by lazy { URLClassLoader(arrayOf(File(lane,".cache/quickjs-jvm-0.9.2.jar").toURI().toURL()), null).loadClass("app.cash.quickjs.QuickJs") }
        fun realEngine(request: String): String {
            val realm = engine.getMethod("create").invoke(null)
            val eval = engine.getMethod("evaluate",String::class.java)
            try { if(JSONObject(request).optBoolean("testClock")) eval.invoke(realm,File(lane,"checks/fixed-clock.js").readText());eval.invoke(realm,source);return eval.invoke(realm,"eivraPlatform.call("+JSONObject.quote(request)+")") as String }
            catch(e: InvocationTargetException) { throw IllegalStateException(e.cause?.message,e.cause) }
            finally { engine.getMethod("close").invoke(realm) }
        }
        fun args(vararg x: Any?) = JSONArray().apply { x.forEach { put(it) } }
        fun same(a: Any?, b: Any?, path: String="$") {
            when(a) {
                is JSONObject -> {assertTrue(path,b is JSONObject);b as JSONObject;assertEquals(path,a.keySet(),b.keySet());a.keys().forEach { same(a.get(it),b.get(it),"$path.$it") }}
                is JSONArray -> {assertTrue(path,b is JSONArray);b as JSONArray;assertEquals(path,a.length(),b.length());for(i in 0 until a.length()) same(a.get(i),b.get(i),"$path[$i]")}
                is Number -> { assertTrue(path,b is Number); assertEquals(path,a.toDouble(),(b as Number).toDouble(),1e-10) }
                else -> assertEquals(path,a,b)
            }
        }
        val cases get() = JSONArray(File(lane,".cache/web-goldens.json").readText())
        fun record(id: String, matches: JSONArray) = JSONObject().put("id",id).put("created_at","2026-11-18T00:00:00.123Z").put("inputs",30).put("matches",matches)
        suspend fun rejected(block:suspend ()->Unit) { var failed=false;try {block()} catch(e:Exception){failed=true};assertTrue("expected a rejected transaction",failed) }
    }
    private fun restart()=LocalPorts({tmp.root},::realEngine)
    @Test fun originalWebVersusQuickJs() {
        for(i in 0 until cases.length()) {
            val c=cases.getJSONObject(i);val expected=c.getJSONObject("expected")
            fun call(op:String,a:JSONArray) = JSONObject(realEngine(JSONObject().put("testClock",true).put("op",op).put("args",a).put("mode","owner").put("bundle",c.getJSONObject("bundle")).toString()))
            same(expected.getJSONObject("parsed"),call("naturalInputParser.parseNaturalInput",args(c.getString("text"))))
            same(expected.getJSONObject("forecast"),call("forecast.buildDraft",args(c.getJSONArray("matches"),c.getString("stamp"))))
        }
    }
    @Test fun committedLedgerSurvivesNewPortsAndRealms()= runBlocking {
        val ports=restart();ports.start();assertTrue(ports.state.value.pendingCount!! > 0)
        ports.write("workspace.switch",args("owner")); val start=ports.state.value.revision
        val legs=cases.getJSONObject(1).getJSONArray("matches");val a=record("first",legs);val b=record("second",legs)
        val d=JSONObject().put("matches",legs).put("amount_text","12.").put("future_field",JSONObject.NULL)
        val key=JSONObject(ports.write("draft.put",args(d))).getString("id");same(d,JSONObject(ports.read("draft.get",args(key))));assertEquals(0,ports.state.value.pendingCount)
        val receipts=(1..5).map { async(Dispatchers.Default){ports.write("workspace.saveInvestment",args(a))} }.awaitAll()
        assertEquals(1,receipts.toSet().size);ports.write("workspace.saveInvestment",args(b));assertEquals(start+3,ports.state.value.revision)
        val restored=restart();assertEquals("owner",restored.start().mode)
        fun byId(snapshot:String,id:String):JSONObject {val rows=JSONObject(snapshot).getJSONArray("investments");return (0 until rows.length()).map(rows::getJSONObject).single { it.getString("id")==id }}
        val before=restored.read("workspace.snapshot");val frozen=byId(before,"first").getJSONObject("forecast_snapshot")
        val form=JSONObject("""{"revenues":"0","matches":[{"results":"2-1","isCorrect":true,"matchRating":"0.5","matchRep":0},{"results":"0-1","isCorrect":false,"matchRating":"","postNote":"偏差"}]}""")
        rejected { restored.write("workspace.settleInvestment",args("missing",form)) };rejected { restored.write("workspace.saveInvestment",args(JSONObject(a.toString()).put("inputs",31))) };assertEquals(start+3,restored.state.value.revision)
        val done=restored.write("workspace.settleInvestment",args("first",form));val next=restart();next.start();assertEquals(done,next.write("workspace.settleInvestment",args("first",form)));val after=next.read("workspace.snapshot")
        val first=byId(after,"first");same(frozen,first.getJSONObject("forecast_snapshot"));same(byId(before,"second"),byId(after,"second"));assertEquals("lose",first.getString("status"));assertEquals(-30,first.getInt("profit"));assertEquals("2026-11-18T00:00:00.123Z",first.getString("created_at"));assertTrue(first.getString("settled_at").isNotEmpty());assertTrue(first.getJSONArray("matches").getJSONObject(1).getString("outcome_available_at").isNotEmpty());assertEquals(1,next.state.value.pendingCount)
        next.write("workspace.switch",args("demo"));rejected {next.read("draft.get",args(key))};assertFalse(next.read("workspace.snapshot").contains("\"id\":\"first\""));next.write("workspace.switch",args("owner"));same(d,JSONObject(next.read("draft.get",args(key))))
    }
}
