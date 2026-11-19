package com.eivra.studio.v2.strategy

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.*
import org.json.*

private val doors=listOf("research" to "研究台","lab" to "实验工作台","library" to "策略库","forward" to "影子观察","data" to "数据中心")
@OptIn(ExperimentalLayoutApi::class)
@Composable internal fun QuantNav(tab:String,select:(String)->Unit){FlowRow(Modifier.fillMaxWidth().testTag("quant-nav"),horizontalArrangement=Arrangement.spacedBy(5.dp)) {doors.forEach{(k,t)->StudioPill(t,tab==k,{select(k)})}};HorizontalDivider(color=Moon.Rule)}
@Composable private fun FactBand(facts:List<Pair<String,String>>,wide:Boolean){Column(verticalArrangement=Arrangement.spacedBy(10.dp)){facts.chunked(if(wide)4 else 2).forEach { group->Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp)){group.forEach{(k,v)->GlassPanel(Modifier.weight(1f),14.dp){Text(k,color=Moon.Muted,fontSize=12.sp);Text(v,color=Moon.Ink,fontSize=24.sp)}};repeat((if(wide)4 else 2)-group.size){Spacer(Modifier.weight(1f))}}}}}
@Composable internal fun ResearchPages(env:StudioEnv,ws:WorkspaceState,tab:String,go:(String)->Unit){
    val scope=rememberCoroutineScope();var retry by remember{mutableIntStateOf(0)};val (_,res)=readResource(env.ports,ws.mode,ws.revision,retry){env.ports.objectRead("quant.home")}
    var msg by remember(ws.mode,tab){mutableStateOf("")};var busy by remember{mutableStateOf(false)}
    fun perform(block:suspend ()->String){if(busy)return;busy=true;scope.launch{try{msg=withContext(Dispatchers.IO){block()}}catch(c:CancellationException){throw c}catch(e:Exception){msg=e.message?:"操作未完成"}finally{busy=false}}}
    val ctx=LocalContext.current;var exportOp by remember {mutableStateOf("")};var fileStamp by remember{mutableStateOf<WorkspaceState?>(null)}
    val saveFile=rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")){uri->if(uri!=null && fileStamp==ws)perform{val data=env.ports.read(exportOp);check(env.ports.state.value==ws){"工作区已变化"};requireNotNull(ctx.contentResolver.openOutputStream(uri,"wt")).use{it.write(data.toByteArray())};"已导出本地 JSON"}}
    fun save(op:String,name:String){exportOp=op;fileStamp=ws;saveFile.launch(name)}
    key(tab){LazyColumn(Modifier.fillMaxSize().testTag("quant-$tab"),verticalArrangement=Arrangement.spacedBy(14.dp),contentPadding=PaddingValues(bottom=40.dp)){
        when(res){ is ReadState.Failed->item{Message("无法读取研究记录",res.message,"重读"){retry++}};is ReadState.Value->{val j=res.data;val wide=env.widthDp>=760;val projects=j.getJSONArray("projects").objects();val runs=j.getJSONArray("runs").objects();val vers=j.getJSONArray("versions").objects();val c=j.getJSONObject("coverage");val e=j.getJSONObject("evidence")
        when(tab){"research"->{item{FactBand(listOf("研究项目" to projects.size.toString(),"冻结实验" to runs.size.toString(),"结论待补充" to runs.count{it.text("conclusion").isNullOrBlank()}.toString(),"影子观察" to j.getInt("plans").toString()),wide)}
            item{Message("继续研究",projects.lastOrNull()?.text("name")?:"还没有研究项目。从能被赛果推翻的一个问题开始。",if(projects.isEmpty())"开始一项研究" else "查看研究档案"){go(if(projects.isEmpty())"lab" else "library")}}
            item{GlassPanel(Modifier.fillMaxWidth(),18.dp){Label("联赛环境与样本");LineItem("有效赛果",c.getInt("valid").toString());LineItem("样本日期","${c.text("firstDate")?:"—"} 至 ${c.text("lastDate")?:"—"}");Note("没有赛前报价的历史只能用于频率研究，不能用来回放成交。 ");TextButton({go("data")}){Text("查看数据中心 →")}}}
            item{ResearchLens(env,ws)}
        };"library"->{item{GlassPanel(Modifier.fillMaxWidth(),18.dp){Label("策略与实验档案");Note("冻结版本保留当时的规则与样本；研究结论可以在之后补充。");Row{TextButton({go("lab")}){Text("新研究")};TextButton({save("quant.archive","eivra-research.json")},enabled=!busy){Text("导出档案")}}}}
            if(runs.isEmpty())item{Message("还没有冻结实验","先到实验工作台运行一项实验，再冻结当时的规则。","前往实验工作台"){go("lab")}}
            items(runs.asReversed(),key={it.id("id")}){r->val id=r.id("id");val ver=vers.find{it.text("id")==r.text("versionId")};val name=projects.find{it.text("id")==r.text("projectId")}?.text("name")?:"研究";var note by rememberSaveable(id,r.text("conclusion")){mutableStateOf(r.text("conclusion").orEmpty())};GlassPanel(Modifier.fillMaxWidth(),18.dp){Label(name);Note("v${ver?.optInt("number")?:"—"}  ·  ${r.text("kind")?:"实验"}  ·  ${r.text("createdAt").orEmpty().take(10)}");StudioField("研究结论",note,{note=it.take(1800)},singleLine=false);TextButton({perform{env.ports.write("quantResearch.saveResearchConclusion",args(id,note,guard(ws)));"结论已保存；冻结输入未更改"}},enabled=!busy && note!=r.text("conclusion").orEmpty()){Text("保存结论")}}}
        };else->{item{GlassPanel(Modifier.fillMaxWidth(),18.dp){Label("数据决定可以回答的问题");Note("赛果给出频率；赛前有效报价与赛后结果齐备，才构成可以回放的比赛。")}}
            item{FactBand(listOf("有效赛果" to c.getInt("valid").toString(),"已记录赛事" to e.getInt("events").toString(),"报价快照" to e.getInt("quotes").toString(),"赛前价与赛果齐备" to e.getInt("replayable").toString()),wide)}
            item{ResearchImport(env,ws)};item{GlassPanel(Modifier.fillMaxWidth(),18.dp){Label("赛前证据与采集状态");Note("最近报价：${e.text("latest")?:"尚无"}。本机未运行在线行情采集器。");TextButton({save("quant.evidenceExport","eivra-evidence.json")},enabled=!busy){Text("导出证据 JSON")}}}
        }} };else->item{TideWait("正在整理研究档案")}}
        if(msg.isNotBlank())item{Note(msg)}
    }}
}

@Composable private fun ResearchImport(env:StudioEnv,ws:WorkspaceState){
 val ctx=LocalContext.current;val scope=rememberCoroutineScope();var kind by remember{mutableStateOf("results")};var expected by remember{mutableStateOf<WorkspaceState?>(null)};var text by remember(ws){mutableStateOf("")};var msg by remember{mutableStateOf("")};var busy by remember{mutableStateOf(false)}
 val picker=rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()){u->if(u!=null && expected==ws){scope.launch{try{val raw=withContext(Dispatchers.IO){requireNotNull(ctx.contentResolver.openInputStream(u)).use{f->val out=java.io.ByteArrayOutputStream();val buf=ByteArray(8192);while(true){val n=f.read(buf);if(n<0)break;require(out.size()+n<=4*1024*1024){"文件超过 4 MiB"};out.write(buf,0,n)};out.toString("UTF-8")}};if(env.ports.state.value==ws){text=raw;msg="文件已读取，尚未写入"}}catch(c:CancellationException){throw c}catch(e:Exception){msg=e.message?:"读取失败"}}}}
 GlassPanel(Modifier.fillMaxWidth(),18.dp){Label("导入研究数据");Note("赛果 CSV：date,home,away,homeGoals,awayGoals。证据 JSON 使用官网导出格式。导入只更新研究数据，不生成投资。")
 Row{TextButton({text="";kind="results";expected=ws;picker.launch(arrayOf("text/*","application/octet-stream"))},enabled=!busy){Text("选择赛果 CSV")};TextButton({text="";kind="evidence";expected=ws;picker.launch(arrayOf("application/json","text/*"))},enabled=!busy){Text("选择证据 JSON")}}
 if(text.isNotEmpty())StudioAction("确认导入${if(kind=="results")"赛果" else "证据"}",{val raw=text;val wanted=kind;busy=true;scope.launch{try{val result=withContext(Dispatchers.IO){env.ports.write(if(wanted=="results")"quant.importResults" else "quant.importEvidence",args(if(wanted=="results")raw else JSONObject(raw),guard(ws)))};msg=if(wanted=="results")"导入完成：新增 ${JSONObject(result).optInt("added")}，跳过 ${JSONObject(result).optInt("skipped")}" else "导入完成：${JSONObject(result).getInt("quotes")} 份报价";text=""}catch(c:CancellationException){throw c}catch(e:Exception){msg=e.message?:"导入失败，原数据保留"}finally{busy=false}}},enabled=!busy);if(msg.isNotBlank())Note(msg)
 }
}
