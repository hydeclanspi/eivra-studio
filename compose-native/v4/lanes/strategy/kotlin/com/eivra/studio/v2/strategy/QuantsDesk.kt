package com.eivra.studio.v2.strategy

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.*
import org.json.*

@Composable internal fun QuantsDesk(env:StudioEnv,ws:WorkspaceState) {
    var tab by rememberSaveable { mutableStateOf("lab") }; var right by rememberSaveable { mutableStateOf(false) }
    var rule by rememberSaveable { mutableStateOf(Rule()) };var kind by rememberSaveable { mutableStateOf("scenario") };var armed by rememberSaveable { mutableStateOf(false) };var seq by remember { mutableIntStateOf(0) }
    var busy by remember { mutableStateOf(false) };var receipt by rememberSaveable { mutableStateOf("") };var projectId by rememberSaveable { mutableStateOf("") }
    val scope=rememberCoroutineScope();val bad=rule.issue(kind)
    val (_,s)=readResource(env.ports,ws.mode,ws.revision,rule,kind,seq,enabled=tab=="lab" && armed && bad==null,wait=250) {experiment(env.ports,rule,kind)}
    fun runNow(){armed=true;seq++;right=true}
    fun freeze() {
        if(busy || bad!=null || s !is ReadState.Value || s.data.missing || kind !in setOf("scenario","simulation")) return
        val frozen=rule;val method=kind;val existing=projectId;busy=true;receipt=""
        scope.launch {
            try {
                val result=withContext(Dispatchers.IO) {
                    val data=if(method=="simulation") obj("matches" to JSONArray()) else env.ports.objectRead("matchResults.getResultsIndex")
                    check(env.ports.state.value==ws) {"工作区已变化，请重新运行"}
                    JSONObject(env.ports.write("quantResearch.createResearchExperiment",args(obj("projectId" to existing.ifBlank { null },"kind" to method,"spec" to frozen.spec(),"brief" to obj("hypothesis" to frozen.hypothesis,"falsifier" to frozen.falsifier),"resultsIndex" to data,"marketMatches" to JSONArray()))))
                }
                projectId=result.getJSONObject("project").id("id");val v=result.getJSONObject("version");receipt="已冻结 v${v.getInt("number")} · ${result.getJSONObject("run").id("id")}"
            } catch(c:CancellationException){throw c} catch(e:Exception){receipt="未确认保存：${e.message}"} finally {busy=false}
        }
    }
    Column(Modifier.fillMaxSize(),verticalArrangement=Arrangement.spacedBy(8.dp)) {
        Strip("lab" to "实验工作台","forward" to "影子观察",selected=tab,choose={if(!busy) tab=it})
        if(tab=="forward") { ForwardDesk(env,ws);return@Column }
        Desk(env.widthDp>=840,"Quants · 量化策略实验室","从一个直觉，到可复核的规则与持续观察。",right,{right=it},"研究规则" to "实验结果",inputs={
            item { GlassPanel(Modifier.fillMaxWidth(),16.dp) {
                Label("从研究问题开始"); Note("运行只预览结果；点击「冻结规则并保存实验」才保存新版本。")
                if(env.widthDp>=1024) Row(horizontalArrangement=Arrangement.spacedBy(10.dp)) {
                    StudioField("研究假设",rule.hypothesis,{rule=rule.copy(hypothesis=it.take(1200))},Modifier.weight(1f),hint="我认为什么规律可能存在？",singleLine=false)
                    StudioField("失效条件",rule.falsifier,{rule=rule.copy(falsifier=it.take(1200))},Modifier.weight(1f),hint="什么结果会改变判断？",singleLine=false)
                } else {
                    StudioField("研究假设",rule.hypothesis,{rule=rule.copy(hypothesis=it.take(1200))},hint="我认为什么规律可能存在？",singleLine=false)
                    StudioField("失效条件",rule.falsifier,{rule=rule.copy(falsifier=it.take(1200))},hint="什么结果会改变判断？",singleLine=false)
                }
                StudioField("策略名称",rule.name,{rule=rule.copy(name=it.take(120))},hint="为这项研究命名")
                if(projectId.isNotEmpty()) TextButton({projectId="";receipt="下次冻结为新研究，不覆盖旧版本。"}){Text("另起一项研究")}
            } }
            item { GlassPanel(Modifier.fillMaxWidth(),16.dp) { Label("策略试算器");StudioField("球队（留空为全联赛）",rule.team,{rule=rule.copy(team=it.take(100))});Strip("any" to "不限场地","home" to "主场","away" to "客场",selected=rule.venue,choose={rule=rule.copy(venue=it)});Strip("score" to "比分","result" to "胜平负",selected=rule.market,choose={rule=rule.copy(market=it)})
                if(rule.market=="score") Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){StudioField("本队进球",rule.scoreFor,{rule=rule.copy(scoreFor=it.take(2))},Modifier.weight(1f));StudioField("对手进球",rule.against,{rule=rule.copy(against=it.take(2))},Modifier.weight(1f))}
                else Strip("win" to "胜","draw" to "平","lose" to "负",selected=rule.outcome,choose={rule=rule.copy(outcome=it)})
                Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){StudioField("统一假定赔率",rule.odds,{rule=rule.copy(odds=it.take(12))},Modifier.weight(1f));StudioField("每场单位",rule.stake,{rule=rule.copy(stake=it.take(12))},Modifier.weight(1f))}
            } }
            item { GlassPanel(Modifier.fillMaxWidth(),16.dp) {Label("实验方法"); Strip("scenario" to "历史情景","simulation" to "条件模拟","walk" to "时序留后","rolling" to "滚动窗",selected=kind,choose={kind=it;receipt=""})
                when(kind){
                    "simulation"->{ StudioField("计划场次",rule.count,{rule=rule.copy(count=it.take(3))});Strip("base" to "联赛基准","custom" to "自定义概率",selected=rule.probMode,choose={rule=rule.copy(probMode=it)});if(rule.probMode=="custom")StudioField("条件概率 %",rule.prob,{rule=rule.copy(prob=it.take(10))});Note("使用手动定价，未匹配赛程的模拟腿逐项标为估计。") }
                    "walk"->{Note("按比赛日期切分；训练段占比");Strip("50" to "50%","70" to "70%","80" to "80%",selected=rule.ratio.toString(),choose={rule=rule.copy(ratio=it.toInt())})}
                    "rolling"->{Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){StudioField("训练窗 · 天",rule.train,{rule=rule.copy(train=it.take(4))},Modifier.weight(1f));StudioField("后窗 · 天",rule.test,{rule=rule.copy(test=it.take(3))},Modifier.weight(1f))};StudioField("最低训练场次",rule.minimum,{rule=rule.copy(minimum=it.take(5))});Note("冻结此规则的场地和假定价；只读观察，不从后窗反选赢家。")}
                    else->Note("统一假定价情景不代表历史可成交价。")
                };bad?.let{Note(it)};StudioAction("运行实验",::runNow,Modifier.fillMaxWidth(),bad==null&&!busy)
            } }
        },results={
            if(receipt.isNotBlank()) item { Message("研究版本",receipt) }
            when {
                bad!=null->item { Message("补全输入",bad) };!armed->item {Message("尚未运行","选择规则和实验方法。不会自动建仓或写入研究记录。","运行实验",::runNow)}
                s is ReadState.Failed->item {Message("实验未完成",s.message,"重试",::runNow)}
                s is ReadState.Value->{sheet(s.data);if(!s.data.missing && kind in setOf("scenario","simulation"))item { GlassPanel(Modifier.fillMaxWidth(),16.dp) {Note("保存会按当前工作区冻结新版本、输入快照与结果，不改变旧版本。要继续观察，请到「影子观察」选择该版本。 ");StudioAction(if(busy) "正在冻结…" else "冻结规则并保存实验",::freeze,enabled=!busy) } }}
                else -> item { Message("正在运行","计算在后台进行。你仍可查看或调整规则。") }
            }
        })
    }
}
internal fun LazyListScope.sheet(v:Sheet) {
    item { GlassPanel(Modifier.fillMaxWidth(),16.dp) { Label(v.title);Note(v.boundary);v.facts.forEach {LineItem(it.first,it.second)} } }
    items(v.rows) { row -> var open by rememberSaveable(row.title,row.detail,row.more) {mutableStateOf(false)};GlassPanel(Modifier.fillMaxWidth(),14.dp) { Column(Modifier.fillMaxWidth().clickable(enabled=row.more.isNotEmpty(),role=Role.Button){open=!open}) { Serial(row.title);Note(row.detail);if(row.more.isNotEmpty()) Note(if(open) row.more else "展开依据 ＋") } } }
}
