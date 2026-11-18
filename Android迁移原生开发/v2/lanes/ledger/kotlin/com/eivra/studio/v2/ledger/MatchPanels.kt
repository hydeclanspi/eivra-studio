package com.eivra.studio.v2.ledger

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlin.math.roundToInt

@Composable internal fun MatchesPanel(s: EditSession,g: LedgerGateway,mod: Modifier,pad: Dp){
    val t=s.ticket;val pre=t.stage==Stage.Pre
    GlassPanel(mod.testTag("matches-panel"),padding=pad){
        t.legs.forEachIndexed { i,m -> key(m.key) {
            if(i>0) HorizontalDivider(color=Moon.Rule)
            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)){
                Text("${i+1}",Modifier.background(Moon.Accent.copy(alpha=.1f),RoundedCornerShape(7.dp)).padding(horizontal=8.dp,vertical=4.dp),color=Moon.Accent,fontWeight=FontWeight.Bold,fontSize=13.sp)
                Section(if(pre) "对阵 · 两队 PK" else "比赛信息")
            }
            val updateHome:(String)->Unit={v->s.leg(i){it.copy(home=v,windows=null)}};val updateAway:(String)->Unit={v->s.leg(i){it.copy(away=v,windows=null)}}
            if(pre){BoxWithConstraints(Modifier.fillMaxWidth()) {
                if(maxWidth<445.dp) Column(Modifier.fillMaxWidth(),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(5.dp)){
                    TeamWell(true,m.home,updateHome,"home-$i",Modifier.fillMaxWidth());Caption("VS",Moon.Champagne);TeamWell(false,m.away,updateAway,"away-$i",Modifier.fillMaxWidth())
                }else Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)){
                    TeamWell(true,m.home,updateHome,"home-$i",Modifier.weight(1f));Caption("VS",Moon.Champagne);TeamWell(false,m.away,updateAway,"away-$i",Modifier.weight(1f))
                }
            }}else{Row(horizontalArrangement=Arrangement.spacedBy(10.dp)){Edit("主队",m.home,updateHome,"home-$i",Modifier.weight(1f));Edit("客队",m.away,updateAway,"away-$i",Modifier.weight(1f))}}
            Caption(if(pre) "Entries · 结果一条，比分一条（赔率可暂空）" else "Entries · 按实际登记项填写价格")
            m.rows.forEachIndexed { j,e -> key(e.key) {
                fun rows(next: List<Entry>) {s.leg(i){l -> val n=l.copy(rows=next); if(n.score!=l.score) n.copy(windows=null) else n}}
                Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(6.dp)){
                    Edit("第 ${j+1} 条判断",e.name,{v->rows(m.rows.at(j){it.copy(name=v)})},"entry-$i-$j",Modifier.weight(1.5f),hint=if(j==1) "2-1" else "w/d/l",showLabel=false)
                    Edit("第 ${j+1} 条赔率",e.odds,{v->rows(m.rows.at(j){it.copy(odds=v)})},"odds-$i-$j",Modifier.weight(1f),hint="odds",numeric=true,showLabel=false)
                    if(m.rows.size>1) IconButton(onClick={rows(m.rows.filterIndexed { k,_ -> k!=j })},modifier=Modifier.size(44.dp).semantics{contentDescription="移除第 ${j+1} 条 Entry"}){Text("−",fontSize=20.sp,color=Moon.Muted)}
                }
            }}
            SmallButton("＋ 添加 Entry",{s.leg(i){it.copy(rows=it.rows+Entry())}},"add-entry-$i",m.rows.size<5)
            if(pre){val score=m.score;if(score!=null) ScoreBoard(m,g,score){w -> s.leg(i){it.copy(windows=w)}} else Caption("在 Entries 写下比分（例如 2-1），这里会展开进球区间与比分云图。")}
        }}
    }
}
@Composable private fun TeamWell(home: Boolean,name: String,onChange:(String)->Unit,tag: String,mod: Modifier){
    val tint=if(home) Moon.Rose else Moon.Sky;val label=if(home) "主队" else "客队";val shape=RoundedCornerShape(18.dp)
    Column(mod.background(Brush.linearGradient(listOf(if(home) Color(0xC8FFE9EE) else Color(0xCFDFEEFC),Color.White.copy(alpha=.52f))),shape).border(.8.dp,tint.copy(alpha=.22f),shape).padding(9.dp),verticalArrangement=Arrangement.spacedBy(7.dp)){
        Text(label,Modifier.background(Color.White.copy(alpha=.48f),RoundedCornerShape(12.dp)).padding(horizontal=8.dp,vertical=3.dp),color=tint,fontSize=12.sp,fontWeight=FontWeight.SemiBold)
        Edit(label,name,onChange,tag,hint=label,large=true,showLabel=false)
    }
}
@Composable private fun MenuField(label: String,value: String,choices: List<String>,onChoose:(String)->Unit,mod: Modifier=Modifier){
    var open by remember { mutableStateOf(false) };Column(mod){Caption(label);Box{
        OutlinedButton({open=true},modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(10.dp),contentPadding=PaddingValues(horizontal=6.dp)){Text("$value  ⌄",fontSize=14.sp)}
        DropdownMenu(open,{open=false}){choices.forEach { k->DropdownMenuItem(text={Text(k)},onClick={open=false;onChoose(k)}) }}
    }}
}
@Composable internal fun StrategyPanel(s: EditSession,mod: Modifier,pad: Dp){
    val t=s.ticket; var shrink by remember { mutableIntStateOf(0) }
    GlassPanel(mod.testTag("strategy-panel"),padding=pad){
        Section("Portfolio Construction");Caption("场数 · ${t.legs.size} ${if(t.legs.size==1) "(single match)" else "matches"}")
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(3.dp)){(1..5).forEach { n->StudioPill("$n",t.legs.size==n,{
            if(n>t.legs.size)s.edit(t.copy(legs=t.legs+List(n-t.legs.size){Leg()})) else if(n<t.legs.size) shrink=n
        },Modifier.weight(1f).testTag("size-$n")) }}
        if(shrink>0) AlertDialog(onDismissRequest={shrink=0},title={Text("保留前 $shrink 场？")},text={Text("其余场次的草稿和备注将移除。")},confirmButton={TextButton({s.edit(t.copy(legs=t.legs.take(shrink)));shrink=0}){Text("移除其余场次")}},dismissButton={TextButton({shrink=0}){Text("取消")}})
        if(t.legs.size>1 || t.title.isNotEmpty()) Edit("组合名称",t.title,{s.edit(t.copy(title=it))},"combo-name",hint="选填")
        t.legs.forEachIndexed { i,m -> key(m.key) {
            HorizontalDivider(color=Moon.Rule); if(t.legs.size>1) Caption("${i+1}  ·  ${m.home.ifBlank { "主队" }} / ${m.away.ifBlank { "客队" }}",Moon.Champagne)
            MenuField("Strategy · 策略类型",m.mode,listOf("常规","常规-稳","常规-杠杆","常规-激进","半彩票半保险","保险产品","赌一把"),{v->s.leg(i){it.copy(mode=v)}})
            Row(verticalAlignment=Alignment.Bottom,horizontalArrangement=Arrangement.spacedBy(4.dp)){
                Edit("变量 α · Conf",m.conf,{v->s.leg(i){it.copy(conf=v,confirmed=false)}},"conf-$i",Modifier.weight(1f),hint="尚未评级",numeric=true)
                SmallButton(if(m.confirmed) "已确认" else "确认 Conf",{s.leg(i){it.copy(confirmed=true)}},"confirm-$i",!m.confirmed && probability(m.conf)!=null,Moon.Champagne)
            }
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){listOf("0.2","0.4","0.5","0.6","0.8").forEach { x -> SmallButton(x,{s.leg(i){it.copy(conf=x,confirmed=true)}},"alpha-$i-$x",ink=if(m.confirmed && decimal(m.conf)==decimal(x)) Moon.Accent else Moon.Muted) }}
            Caption("校准参数（β · γ · δ）")
            Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){
                val tys=listOf("S","M","L","H");MenuField("β · 主",m.tysH,tys,{v->s.leg(i){it.copy(tysH=v)}},Modifier.weight(1f));MenuField("β · 客",m.tysA,tys,{v->s.leg(i){it.copy(tysA=v)}},Modifier.weight(1f));MenuField("γ · FID",m.fid,listOf("0","0.25","0.4","0.6","0.75"),{v->s.leg(i){it.copy(fid=v)}},Modifier.weight(1f))
            }
            Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Edit("δ (主) · FSE",m.fseH,{v->s.leg(i){it.copy(fseH=v)}},"fse-home-$i",Modifier.weight(1f),numeric=true);Edit("δ (客) · FSE",m.fseA,{v->s.leg(i){it.copy(fseA=v)}},"fse-away-$i",Modifier.weight(1f),numeric=true)}
            Edit("赛前备注",m.note,{v->s.leg(i){it.copy(note=v)}},"note-$i",hint="记录判断的依据、赛前关注点…",multi=true)
        }}
    }
}
@Composable private fun ScoreBoard(m: Leg,g: LedgerGateway,score: Pair<Int,Int>,update: (Pair<GoalWindow,GoalWindow>)->Unit){
    val (h,a)=m.windows ?: (GoalWindow.initial(score.first) to GoalWindow.initial(score.second));val spec=Triple(h,a,score)
    var cells by remember(g,spec) { mutableStateOf<List<ScoreCell>?>(null) };var fault by remember(g,spec){mutableStateOf("")};var retry by remember{mutableIntStateOf(0)}
    LaunchedEffect(g,spec,retry){fault="";delay(200);try{cells=g.cells(h,a,score)}catch(e: CancellationException){throw e}catch(e: Exception){fault=e.message ?: "未取得比分分布"}}
    HorizontalDivider(color=Moon.Rule);Section("我认为它会进几球");Caption("登记比分 ${score.first}–${score.second} · 选择区间后，点球数调整浓度")
    GoalControl(m.home.ifBlank { "主队" },h,Moon.Rose){update(it to a)};GoalControl(m.away.ifBlank { "客队" },a,Moon.Sky){update(h to it)}
    Caption("比分云图 · 原始判断分布",Moon.Accent)
    val list=cells
    if(list!=null){val peak=list.maxOf { it.p };val values=list.associate { (it.h to it.a) to it.p }
        Row{Spacer(Modifier.width(22.dp));(0..6).forEach { v->Box(Modifier.weight(1f),contentAlignment=Alignment.Center){Caption("$v",Moon.Sky)} }}
        (0..6).forEach { x -> Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(2.dp)){
            Text("$x",Modifier.width(20.dp),color=Moon.Rose,fontSize=11.sp);(0..6).forEach { y->val p=values[x to y] ?: 0.0; val alpha=(.04+.78*p/peak).toFloat();Box(Modifier.weight(1f).height(23.dp).background(Moon.Accent.copy(alpha=alpha),RoundedCornerShape(4.dp)).semantics{contentDescription="$x 比 $y：${fmt(p*100,1)}%"},contentAlignment=Alignment.Center){if(x==score.first && y==score.second) Text("◇",fontSize=13.sp,color=if(alpha>.5f) Color.White else Moon.Accent)} }
        }}
        Caption("主队纵轴 · 客队横轴   |   "+list.sortedByDescending { it.p }.take(3).joinToString("   "){"${it.h}–${it.a} ${fmt(it.p*100,1)}%"})
    }else if(fault.isNotBlank()){Caption("未能取得比分分布：$fault");SmallButton("重试云图",{retry++})}else Caption("正在读取比分分布…")
    Caption("云图表达你的判断。没有机构盘源时，不生成对位价格，也不回填赔率。")
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun GoalControl(name: String,w: GoalWindow,tint: Color,change:(GoalWindow)->Unit){
    Column {Caption("$name   ${w.lo}–${w.hi} 球",tint);RangeSlider(value=w.lo.toFloat()..w.hi.toFloat(),onValueChange={r->change(w.copy(lo=r.start.roundToInt(),hi=r.endInclusive.roundToInt()))},valueRange=0f..6f,steps=5,modifier=Modifier.semantics { contentDescription="$name 进球范围" })
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(2.dp)){(0..6).forEach { n->val mode=w.modes[n] ?: "auto";val next=when(mode){"auto"->"boost";"boost"->"zero";else->"auto"};val active=n in w.lo..w.hi
            Box(Modifier.weight(1f).heightIn(min=44.dp).background(if(active)tint.copy(alpha=if(mode=="boost") .22f else .08f) else Color.Transparent,RoundedCornerShape(8.dp)).clickable(enabled=active,role=Role.Button){change(w.copy(modes=w.modes+(n to next)))}.semantics{contentDescription="$name $n 球 ${when(mode){"boost"->"加权";"zero"->"压低";else->"默认"}}"},contentAlignment=Alignment.Center){Text("$n"+when(mode){"boost"->"↑";"zero"->"↓";else->""},color=if(active)tint else Moon.Muted,fontSize=13.sp)}
        }}
    }
}
