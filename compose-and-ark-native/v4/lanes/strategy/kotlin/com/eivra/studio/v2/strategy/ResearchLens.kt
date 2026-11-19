package com.eivra.studio.v2.strategy

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*

@Composable internal fun ResearchLens(env:StudioEnv,ws:WorkspaceState){
 var which by rememberSaveable{mutableStateOf("")};var epoch by remember{mutableIntStateOf(0)};var minN by rememberSaveable{mutableStateOf("15")};var q by rememberSaveable{mutableStateOf("0.10")};var n by remember{mutableIntStateOf(15)};var threshold by remember{mutableDoubleStateOf(.1)}
 val (_,s)=readResource(env.ports,ws.mode,ws.revision,which,epoch,enabled=which.isNotBlank()) {if(which=="ratings")env.ports.objectRead("quant.environment") else env.ports.objectRead("quant.scan",n,threshold)}
 GlassPanel(Modifier.fillMaxWidth(),18.dp){Label("策略发现扫描");Note("以历史赛果扫描规则。单个组合的收益排序不等于经多重检验后成立，也不是未来的定价优势。")
 Row(horizontalArrangement=Arrangement.spacedBy(12.dp)){StudioField("最低样本",minN,{minN=it.take(5)},Modifier.weight(1f));StudioField("FDR 阈值 q",q,{q=it.take(7)},Modifier.weight(1f))}
 Row{TextButton({n=minN.toInt();threshold=q.toDouble();which="scan";epoch++},enabled=minN.toIntOrNull() in 2..10000 && q.toDoubleOrNull()?.let{it>0&&it<1}==true){Text("运行扫描")};TextButton({which="ratings";epoch++}){Text("联赛环境与球队评级")}}
 when(s){is ReadState.Value->{val v=s.data;if(which=="scan"){LineItem("已检验 / 通过 FDR","${v.getInt("total")} / ${v.getInt("survivors")}");Note("本次口径：最低 $n 场，q = $threshold。只展示排名靠前的 20 项。");v.getJSONArray("rows").objects().forEach{r->LineItem("${r.text("teamName").orEmpty()} · ${r.text("label").orEmpty()}","n=${r.getInt("n")} · q=${r.number("qValue").fmt()}")};if(v.getInt("total")==0)Note("当前赛果不足以达到样本门槛。")}
 else if(which=="ratings"){val t=v.getJSONArray("teams").objects();val reg=v.getJSONObject("regime");val recent=reg.getJSONObject("recent");val prev=reg.getJSONObject("previous");LineItem("最近 / 上一窗口","${recent.getInt("n")} / ${prev.getInt("n")} 场");if(t.isEmpty())Note("没有可评级的球队。导入带日期的真实赛果后再看。")else {LineItem("近期场均进球",recent.number("avgGoals").fmt());t.take(20).forEach{r->LineItem("${r.getInt("rank")}    ${r.id("name")}",r.number("elo").fmt())}}}}
 is ReadState.Failed->Note(s.message);ReadState.Loading->TideWait("正在分析历史赛果");else->Unit}
 }
}
