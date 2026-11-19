package com.eivra.studio.v2.strategy

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.*
import org.json.*
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

private data class Frozen(val id:String,val name:String,val number:Int,val hypothesis:String,val json:JSONObject)
private data class Observation(val id:String,val version:String,val name:String,val review:String,val target:Int)
private data class Book(val store:JSONObject,val versions:List<Frozen>,val plans:List<Observation>)
private suspend fun book(p:StudioPorts):Book {
    val research=p.objectRead("quantResearch.getResearchStore"); val store=p.objectRead("quantForward.getForwardStore")
    return Book(store,research.getJSONArray("versions").objects().asReversed().map {v -> Frozen(v.id("id"),v.getJSONObject("spec").text("name") ?: "未命名研究",v.getInt("number"),v.optJSONObject("brief")?.text("hypothesis").orEmpty(),v)},store.getJSONArray("plans").objects().asReversed().map{Observation(it.id("id"),it.id("versionId"),it.id("name"),it.id("reviewAt"),it.getInt("minSettled"))})
}
private suspend fun inspect(p:StudioPorts,b:Book,plan:Observation):Sheet {
    val evidence=p.objectRead("quantEvidence.getEvidenceStore");val now=Instant.now().toString()
    val m=p.objectRead("quantForward.forwardPlanMetrics",b.store,plan.id,obj("now" to now,"evidence" to evidence))
    val n=m.getInt("settled");val boundary=when(m.id("assessment")) {"insufficient_sample"->"已到复盘日，结算样本仍不足。";"risk_limit_reached"->"达到冻结时的回撤上限。";"data_disputed"->"证据存在争议，暂不下结论。";"review_ready"->"已到复盘窗口，仍需人工解释。";else->"观察中，未到复盘时间。"}
    val orders=b.store.getJSONArray("orders").objects().filter {it.text("planId")==plan.id}.associateBy {it.id("id")}
    val decisions=b.store.getJSONArray("candidates").objects().filter {it.text("planId")==plan.id}.asReversed().map {c -> val o=orders[c.text("orderId")];EvidenceRow("${c.text("home") ?: "—"} vs ${c.text("away") ?: "—"}","${if(o==null) "未纳入" else "纸面纳入"} · ${c.text("reason") ?: c.id("status")}","决策 ${c.id("decisionAt")}\n赛事 ${c.text("eventId") ?: "缺身份"}\n当时报价 ${o?.number("entryOdds").fmt()} · p ${o?.optJSONObject("forecastSnapshot")?.number("probability").pct()}") }
    return Sheet("${plan.name} · 影子观察","$boundary 复盘 ${plan.review}；截至 $now。纸面结果与实际资金分开。",decisions,listOf("已结算 / 最低场数" to "$n / ${plan.target}","待定 / 争议" to "${m.getInt("pending")} / ${m.getInt("disputed")}","纸面 ROI" to m.number("roi").pct(),"Brier / CLV" to "${m.number("brier").fmt(3)} / ${m.number("clv").pct()}"),missing=n==0)
}
@Composable internal fun ForwardDesk(env:StudioEnv,ws:WorkspaceState) {
    var seq by remember { mutableIntStateOf(0) };var right by rememberSaveable { mutableStateOf(false) };var pid by rememberSaveable {mutableStateOf("")};var vid by rememberSaveable {mutableStateOf("")};var date by rememberSaveable { mutableStateOf("") };var n by rememberSaveable {mutableStateOf("30")};var dd by rememberSaveable {mutableStateOf("")}
    var msg by remember {mutableStateOf("")};var busy by remember {mutableStateOf(false)};val scope=rememberCoroutineScope()
    val (_,bs)=readResource(env.ports,ws.mode,ws.revision,seq) {book(env.ports)};val b=(bs as? ReadState.Value)?.data;val plan=b?.plans?.find{it.id==pid};val version=b?.versions?.find{it.id==vid}
    val (_,detail)=readResource(env.ports,ws.mode,ws.revision,seq,pid,enabled=b!=null && plan!=null){inspect(env.ports,requireNotNull(b),requireNotNull(plan))}
    fun mutate(action:suspend ()->String) {
        if(busy)return;busy=true;msg="";scope.launch {try { msg=withContext(Dispatchers.IO){check(env.ports.state.value==ws){"工作区已变化"};action()};seq++ }catch(c:CancellationException){throw c}catch(e:Exception){msg="未确认写入：${e.message}"}finally{busy=false}}
    }
    val review=runCatching { LocalDate.parse(date).atStartOfDay().toInstant(ZoneOffset.UTC) }.getOrNull();val minimum=n.toIntOrNull();val drawdown=dd.toDoubleOrNull();val canFreeze=version!=null && review?.isAfter(Instant.now())==true && minimum!=null && minimum>0 && drawdown!=null && drawdown.isFinite() && drawdown>0 && b?.plans?.none {it.version==vid}==true
    Desk(env.widthDp>=840,"影子观察","先冻结规则，再看后续赛事当时可知的证据。",right,{right=it},"版本与计划" to "观察流水",inputs={
        item { GlassPanel(Modifier.fillMaxWidth(),16.dp){Label("冻结一份观察计划");Note("每个研究版本一份计划。只使用本地证据，不连接市场，不创建实际投资。");TextButton({seq++}){Text("刷新记录")} } }
        when(bs){is ReadState.Failed->item {Message("观察簿读取失败",bs.message)};is ReadState.Value->{
            if(bs.data.versions.isEmpty()) item { Message("尚无研究版本","先在实验工作台运行并冻结一个实验。") }
            items(bs.data.versions,key={"v:${it.id}"}) {v->GlassPanel(Modifier.fillMaxWidth(),12.dp){StudioPill("v${v.number} · ${v.name}",vid==v.id,{vid=v.id});if(vid==v.id&&v.hypothesis.isNotBlank())Note(v.hypothesis)} }
            if(version!=null)item {GlassPanel(Modifier.fillMaxWidth(),16.dp){StudioField("复盘日期 · UTC 零点",date,{date=it.take(10)},hint="YYYY-MM-DD");Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){StudioField("最低结算场数",n,{n=it.take(5)},Modifier.weight(1f));StudioField("回撤上限 · 单位",dd,{dd=it.take(12)},Modifier.weight(1f))};StudioAction("冻结纸面观察计划",{if(canFreeze){val input=obj("version" to version.json,"reviewAt" to review.toString(),"minSettled" to minimum,"maxDrawdown" to drawdown);mutate {val created=JSONObject(env.ports.write("quantForward.createObservationPlan",args(input,guard(ws))));"已冻结计划 · ${created.id("id")}"}}},enabled=canFreeze&&!busy);if(!canFreeze)Note("版本须尚无计划。填写未来复盘日、最低场数和正的回撤上限。")}}
            item {Label("观察计划 · ${bs.data.plans.size}")};if(bs.data.plans.isEmpty())item {Note("暂无冻结计划。这不是 0% 收益。")}
            items(bs.data.plans,key={"p:${it.id}"}){p->GlassPanel(Modifier.fillMaxWidth(),14.dp){StudioPill(p.name,pid==p.id,{pid=p.id;right=true});Note("复盘 ${p.review} · 最少 ${p.target} 场")}}
        };else->item{Note("正在读取研究版本与观察计划…")}}
        if(msg.isNotBlank())item{Message("观察记录",msg)}
    },results={
        if(plan==null)item{Message("尚未选择计划","从左侧或「版本与计划」选择一份冻结规则。")}
        else {when(detail){is ReadState.Value->{sheet(detail.data);item {GlassPanel(Modifier.fillMaxWidth(),16.dp){Note("显式检查新证据，记录纸面接受、拒绝、结算与复盘；不下单。");StudioAction("运行本地纸面跟踪",{val id=plan.id;mutate {val evidence=env.ports.objectRead("quantEvidence.getEvidenceStore");check(env.ports.state.value==ws){"证据已变化"};val saved=JSONObject(env.ports.write("quantForward.runForwardTask",args(id,evidence,obj("action" to "all"),guard(ws))));check(saved.has("tasks")){"缺少更新后的任务记录"};"已更新纸面观察簿"}},enabled=!busy)}}};is ReadState.Failed->item {Message("本次观察不可用",detail.message,"重读") {seq++}};else->item{Note("正在读取这份计划的证据…")}}}
        if(msg.isNotBlank())item{Message("操作回执",msg)}
    })
}
