package com.eivra.studio.v2.platform

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.*
import org.json.*

private val fields=listOf("initialCapital" to "初始本金 · ¥", "riskCapRatio" to "风控比例上限 · 0–1", "defaultOdds" to "默认 Odds", "maxWorstDrawdownAlertPct" to "最坏回撤确认阈值 · %", "kellyDivisor" to "Kelly 分母")
@Composable internal fun LocalConsole(env:StudioEnv) {
    val state by env.ports.state.collectAsState();val scope=rememberCoroutineScope()
    var cfg by remember(state.mode,state.revision){mutableStateOf<JSONObject?>(null)};var rows by remember(state.mode,state.revision){mutableStateOf<List<Pair<Float,Float>>?>(null)}
    var msg by remember(state.mode){mutableStateOf("")};var loadError by remember(state.mode,state.revision){mutableStateOf("")};var retry by remember{mutableIntStateOf(0)};var saving by remember{mutableStateOf(false)}
    LaunchedEffect(state.mode,state.revision,retry){try {
        val settings=withContext(Dispatchers.IO){JSONObject(env.ports.read("params.get"))};cfg=settings
        rows=withContext(Dispatchers.Default){val a=JSONArray(env.ports.read("analytics.getExpectedVsActualRows",JSONArray().put(120)));(a.length()-1 downTo 0).mapNotNull { i->val r=a.getJSONObject(i);val x=r.optDouble("expected_rating");val y=r.optDouble("actual_rating");if(x.isFinite()&&y.isFinite()) x.toFloat() to y.toFloat() else null }}
    } catch(e:CancellationException){throw e}catch(e:Exception){loadError=e.message?:"无法读取本地工作区"} }
    fun switch(target:String){if(saving||target==state.mode)return;saving=true;scope.launch{try{env.ports.write("workspace.switch",JSONArray().put(target));msg=""}catch(e:Exception){msg=e.message?:"切换失败"}finally{saving=false}}}
    LazyColumn(Modifier.fillMaxSize().imePadding(),verticalArrangement=Arrangement.spacedBy(16.dp),contentPadding=PaddingValues(bottom=36.dp)) {
        item { PageHeading("参数后台","系统参数、动态校准系数与 Kelly 分母 · 仅在本机生效") }
        item { GlassPanel(Modifier.fillMaxWidth()){
            Text("CORE METRIC    /    FIT ENGINE",color=Moon.Accent,fontSize=11.sp,letterSpacing=1.sp)
            Text("Expected vs Actual Judgmental Rating",color=Moon.Ink,fontSize=20.sp,fontWeight=FontWeight.SemiBold)
            Text("系统预期与实际判断的贴合程度",color=Moon.Muted,fontSize=13.sp)
            val series=rows
            if(series.isNullOrEmpty())Text(if(series==null) "正在读取拟合样本…" else "尚无同时具备预期与实际评分的已结算记录。",color=Moon.Muted)
            else { Canvas(Modifier.fillMaxWidth().height(72.dp).semantics{contentDescription="${series.size} 个已结算样本的预期与实际评分，按时间从早到晚"}){
                fun pt(i:Int,v:Float)=Offset(size.width*i/(series.size-1).coerceAtLeast(1),size.height*(1-v.coerceIn(0f,1f)))
                drawLine(Moon.Rule,Offset(0f,size.height/2),Offset(size.width,size.height/2));series.forEachIndexed{i,p->val prev=series.getOrNull(i-1);if(prev!=null){drawLine(Moon.Sky,pt(i-1,prev.first),pt(i,p.first),2.dp.toPx());drawLine(Moon.Accent,pt(i-1,prev.second),pt(i,p.second),2.dp.toPx())}else{drawCircle(Moon.Sky,2.dp.toPx(),pt(i,p.first));drawCircle(Moon.Accent,2.dp.toPx(),pt(i,p.second))}} }
                Text("蓝 · 预期     紫 · 实际     最近 ${series.size} 条",color=Moon.Muted,fontSize=12.sp) }
        } }
        item { GlassPanel(Modifier.fillMaxWidth()){Text("本地工作区",color=Moon.Ink);Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){StudioPill("演示",state.mode=="demo",{switch("demo")});StudioPill("个人",state.mode=="owner",{switch("owner")})};Text("${state.pendingCount?.let { "$it 笔待结算" }?:"正在读取"}   ·   版本 ${state.revision}   ·   两个工作区互不写入",color=Moon.Muted,fontSize=13.sp)} }
        if(loadError.isNotEmpty())item{Text(loadError,color=Moon.Rose);StudioAction("重新读取",{loadError="";retry++})}
        item { val settings=cfg;if(settings!=null){
            val params:@Composable (Modifier)->Unit={m->ParamCard(settings,state,m,!saving){patch->if(!saving){saving=true;scope.launch{try{env.ports.write("params.save",JSONArray().put(patch).put(state.revision));msg="参数已保存"}catch(e:Exception){msg=e.message?:"保存失败"}finally{saving=false}}}}}
            if(env.widthDp>=760) Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(16.dp)){params(Modifier.weight(1f));ConsoleFiles(env,state,Modifier.weight(1f))}
            else Column(verticalArrangement=Arrangement.spacedBy(16.dp)){params(Modifier.fillMaxWidth());ConsoleFiles(env,state,Modifier.fillMaxWidth())}
        } }
        if(msg.isNotBlank())item { Text(msg,color=Moon.Ink) }
    }
}
@Composable private fun ParamCard(config:JSONObject,state:WorkspaceState,modifier:Modifier,enabled:Boolean,onSave:(JSONObject)->Unit){
    val base=remember(config){fields.map{config.get(it.first).toString()}};var values by rememberSaveable(state.mode,state.revision){mutableStateOf(ArrayList(base))}
    val valid=values.map{it.toDoubleOrNull()}.let{v->v.all{it!=null&&it.isFinite()}&&v[0]!!>=0&&v[1]!! in 0.0..1.0&&v[2]!!>=1.01&&v[3]!! in 5.0..95.0&&v[4]!!>=1}
    GlassPanel(modifier){Text("资金与风控",color=Moon.Ink,fontSize=18.sp);Text("Capital & Risk Controls",color=Moon.Muted,fontSize=12.sp)
        fields.forEachIndexed{i,f->StudioField(f.second,values[i],{v->values=ArrayList(values).apply{set(i,v)}},Modifier.fillMaxWidth())}
        if(!valid)Text("检查输入：默认 Odds ≥ 1.01，回撤阈值 5–95%，Kelly 分母 ≥ 1。",color=Moon.Rose,fontSize=12.sp)
        StudioAction("保存本地参数",{onSave(JSONObject().apply{fields.forEachIndexed{i,f->if(values[i]!=base[i])put(f.first,values[i].toDouble())}})},enabled=enabled&&valid&&values!=base)
    }
}
