package com.eivra.studio.v2.strategy

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import org.json.JSONArray
import kotlin.math.roundToInt

private val controlsSaver=listSaver<Constraints,Any>(save={listOf(it.risk,it.minLegs,it.strategy,it.allocation,it.solver,it.minWin,it.maxCorr,it.coverage,it.gate,it.overlap,it.beta,it.lambda,it.eta)},restore={Constraints(it[0] as Int,it[1] as Int,it[2] as String,it[3] as String,it[4] as String,it[5] as Int,it[6] as Int,it[7] as Int,it[8] as Boolean,it[9] as Int,it[10] as Int,it[11] as Int,it[12] as Int)})

@Composable internal fun PortfolioDesk(env:StudioEnv, workspace:WorkspaceState) {
    var cfg by rememberSaveable(stateSaver=controlsSaver) { mutableStateOf(Constraints()) }
    var omitted by rememberSaveable { mutableStateOf(arrayListOf<String>()) }
    var right by rememberSaveable { mutableStateOf(false) }; var armed by rememberSaveable { mutableStateOf(false) }
    var refresh by remember { mutableIntStateOf(0) }; var solve by remember { mutableIntStateOf(0) }
    var extra by rememberSaveable { mutableStateOf(false) }; var poolOpen by rememberSaveable { mutableStateOf(true) }
    var expanded by rememberSaveable { mutableStateOf("") }; var filter by rememberSaveable { mutableStateOf("全部") }
    val (_,catalog)=readResource(env.ports,workspace.mode,workspace.revision,refresh) {
        JSONArray(env.ports.read("portfolio.candidates")).objects().map(::decodeLeg).also { rows -> require(rows.distinctBy { it.key }.size==rows.size) { "候选身份重复，请刷新工作区" } }
    }
    val rows=(catalog as? ReadState.Value)?.data.orEmpty()
    val keys=remember(rows,omitted) { rows.filter { it.issue==null && it.key !in omitted }.map { it.key } }
    val (slot,result)=readResource(env.ports,workspace.mode,workspace.revision,keys,cfg,solve,enabled=armed && keys.isNotEmpty() && catalog is ReadState.Value,wait=220) {
        val spec = cfg
        if (keys.size < spec.minLegs) Report.Infeasible("已选 ${keys.size} 场，少于要求的 ${spec.minLegs} 个标的。")
        else verifySelection(decodeReport(env.ports.read("portfolio.generate",args(spec.request(keys))),keys.toSet()),rows,spec.minLegs)
    }
    val scope=rememberCoroutineScope(); var sending by remember { mutableStateOf(false) }; var problem by remember { mutableStateOf("") }
    fun clear() { slot.invalidate(); expanded=""; problem="" }
    fun generate() { clear(); armed=true; solve++; right=true }
    fun send(plan:Plan) {
        val now=(slot.state.value as? ReadState.Value)?.data as? Report.Ready
        if(sending || now?.plans?.none { it===plan } != false) return
        sending=true; problem=""
        scope.launch {
            try { env.go(putPlan(env.ports,plan,workspace)) }
            catch(c:CancellationException) { throw c }
            catch(e:Exception) { problem=e.message ?: "未获得草稿 ID，未跳转。" }
            finally { sending=false }
        }
    }
    Desk(env.widthDp>=840,"智能组合建议","Portfolio Optimization · 从候选比赛构建方案，再逐腿核对。",right,{right=it},"构建" to "方案与明细",inputs={
        item { GlassPanel(Modifier.fillMaxWidth(),16.dp) {
            Row(verticalAlignment=Alignment.CenterVertically) { Column(Modifier.weight(1f)) { Label("今日备选比赛"); Serial("${keys.size} / ${rows.size} 已勾选") }; TextButton({poolOpen=!poolOpen}) { Text(if(poolOpen) "收起" else "展开") } }
            if(catalog is ReadState.Failed) { Note("候选池未能读取：${catalog.message}"); TextButton({refresh++}) { Text("重试候选池") } }
            else if(catalog !is ReadState.Value) { LinearProgressIndicator(Modifier.fillMaxWidth()); Note("读取当前工作区…") }
            else if(rows.isEmpty()) Note("还没有候选。请先在 New 录入投前观点，或在研究台审阅候选。")
        } }
        if(poolOpen) items(rows,key={"cand:${it.key}"}) { leg -> CandidateLine(leg,leg.key in keys,!sending) { clear(); omitted=ArrayList(if(leg.key in omitted) omitted-leg.key else omitted+leg.key) } }
        item { GlassPanel(Modifier.fillMaxWidth(),16.dp) {
            ConstraintEditor(cfg,extra,{extra=!extra}) { if(!sending && it!=cfg) { clear(); cfg=it } }
            StudioAction(if(armed) "重新生成组合" else "生成最优组合",::generate,Modifier.fillMaxWidth().testTag("generate"),keys.isNotEmpty()&&!sending)
            Note(if(armed) "后续改参会在后台重算；旧方案不能送出。" else "先选择候选和约束，再计算。生成不会创建投资。")
        } }
    },results={
        item { GlassPanel(Modifier.fillMaxWidth(),16.dp) { Label("智能组合包"); Note("按原引擎排序。展开一张方案，核对每一腿后送往 New。") } }
        if(problem.isNotBlank()) item { Message("未打开 New",problem) }
        when {
            catalog is ReadState.Failed -> item { Message("候选数据不可用",catalog.message,"重读") { refresh++ } }
            catalog !is ReadState.Value -> item { Note("正在读取候选…") }
            rows.none { it.issue==null } -> item { Message("缺少可报价的场次","检查候选的赔率、Conf 与 Entry；这不代表约束无解。") }
            keys.isEmpty() -> item { Message("尚未选择候选","勾选至少一场可报价的比赛。","返回构建") {right=false} }
            !armed -> item { Message("尚未生成方案","当前 ${keys.size} 场；最少 ${cfg.minLegs} 标的。","生成最优组合") {generate()} }
            else -> when(result) {
                is ReadState.Failed -> item { Message("计算失败",result.message,"重算") {generate()} }
                is ReadState.Value -> when(val output=result.data) {
                    is Report.Missing -> item { Message("缺少样本",output.why) }
                    is Report.Infeasible -> item { Message("当前约束无解",output.why,"调整约束") {right=false;extra=true} }
                    is Report.Ready -> {
                        item { GlassPanel(Modifier.fillMaxWidth(),16.dp) { Serial("${output.plans.size} 方案 · 候选组合 ${output.candidates} · 达阈值 ${output.qualified}"); Strip(*((listOf("全部")+output.plans.map { it.layer }.distinct()).map { it to it }.toTypedArray()),selected=filter,choose={filter=it}) } }
                        val visible=output.plans.filter { filter=="全部" || output.plans.none { p->p.layer==filter } || it.layer==filter }
                        items(visible,key={"plan:${it.id}"}) { plan ->
                            PlanLine(plan,expanded==plan.id,sending,{expanded=if(expanded==plan.id) "" else plan.id},{send(plan)})
                        }
                        item { SimulationPanel(output) }
                    }
                }
                else -> item { GlassPanel(Modifier.fillMaxWidth()) { LinearProgressIndicator(Modifier.fillMaxWidth()); Note("正在按当前选择求解；可以继续滚动或改参。") } }
            }
        }
    })
}

@Composable private fun CandidateLine(leg:Leg,checked:Boolean,editable:Boolean,onToggle:()->Unit) {
    var open by rememberSaveable(leg.key) { mutableStateOf(false) }
    GlassPanel(Modifier.fillMaxWidth(),12.dp,14.dp) {
        Row(verticalAlignment=Alignment.CenterVertically) {
            Row(Modifier.weight(1f).heightIn(min=46.dp).testTag("candidate:${leg.key}").toggleable(checked,enabled=editable && leg.issue==null,role=Role.Checkbox,onValueChange={onToggle()}),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                Checkbox(checked,null,enabled=editable && leg.issue==null); Column { Text(leg.title,color=Moon.Ink,fontSize=15.sp); Note("${roleName(leg.role)} · ${leg.entries.size} Entry") }
            }; TextButton({open=!open}) { Text(if(open) "收起" else "查看") }
        }
        if(leg.issue!=null) Note(leg.issue)
        if(open) { LineItem("腿级 Conf / Odds","${leg.conf.pct()} / ${leg.odds.fmt()}"); EntryRows(leg) }
    }
}
@Composable private fun SliderLine(label:String,value:Int,range:IntRange,format:(Int)->String={it.toString()},change:(Int)->Unit) {
    LineItem(label,format(value)); Slider(value.toFloat(),{ change(it.roundToInt()) },valueRange=range.first.toFloat()..range.last.toFloat(),modifier=Modifier.fillMaxWidth())
}
@Composable private fun ConstraintEditor(c:Constraints,extra:Boolean,details:()->Unit,change:(Constraints)->Unit) {
    Label("组合结构偏好"); SliderLine("Risk Preference",c.risk,0..100,{"$it%"}) {change(c.copy(risk=it))}
    Note("最小标的数"); Strip("1" to "1 标","2" to "2 标","3" to "3 标","4" to "4 标",selected=c.minLegs.toString(),choose={change(c.copy(minLegs=it.toInt()))})
    Note("生成策略"); Strip("manualCoverage" to "勾选优先","softPenalty" to "软惩罚","thresholdStrict" to "阈值优先",selected=c.strategy,choose={change(c.copy(strategy=it))})
    TextButton(details) { Text(if(extra) "收起阈值与求解设置" else "调整阈值与求解设置") }
    if(extra) {
        SliderLine("最小胜率",c.minWin,0..100,{"$it%"}) {change(c.copy(minWin=it))}
        SliderLine("最大相关性",c.maxCorr,0..100,{(it/100.0).fmt()}) {change(c.copy(maxCorr=it))}
        Row(verticalAlignment=Alignment.CenterVertically) { Text("最小覆盖率门槛",Modifier.weight(1f)); Switch(c.gate,{change(c.copy(gate=it))}) }
        if(c.gate) SliderLine("覆盖候选场次",c.coverage,0..100,{"$it%"}) {change(c.copy(coverage=it))}
        SliderLine("重叠规避",c.overlap,0..100,{"$it%"}) {change(c.copy(overlap=it))}
        SliderLine("组合凸性 β",c.beta,0..50,{(it/100.0).fmt()}) {change(c.copy(beta=it))}
        SliderLine("多样性 λ",c.lambda,20..90,{(it/100.0).fmt()}) {change(c.copy(lambda=it))}
        SliderLine("覆盖强度 η",c.eta,0..40,{(it/100.0).fmt()}) {change(c.copy(eta=it))}
        Note("β 偏好多腿；λ 越低越多样；η 给尚未覆盖的候选加权。")
        Strip("balanced" to "Balanced · 10","precision" to "Precision · 1",selected=c.allocation,choose={change(c.copy(allocation=it))}); Strip("heuristic" to "多阶段启发式","globalJoint" to "全局联立",selected=c.solver,choose={change(c.copy(solver=it))})
        TextButton({change(Constraints())}) { Text("恢复默认约束") }
    }
}
@Composable private fun PlanLine(p:Plan,open:Boolean,busy:Boolean,toggle:()->Unit,send:()->Unit) {
    GlassPanel(Modifier.fillMaxWidth(),16.dp) {
        Column(Modifier.fillMaxWidth().testTag("inspect:${p.id}").clickable(role=Role.Button,onClick=toggle).padding(vertical=4.dp),verticalArrangement=Arrangement.spacedBy(5.dp)) {
            Serial("T${p.rank}  /  ${p.layer}     ${p.legs.size} 腿      ${if(open) "收起 −" else "展开 ＋"}")
            Label(p.legs.joinToString(" × ") { it.home }); Note("等效赔率 ×${p.odds.fmt()}　EV ${p.ev}　分配 ${p.amount.fmt(0)}")
        }
        if(open) {
            LineItem("模型命中率 / Sharpe","${p.win} / ${p.sharpe}"); Note(p.explanation)
            p.legs.forEachIndexed { i,leg ->
                Column(Modifier.fillMaxWidth().background(Moon.Light.copy(alpha=.7f),RoundedCornerShape(12.dp)).padding(12.dp),verticalArrangement=Arrangement.spacedBy(6.dp)) {
                    Serial("LEG %02d   ·   %s".format(i+1,roleName(leg.role))); Label(leg.title); Note("Conf ${leg.conf.pct()} · 腿级 Odds ${leg.odds.fmt()}"); EntryRows(leg)
                    (leg.handoffIssue ?: leg.issue)?.let { Note(it) }
                }
            }
            StudioAction(if(busy) "正在写入草稿…" else "送往 New · 仅建草稿",send,Modifier.fillMaxWidth().testTag("handoff"),!busy && p.legs.all { it.handoffIssue==null && it.issue==null }); Note("只交接这张方案的 ${p.legs.size} 场与全部 Entry；此处不确认投资。")
        }
    }
}
@Composable private fun SimulationPanel(result:Report.Ready) {
    val m=result.simulation
    GlassPanel(Modifier.fillMaxWidth(),16.dp) { Label("组合包 · Monte Carlo")
        if(m==null || m.opt("valid")!=true) Note(m?.optJSONArray("issues")?.let { (0 until it.length()).joinToString("；") { i->it.optString(i) } } ?: "没有可模拟的实际分配或精确分布。")
        else { Serial("${m.getInt("iterations")} 次抽样 · 非实绩"); LineItem("盈利 / 全亏概率","${m.number("profitProb").pct()} / ${m.number("allLoseProb").pct()}"); LineItem("中位损益 / 5% 分位","${m.number("median").fmt()} / ${m.number("var95").fmt()}"); Note("相同物理场次共享抽样，不同场次按独立假设。") }
    }
}
