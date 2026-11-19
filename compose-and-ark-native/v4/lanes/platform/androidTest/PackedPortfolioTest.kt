package com.eivra.studio.v2.platform

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.json.*
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.UUID

/** Runs on the shared emulator. Both the synthetic book and the active pointer are isolated. */
@RunWith(AndroidJUnit4::class) class PackedPortfolioTest {
    @Test fun candidatesConstraintsAndDraftFromTargetApk() = runBlocking {
        val ctx=InstrumentationRegistry.getInstrumentation().targetContext
        val dir=File(ctx.cacheDir,"i02-demo-${UUID.randomUUID()}");check(dir.mkdirs())
        val b=JSONObject("""{"investments":[],"team_profiles":[],"access_logs":[],"system_config":{"initialCapital":700}}""")
        File(dir,"demo.json").writeText(JSONObject().put("schema",1).put("mode","demo").put("revision",0).put("bundle",b).put("drafts",JSONObject()).put("receipts",JSONObject()).toString())
        fun fresh()=makeLocalPorts({dir}){ctx.assets.open("platform-kernel.js").bufferedReader().use{it.readText()}}
        try {
            val p=fresh();assertEquals("demo",p.start().mode)
            val matches=JSONArray("""[{"id":"i02-a","home_team":"利兹联","away_team":"拜仁","conf":0.64,"mode":"常规-杠杆","conf_confirmed":true,"entries":[{"name":"主胜","odds":2.4}]},{"id":"i02-b","home_team":"Arsenal","away_team":"Chelsea","conf":0.57,"conf_confirmed":true,"entries":[{"name":"主胜","odds":2.2},{"name":"平局","odds":3.4}]}]""")
            p.write("workspace.saveInvestment",JSONArray().put(JSONObject().put("id","i02").put("inputs",30).put("matches",matches)))
            val before=JSONObject(p.read("workspace.snapshot")).getJSONArray("investments").toString();val count=p.state.value.pendingCount;assertEquals(1,count)
            val rows=JSONArray(p.read("portfolio.candidates"));assertEquals(2,rows.length());val keys=JSONArray();for(i in 0 until rows.length()){val r=rows.getJSONObject(i);assertFalse(r.optBoolean("missingLegQuote"));keys.put(r.getString("key"))}
            val req=JSONObject().put("keys",keys);val good=JSONObject(p.read("portfolio.generate",JSONArray().put(req)));assertEquals("ready",good.getString("status"))
            val bad=JSONObject(p.read("portfolio.generate",JSONArray().put(JSONObject(req.toString()).put("comboStrategy","thresholdStrict").put("qualityFilter",JSONObject().put("minWinRate",100)))));assertEquals("infeasible",bad.getString("status"));assertTrue(bad.getString("reason").isNotBlank())
            val chosen=good.getJSONArray("recommendations").getJSONObject(0).getJSONArray("subset");assertTrue(chosen.length()>0);val legs=JSONArray();for(i in 0 until chosen.length()){val leg=chosen.getJSONObject(i).getJSONObject("draftMatch");assertFalse(leg.getBoolean("conf_confirmed"));legs.put(leg)}
            val draft=JSONObject().put("matches",legs);val key=JSONObject(p.write("draft.put",JSONArray().put(draft))).getString("id");val again=fresh();again.start();assertEquals(canonical(draft),canonical(JSONObject(again.read("draft.get",JSONArray().put(key)))));assertEquals(count,again.state.value.pendingCount);assertEquals(before,JSONObject(again.read("workspace.snapshot")).getJSONArray("investments").toString())
        } finally {dir.deleteRecursively()}
    }
}
