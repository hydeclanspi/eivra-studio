package com.eivra.studio.v2.platform

import kotlinx.coroutines.runBlocking
import org.json.*
import org.junit.*
import org.junit.Assert.*
import org.junit.rules.TemporaryFolder

class SeasonWriteTest {
 @get:Rule val root=TemporaryFolder()
 private fun store()=LocalPorts({root.root},PlatformTest.Companion::realEngine)
 private fun a(vararg xs:Any?)=JSONArray().apply{xs.forEach{put(it)}}
 private fun g(p:LocalPorts)=JSONObject().put("mode",p.state.value.mode).put("revision",p.state.value.revision)
 private fun spec(from:String,name:String="27–28",amount:String="125.50")=JSONObject().put("from",from).put("title",name).put("allocation",amount).put("confirmClose",true)
 @Test fun createsNextActualPeriodWithoutEditingOldRowsAndKeepsTitlesOnRestart()=runBlocking{
    val p=store();p.start();val d=JSONObject(p.read("seasons.preview"));val guard=g(p);val old=JSONObject(p.read("workspace.snapshot"));val prev=d.getString("from");val request=a(spec(prev),guard);val out=JSONObject(p.write("seasons.create",request));val id=out.getString("id");assertNotEquals(prev,id);assertTrue(runCatching{p.write("seasons.create",request)}.isFailure);val reopened=store();reopened.start();val fresh=JSONObject(reopened.read("workspace.snapshot"));for(k in listOf("investments","team_profiles","access_logs"))assertEquals(canonical(old.get(k)),canonical(fresh.get(k)));val before=old.getJSONObject("system_config");val after=fresh.getJSONObject("system_config");assertEquals(before.getDouble("initialCapital")+125.50,after.getDouble("initialCapital"),.00001);val idx=JSONObject(reopened.read("warReport.getCyclePeriods"));assertEquals(id,idx.getString("currentId"));val periods=idx.getJSONArray("periods");val n=periods.getJSONObject(0);assertEquals(125.50,n.getDouble("baseCapital"),.001);assertEquals("27–28",n.getString("title"));assertTrue(n.getBoolean("isOpen"));assertFalse(periods.getJSONObject(1).getBoolean("isOpen"));assertEquals(prev,periods.getJSONObject(1).getString("id"));assertEquals(0,n.getInt("totalCount"));assertEquals(1L,after.getJSONArray("capitalInjections").getJSONObject(after.getJSONArray("capitalInjections").length()-1).getString("created_at").let{java.time.Instant.parse(it).toEpochMilli()-java.time.Instant.parse(n.getString("startAt")).toEpochMilli()});assertEquals(id,JSONObject(reopened.read("warReport.getWarReport",a(id))).getJSONObject("period").getString("id"))
 }
 @Test fun invalidInputsOrChangedModeNeverWriteEvenIfDisplayTitleLooksTheSame()=runBlocking{
    val p=store();p.start();val prev=JSONObject(p.read("seasons.preview")).getString("from");val guard=g(p);val rev=p.state.value.revision;for(amt in listOf("-1","NaN","Infinity","1.005","junk","1e4"))assertTrue(runCatching{p.write("seasons.create",a(spec(prev,amount=amt),guard))}.isFailure);assertTrue(runCatching{p.write("seasons.create",a(spec("stale"),guard))}.isFailure);assertTrue(runCatching{p.write("seasons.create",a(spec(prev).put("confirmClose",false),guard))}.isFailure);assertEquals(rev,p.state.value.revision);p.write("workspace.switch",a("owner"));assertTrue(runCatching{p.write("seasons.create",a(spec(prev),guard))}.isFailure);val before=JSONObject(p.read("workspace.snapshot")).getJSONObject("system_config");val start=JSONObject(p.read("seasons.preview")).getString("from");p.write("seasons.create",a(spec(start,"","0"),g(p)));val b=JSONObject(p.read("workspace.snapshot")).getJSONObject("system_config");assertEquals(before.getDouble("initialCapital"),b.getDouble("initialCapital"),1e-10);assertEquals(before.optJSONArray("capitalInjections")?.length()?:0,b.optJSONArray("capitalInjections")?.length()?:0);assertEquals(2,JSONObject(p.read("warReport.getCyclePeriods")).getJSONArray("periods").length());assertEquals(0,p.state.value.pendingCount)
 }
}
