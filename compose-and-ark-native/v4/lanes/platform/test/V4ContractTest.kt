package com.eivra.studio.v2.platform

import kotlinx.coroutines.runBlocking
import org.json.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

class V4ContractTest {
 @get:Rule val temp=TemporaryFolder()
 private fun a(vararg v:Any?)=JSONArray().apply{v.forEach{put(it)}}
 private fun ports()=LocalPorts({temp.root},PlatformTest::realEngine)
 private fun guard(p:LocalPorts)=JSONObject().put("workspace",p.state.value.mode).put("revision",p.state.value.revision)
 @Test fun authReceiptAndConflictNeverBecomeAnEmptyBundle()=runBlocking {
    var reply=200 to "";var calls=0;var clock=100L;var last="";var body:JSONObject?=null;var auth:String?=null
    val git=OwnerGit({path,b,payload->calls++;last=path;body=payload;auth=b;reply},{clock})
    reply=200 to """{"ok":true,"token":"test-session","expSeconds":200}""";val t=git.unlock("fixture-not-an-account");assertEquals("unlock",last);assertNull(auth);assertTrue(body!!.has("password"))
    reply=200 to """{"ok":true,"bundle":null}""";assertNull(git.pull(t));assertEquals("test-session",auth);assertNull(body)
    for(r in listOf(200 to "{}",200 to """{"ok":false,"bundle":null}""",401 to "",409 to "",500 to "")){reply=r;assertTrue(runCatching{git.pull(t)}.isFailure)}
    reply=409 to "";val first=calls;assertTrue(runCatching{git.push(t,JSONObject())}.isFailure);assertEquals(first+1,calls);assertTrue(body!!.has("snapshot"));assertEquals("commit-bundle",last)
    reply=200 to """{"ok":true,"count":2,"updated_at":"2026-05-01T00:00:00Z"}""";assertEquals(2,git.push(t,JSONObject()).count)
    clock=200;val n=calls;assertTrue(runCatching{git.pull(t)}.isFailure);assertEquals(n,calls)
 }
 @Test fun cloudPullPreservesLocalOnlyAndInvalidatesChangedPreviews()=runBlocking {
    val p=ports();p.start();assertTrue(runCatching{p.read("cloud.export",a(p.state.value.revision))}.isFailure);p.write("workspace.switch",a("owner"));
    fun record(id:String)=JSONObject().put("id",id).put("inputs",10).put("status","pending").put("created_at","2026-01-01T00:00:00Z").put("matches",a(JSONObject().put("id",id+"-leg").put("home_team","A").put("away_team","B")))
    val empty=JSONObject(p.read("cloud.export",a(p.state.value.revision)));val local=JSONObject(empty.toString()).put("investments",a(record("local")));val text=local.toString();val token=JSONObject(p.read("exchange.preflight",a(text))).getString("token");p.write("exchange.restore",a(text,token));p.write("draft.put",a(JSONObject().put("id","d").put("matches",JSONArray())))
    val remote=JSONObject(empty.toString()).put("investments",a(record("remote"))).toString();val r=p.state.value.revision;val m=JSONObject(p.read("cloud.preview",a(remote,"merge",r)));val replace=JSONObject(p.read("cloud.preview",a(remote,"replace",r)));assertEquals(2,m.getInt("after"));assertEquals(1,replace.getInt("removed"));assertEquals(1,p.state.value.pendingCount)
    assertTrue(runCatching{p.write("cloud.apply",a(remote,"replace",r,m.getString("guard")))}.isFailure);p.write("cloud.apply",a(remote,"merge",r,m.getString("guard")));assertEquals(2,p.state.value.pendingCount);assertTrue(runCatching{p.write("cloud.apply",a(remote,"replace",r,replace.getString("guard")))}.isFailure);assertEquals("d",JSONObject(p.read("draft.get",a("d"))).getString("id"));val rev=p.state.value.revision;val conf=JSONObject(p.read("cloud.preview",a(remote,"replace",rev)));p.write("cloud.apply",a(remote,"replace",rev,conf.getString("guard")));assertEquals(1,p.state.value.pendingCount);assertEquals("remote",JSONObject(ports().read("workspace.snapshot")).getJSONArray("investments").getJSONObject(0).getString("id"))
 }
 @Test fun realResearchSurvivesRestartAndNeverEntersGitOrLedger()=runBlocking {
    val p=ports();p.start();p.write("workspace.switch",a("owner"));val csv="date,home,away,homeGoals,awayGoals\n2025-01-10,Arsenal,Chelsea,2,1\n2025-01-12,Chelsea,Arsenal,1,1";val old=guard(p);p.write("quant.importResults",a(csv,old));assertTrue(runCatching{p.write("quant.importResults",a(csv,old))}.isFailure)
    val index=JSONObject(p.read("matchResults.getResultsIndex"));assertEquals(2,index.getJSONArray("matches").length());val spec=JSONObject().put("name","Synthetic").put("market","result").put("outcome","win").put("venue","any").put("manualOdds",2.0).put("oddsMode","manual").put("stakePerMatch",10)
    val result=JSONObject(p.write("quantResearch.createResearchExperiment",a(JSONObject().put("kind","scenario").put("spec",spec).put("resultsIndex",index).put("marketMatches",JSONArray()),guard(p))));val id=result.getJSONObject("run").getString("id");p.write("quantResearch.saveResearchConclusion",a(id,"fixture only",guard(p)));val fresh=ports();fresh.start();val h=JSONObject(fresh.read("quant.home"));assertEquals(1,h.getJSONArray("projects").length());assertEquals(2,h.getJSONObject("coverage").getInt("valid"));assertEquals("fixture only",h.getJSONArray("runs").getJSONObject(0).getString("conclusion"));assertEquals(0,fresh.state.value.pendingCount)
    val backup=fresh.read("exchange.backup");assertTrue(JSONObject(backup).getJSONObject("payload").getJSONObject("notebook").length()>0);val web=fresh.read("cloud.export",a(fresh.state.value.revision));assertFalse(web.contains("fixture only"));fresh.write("workspace.switch",a("demo"));assertEquals(0,JSONObject(fresh.read("quant.home")).getJSONArray("projects").length());assertTrue(runCatching{fresh.read("exchange.preflight",a(backup))}.isFailure)
 }
 @Test fun pristineReadsSeedOnceAndNeverWrite()=runBlocking{
    val ops=mutableListOf<String>();val p=LocalPorts({temp.root}){raw->ops+=JSONObject(raw).getString("op");PlatformTest.realEngine(raw)};p.start();val first=p.read("portfolio.candidates");repeat(3){assertEquals(first,p.read("portfolio.candidates"));p.read("workspace.snapshot")};assertEquals(1,ops.count{it=="workspace.snapshot"});assertEquals(1,ops.count{it=="portfolio.candidates"});assertFalse(File(temp.root,"demo.json").exists())
 }
}
