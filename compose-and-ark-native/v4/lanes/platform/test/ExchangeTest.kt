package com.eivra.studio.v2.platform

import kotlinx.coroutines.runBlocking
import org.json.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

class ExchangeTest {
    @get:Rule val temp=TemporaryFolder()
    private fun fresh()=LocalPorts({temp.root},PlatformTest.Companion::realEngine)
    private fun a(vararg v:Any?)=PlatformTest.args(*v)
    @Test fun validateBeforeReplaceAndNeverInventAHistory() = runBlocking {
        val p=fresh();p.write("workspace.switch",a("owner"));val m=JSONArray(PlatformTest.cases.getJSONObject(0).getJSONArray("matches").toString());m.getJSONObject(0).put("conf",JSONObject.NULL)
        val historical=PlatformTest.record("post",m).put("entry_mode","post");p.write("workspace.importInvestment",a(historical))
        val backup=p.read("exchange.backup");val file=File(temp.root,"owner.json");val before=file.readBytes();val rev=p.state.value.revision
        val row=JSONObject(p.read("workspace.snapshot")).getJSONArray("investments").getJSONObject(0);assertFalse(row.has("forecast_snapshot"));assertTrue(row.getJSONArray("matches").getJSONObject(0).isNull("conf"))
        val bad=JSONObject(p.read("workspace.snapshot"));bad.getJSONArray("investments").put(row)
        for(text in listOf("{", "{}",bad.toString(),backup+"garbage",JSONObject(backup).put("sha256","changed").toString())) {
            PlatformTest.rejected {p.read("exchange.preflight",a(text))};PlatformTest.rejected {p.write("exchange.restore",a(text,"not-a-preview"))};assertArrayEquals(before,file.readBytes());assertEquals(rev,p.state.value.revision)
        }
        val oldPreview=JSONObject(p.read("exchange.preflight",a(backup)));assertEquals(1,oldPreview.getInt("after"))
        p.write("params.save",a(JSONObject().put("initialCapital",888),rev));assertEquals(888,JSONObject(fresh().read("params.get")).getInt("initialCapital"));PlatformTest.rejected {p.write("exchange.restore",a(backup,oldPreview.getString("token")))}
        val ok=JSONObject(p.read("exchange.preflight",a(backup)));p.write("exchange.restore",a(backup,ok.getString("token")));val next=fresh();next.start();assertEquals(1,next.state.value.pendingCount);assertNotEquals(888,JSONObject(next.read("params.get")).getInt("initialCapital"));assertFalse(JSONObject(next.read("workspace.snapshot")).getJSONArray("investments").getJSONObject(0).has("forecast_snapshot"))
        next.write("workspace.switch",a("demo"));PlatformTest.rejected {next.read("exchange.preflight",a(backup))};assertEquals("demo",next.state.value.mode)
    }
    @Test fun corruptFileIsNotReplacedWithDemoAndFailedRenameDoesNotPublish()= runBlocking {
        val p=fresh();p.write("workspace.switch",a("owner"));val rev=p.state.value.revision;val f=File(temp.root,"owner.json");f.writeText("not-json");PlatformTest.rejected {p.write("draft.put",a(JSONObject().put("matches",JSONArray())))};assertEquals("not-json",f.readText());assertEquals(rev,p.state.value.revision)
    }
}
