package com.eivra.studio.v2.strategy

import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.platform.LocalPorts
import kotlinx.coroutines.runBlocking
import org.json.*
import java.io.File

/** Desktop integration probe. Runs the real kernel, LocalPorts atomic files and Strategy's exact codec. */
fun main(argv:Array<String>)=runBlocking {
    val kernel=File(argv[0]).canonicalFile;val data=File(argv[1]).canonicalFile
    require(data.mkdir()) { "Use an entirely new, disposable directory" }
    fun instance()=LocalPorts({data}) { request ->
        val js="require(process.argv[1]);const fs=require('node:fs');process.stdout.write(globalThis.eivraPlatform.call(fs.readFileSync(0,'utf8')));"
        val child=ProcessBuilder("node","-e",js,kernel.path).redirectError(ProcessBuilder.Redirect.INHERIT).start()
        child.outputStream.bufferedWriter().use{it.write(request)};val response=child.inputStream.bufferedReader().use{it.readText()};check(child.waitFor()==0){"Kernel rejected request"};response
    }
    val p=instance();p.start();check(p.state.value.mode=="demo")
    suspend fun ledger(s:StudioPorts)=JSONObject(s.read("workspace.snapshot")).getJSONArray("investments").objects().associate {it.id("id") to it.id("status")}
    val before=ledger(p);val pending=p.state.value.pendingCount
    val rows=JSONArray(p.read("portfolio.candidates")).objects().map(::decodeLeg);val keys=rows.filter{it.issue==null && it.handoffIssue==null}.take(2).map{it.key};check(keys.size==2)
    val cfg=Constraints().copy(risk=62,minLegs=2,minWin=6)
    suspend fun generate(c:Constraints)=verifySelection(decodeReport(p.read("portfolio.generate",args(c.request(keys))),keys.toSet()),rows,c.minLegs)
    val ready=generate(cfg) as Report.Ready; val plan=ready.plans.first();check(plan.legs.size==2 && plan.legs.map{it.key}.toSet()==keys.toSet());check(plan.legs.all{it.entries.isNotEmpty()})
    check(generate(cfg.copy(strategy="thresholdStrict",minWin=100)) is Report.Infeasible)
    val dest=putPlan(p,plan,p.state.value);check(dest.route==Route.New && !dest.key.isNullOrBlank())
    val reopened=instance();reopened.start();val draft=JSONObject(reopened.read("draft.get",args(dest.key)));val expected=canonicalDraft(plan);check(draft.similar(expected));check(!draft.has("inputs") && !draft.has("actualInput"));check(draft.getJSONArray("matches").objects().all{!it.getBoolean("conf_confirmed")})
    val editor=com.eivra.studio.v2.ledger.LedgerGateway(reopened).load(requireNotNull(dest.key))
    check(editor.amount.isBlank() && editor.legs.size==2 && editor.legs.none{it.confirmed});check(editor.legs.zip(plan.legs).all{(a,b)->a.home==b.home && a.away==b.away && a.rows.map{it.name}==b.entries.map{it.name}})
    check(ledger(reopened)==before && reopened.state.value.pendingCount==pending)
    println("I02_REAL_DEMO "+obj("candidates" to rows.size,"keys" to JSONArray(keys),"risk" to cfg.risk,"minWinRate" to cfg.minWin,"plans" to ready.plans.size,"plan" to plan.id,"odds" to plan.odds,"legs" to JSONArray(plan.legs.map{it.title}),"entries" to JSONArray(plan.legs.map{it.entries.size}),"route" to dest.route.name,"draftId" to dest.key,"investmentsBefore" to before.size,"investmentsAfter" to ledger(reopened).size,"pendingBefore" to pending,"pendingAfter" to reopened.state.value.pendingCount,"strict" to "infeasible","freshStoreRoundTrip" to true))
}
