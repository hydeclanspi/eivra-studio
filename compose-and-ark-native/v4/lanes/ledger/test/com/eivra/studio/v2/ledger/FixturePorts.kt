package com.eivra.studio.v2.ledger

import com.eivra.studio.v2.api.*
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.util.Collections

/** Isolated script, not an engine or a calculation golden. Same fixture in the two test source sets. */
internal class FixturePorts: StudioPorts {
    override val state=MutableStateFlow(WorkspaceState("demo",0,1))
    val calls=Collections.synchronizedList(mutableListOf<String>())
    val key="portfolio-fixture";val returned="receipt-73";val decoy="also-pending"
    val draft=JSONObject("""{"combo_name":"两条判断","inputs":"20","source_plan":"p7","matches":[{"id":"leg-a","home_team":"青岚","away_team":"北港","entries":[{"name":"主胜","odds":"1.86","quote_id":"q1"},{"name":"2-1","odds":"4.3"}],"event_id":"fixture-event","conf":0.6,"note":"合成草稿"}]}""")
    val records=linkedMapOf(decoy to JSONObject(draft.toString()).put("id",decoy).put("status","pending"))
    var checkpoint: JSONObject?=null;var lastRecord: JSONObject?=null;var lastForm: JSONObject?=null
    var valid=true; var failWrite=false;var missingId=false;var mass=1.0
    val parseStarted=CompletableDeferred<Unit>();var holdParse: CompletableDeferred<Unit>?=null
    override suspend fun read(op: String,args: JSONArray): String {
        calls.add(op);return when(op){
            "draft.get" -> when(args.getString(0)){key->draft.toString();"cp"->requireNotNull(checkpoint).toString();else->error("missing draft")}
            "workspace.snapshot" -> synchronized(records){JSONObject().put("investments",JSONArray(records.values.toList())).toString()}
            "forecast.buildDraft" -> {val ms=args.getJSONArray(0);val snap=JSONObject().put("generated_at",args.getString(1)).put("legs",ms).put("states",arr(JSONObject().put("probability",mass).put("gross",1.2))).put("ticket_hit_probability",0.6)
                JSONObject().put("combinedProfile",JSONObject().put("valid",valid)).put("forecastSnapshot",snap).put("combinedOdds",1.91).put("expectedRating",0.6).put("recommendedInvest",7).toString()}
            "naturalInputParser.parseNaturalInput" -> {parseStarted.complete(Unit);holdParse?.let { withContext(NonCancellable){it.await()} };"""{"matches":[{"homeTeam":"解析主","awayTeam":"解析客","entries":[{"name":"2-1","odds":""}],"conf":50,"fse_home":"default","fse_away":10}],"actualInput":null,"diagnostics":[]}"""}
            "preMatchOpinion.weightsFromSlider" -> "[0,0,1,0,0,0,0]"
            "preMatchOpinion.jointScoreCells" -> """[{"home":2,"away":1,"p":1}]"""
            else->error("unexpected read: $op")
        }
    }
    override suspend fun write(op: String,args: JSONArray): String = synchronized(records){
        calls.add(op); check(!failWrite){"denied"};val id=when(op){
            "draft.put"->{checkpoint=args.getJSONObject(0);return@synchronized """{"id":"cp"}"""}
            "workspace.saveInvestment","workspace.importInvestment"->{val r=args.getJSONObject(0);check(!r.has("forecast_snapshot"));lastRecord=JSONObject(r.toString());records[returned]=JSONObject(r.toString()).put("id",returned);returned}
            "workspace.settleInvestment"->{val target=args.getString(0);val r=records.getValue(target);check(r.getString("status")=="pending");val form=args.getJSONObject(1);lastForm=form;val fs=form.getJSONArray("matches").objects();fs.forEachIndexed { i,l ->r.getJSONArray("matches").getJSONObject(i).put("results",l.getString("results")).put("is_correct",l.getBoolean("isCorrect")) };r.put("status",if(fs.all {it.getBoolean("isCorrect")}) "win" else "lose").put("revenues",form.getString("revenues"));target}
            else->error("unexpected write: $op")
        };val rev=state.value.revision+1;state.value=WorkspaceState("demo",rev,records.values.count { it.getString("status")=="pending" });JSONObject().put("revision",rev).also { if(!missingId)it.put("id",id) }.toString()
    }
}
