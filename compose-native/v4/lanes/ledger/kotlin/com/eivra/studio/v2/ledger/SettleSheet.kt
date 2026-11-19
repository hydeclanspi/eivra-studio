package com.eivra.studio.v2.ledger

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.CancellationException

@Composable internal fun SettleSheet(env: StudioEnv,g: LedgerGateway,ws: WorkspaceState,s: SettlementSession){
    val id=env.dest.key;val pad=if(env.widthDp>=900) 24.dp else 14.dp
    var retry by remember { mutableIntStateOf(0) };var rows by remember(g,id,ws.revision,retry){mutableStateOf<List<Stored>?>(null)};var error by remember(g,id,ws.revision,retry){mutableStateOf("")}
    val receipt=s.receipt
    LaunchedEffect(g,id,ws.revision,retry){try {val r=g.records(id);rows=r;if(id!=null)r.singleOrNull()?.let(s::open)}catch(e: CancellationException){throw e}catch(e: Exception){error=e.message ?: "账本读取失败"}}
    if(receipt!=null){var forwarded by rememberSaveable {mutableStateOf(false)};LaunchedEffect(receipt){if(!forwarded){forwarded=true;env.go(Dest(Route.History,receipt))}}
        Column(Modifier.padding(pad)){GlassPanel{Section("已结算");Caption(receipt);StudioAction("查看这笔历史记录",{env.go(Dest(Route.History,receipt))},Modifier.testTag("history"))}};return
    }
    val list=rows
    LazyColumn(Modifier.fillMaxSize().testTag("ledger-settle-scroll"),contentPadding=PaddingValues(pad),verticalArrangement=Arrangement.spacedBy(14.dp)){
        item {PageHeading("待结算",if(id==null) "逐条核对赛果、命中与回款" else "核对这笔记录的每一场比赛，再登记整笔实际回款")}
        item {HorizontalDivider(color=Moon.Rule)}
        when {
            error.isNotEmpty() -> item {GlassPanel(Modifier.fillMaxWidth()){Section("未能读取记录");Caption(error);SmallButton("重新读取",{retry++})}}
            list==null -> item {LinearProgressIndicator(Modifier.fillMaxWidth());Caption("正在读取账本…")}
            list.isEmpty() -> item {GlassPanel(Modifier.fillMaxWidth()){Section(if(id==null) "没有待结算记录" else "找不到指定记录");Caption(id ?: "冻结并保存一笔投资后，可在这里登记赛果。");if(id!=null)SmallButton("回到待结算列表",{env.go(Dest(Route.Settle))})}}
            id==null -> items(list,key={it.id}) {r->GlassPanel(Modifier.fillMaxWidth()){RecordHeading(r);Caption(r.legs.joinToString("   /   "){"${it.home} – ${it.away}"});SmallButton("展开结算",{env.go(Dest(Route.Settle,r.id))},"open-${r.id}")}}
            else -> {val r=list.single();item{GlassPanel(Modifier.fillMaxWidth()){RecordHeading(r);Caption("记录 ID · ${r.id}")}}
                if(r.status!="pending") item {GlassPanel {Section("这笔记录不在待结算队列");StudioAction("查看这笔历史记录",{env.go(Dest(Route.History,r.id))})}}
                else if(s.target!=r || s.form==null) item {GlassPanel {Caption("当前账本内容已更新。为避免结错记录，请重新载入这笔表单。");SmallButton("重新载入表单",{s.reset(r)},enabled=!s.writing)}}
                else {val f=requireNotNull(s.form);items(r.legs.size,key={"leg-$it"}) {i -> val l=r.legs[i];val v=f.legs[i];fun update(next: ResultLeg){s.edit(f.copy(legs=f.legs.at(i){next}))}
                    GlassPanel(Modifier.fillMaxWidth(),padding=16.dp){Caption("MATCH ${i+1}    /    ${r.legs.size}",Moon.Champagne);Section("${l.home}   vs   ${l.away}");Caption(l.entryLine);HorizontalDivider(color=Moon.Rule)
                        Edit("实际赛果",v.results,{update(v.copy(results=it))},"result-$i",hint="例如 2-1")
                        Row(verticalAlignment=Alignment.CenterVertically){Caption("是否命中");StudioPill("命中",v.hit==true,{update(v.copy(hit=true))},Modifier.testTag("hit-$i"));StudioPill("未中",v.hit==false,{update(v.copy(hit=false))},Modifier.testTag("miss-$i"))}
                        Row(horizontalArrangement=Arrangement.spacedBy(10.dp)){Edit("AJR · 0–0.8",v.ajr,{update(v.copy(ajr=it))},"ajr-$i",Modifier.weight(1f),hint="选填",numeric=true);Edit("REP",v.rep,{update(v.copy(rep=it))},"rep-$i",Modifier.weight(1f),hint="选填",numeric=true)}
                        Edit("赛后备注",v.note,{update(v.copy(note=it))},"post-note-$i",hint="记录赛后观察…",multi=true)
                    }
                };item{val focus=LocalFocusManager.current;GlassPanel(Modifier.fillMaxWidth()){Section("实际回款");Caption("整笔投入 ¥ ${r.inputs} · 含本金，零回款请明确填 0。")
                    Edit("Revenue",f.revenue,{s.edit(f.copy(revenue=it))},"revenue",hint="实际到账金额",numeric=true)
                    val issue=f.issue();if(issue!=null)Caption(issue);if(s.message.isNotBlank())Caption(s.message,Moon.Rose)
                    if(!canWrite(ws.mode)) Caption("当前工作区不可写。")
                    StudioAction(if(s.writing) "正在结算…" else "确认结算",{focus.clearFocus();s.submit(g)},Modifier.testTag("settle"),issue==null && !s.writing && canWrite(ws.mode))
                }}}
            }
        }
    }
}
@Composable private fun RecordHeading(r: Stored){
    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){
        Column(Modifier.weight(1f)){Caption(r.created.take(10));Section(r.title.ifBlank {if(r.legs.size==1) "Single Match" else "${r.legs.size} Matches Combo"})}
        Text(if(r.status=="pending") "待结算" else r.status,Modifier.background(Moon.Champagne.copy(alpha=.13f),RoundedCornerShape(12.dp)).padding(horizontal=10.dp,vertical=4.dp),fontSize=12.sp,color=Moon.Champagne)
    }
}
