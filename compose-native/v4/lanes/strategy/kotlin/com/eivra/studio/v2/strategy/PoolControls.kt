package com.eivra.studio.v2.strategy

import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.*
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.ui.Moon
import kotlin.math.roundToInt

private val honey=Color(0xFFD97706)
private val sun=Brush.linearGradient(listOf(Color(0xFFFBBF24),Color(0xFFF97316)))

@Composable internal fun PoolHeading(open:Boolean, toggle:()->Unit) {
    Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically) {
        Text("今日备选比赛",Modifier.weight(1f),color=Moon.Ink,fontSize=14.sp,lineHeight=21.sp,fontWeight=FontWeight.Medium)
        Disclosure(open,"候选列表",toggle)
    }
}
@Composable internal fun Disclosure(open:Boolean,label:String,toggle:()->Unit) {
    IconButton(onClick=toggle,modifier=Modifier.size(48.dp).semantics {contentDescription=label;stateDescription=if(open) "已展开" else "已折叠"}) {
        Canvas(Modifier.size(12.dp).rotate(if(open) 180f else 0f)) {
            drawLine(Moon.Muted,Offset(size.width*.15f,size.height*.37f),center+Offset(0f,size.height*.18f),1.5.dp.toPx(),StrokeCap.Round)
            drawLine(Moon.Muted,center+Offset(0f,size.height*.18f),Offset(size.width*.85f,size.height*.37f),1.5.dp.toPx(),StrokeCap.Round)
        }
    }
}
@Composable internal fun PoolFailure(cause:String,retry:()->Unit) {
    Column(Modifier.testTag("pool.error")) {
        Text(if(cause.contains("Unregistered operation",true)) "当前版本未接入候选接口" else "未能读取候选比赛",color=Moon.Ink,fontSize=14.sp)
        Note(cause); TextButton(onClick=retry,modifier=Modifier.testTag("pool.retry")) { Text("重试候选池") }
    }
}
@Composable internal fun PoolRow(leg:Leg,checked:Boolean,editable:Boolean,toggle:()->Unit) {
    var open by rememberSaveable(leg.key){mutableStateOf(false)}
    val shape=RoundedCornerShape(7.2.dp);val small=RoundedCornerShape(4.dp)
    val ink=when(leg.role){"lever"->Color(0xFF97520B);"stable"->Color(0xFF146751);else->Color(0xFF566284)}
    val active=editable && leg.issue==null
    Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically) {
        Box(Modifier.weight(1f).heightIn(min=48.dp).clip(shape).testTag("candidate:${leg.key}").toggleable(checked,enabled=active,role=Role.Checkbox,onValueChange={toggle()}),contentAlignment=Alignment.Center) {
            Row(Modifier.fillMaxWidth().alpha(if(active) 1f else .55f).heightIn(min=28.dp).background(Color.White.copy(alpha=.42f),shape).border(.8.dp,Color(0xFFE7E5E4),shape).padding(horizontal=7.dp,vertical=4.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                Box(Modifier.size(16.dp).background(if(checked) Color(0xFFFFE9C4) else Color.White,small).border(1.3.dp,if(checked) Color(0xFFF4B73B) else Color(0xFFD6D3D1),small),contentAlignment=Alignment.Center){ if(checked) Canvas(Modifier.size(10.dp)) {drawLine(honey,Offset(0f,size.height*.5f),Offset(size.width*.37f,size.height*.83f),1.6.dp.toPx(),StrokeCap.Round);drawLine(honey,Offset(size.width*.37f,size.height*.83f),Offset(size.width,size.height*.13f),1.6.dp.toPx(),StrokeCap.Round)} }
                Text(leg.title,Modifier.weight(1f),color=Moon.Ink,fontSize=11.sp,lineHeight=16.sp,maxLines=2,overflow=TextOverflow.Ellipsis,fontWeight=FontWeight.Medium)
                Text(roleName(leg.role),Modifier.background(ink.copy(alpha=.09f),small).border(.7.dp,ink.copy(alpha=.24f),small).padding(horizontal=5.dp,vertical=1.dp),color=ink,fontSize=10.sp,lineHeight=14.sp)
            }
        }
        Disclosure(open,leg.title+" 明细"){open=!open}
    }
    leg.issue?.let{Note(it)}
    if(open) QuoteDetail(leg)
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun RiskRail(value:Int,enabled:Boolean,change:(Int)->Unit) {
    val source=remember{MutableInteractionSource()};val focus by source.collectIsFocusedAsState();val down by source.collectIsDraggedAsState();val press by source.collectIsPressedAsState()
    Column(Modifier.fillMaxWidth().testTag("risk.block")) {
        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){Text("Risk Preference",Modifier.weight(1f).alignByBaseline(),fontSize=12.6.sp,lineHeight=18.sp,color=Moon.Muted);Text("$value%",Modifier.alignByBaseline(),fontSize=12.6.sp,lineHeight=18.sp,color=honey,fontWeight=FontWeight.Medium)}
        Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(14.dp)) {
            Text("保守",fontSize=11.sp,color=Moon.Muted)
            Slider(value=value.toFloat(),onValueChange={change(it.roundToInt())},enabled=enabled,valueRange=0f..100f,interactionSource=source,
                modifier=Modifier.weight(1f).height(48.dp).testTag("risk.slider").semantics{contentDescription="Risk Preference";stateDescription="$value%"},
                thumb={Box(Modifier.size(if(down || press) 16.dp else 14.4.dp).shadow(2.dp,CircleShape).background(sun,CircleShape).then(if(focus) Modifier.border(2.dp,honey,CircleShape) else Modifier))},
                track={Box(Modifier.fillMaxWidth().height(5.4.dp).background(Color(0xFFE7E5E4),CircleShape))})
            Text("激进",fontSize=11.sp,color=Moon.Muted)
        }
    }
}
@Composable internal fun GenerateAction(again:Boolean,enabled:Boolean,generate:()->Unit) {
    Box(Modifier.fillMaxWidth().heightIn(min=48.dp).clip(RoundedCornerShape(10.dp)).testTag("generate").clickable(enabled=enabled,role=Role.Button,onClick=generate),contentAlignment=Alignment.Center) {
        Box(Modifier.fillMaxWidth().alpha(if(enabled) 1f else .42f).background(Brush.horizontalGradient(listOf(Color(0xFF575ED8),Color(0xFF7264C8))),RoundedCornerShape(10.dp)).padding(10.dp),contentAlignment=Alignment.Center){Text(if(again) "重新生成组合" else "生成最优组合",color=Color.White,fontWeight=FontWeight.SemiBold,fontSize=13.sp)}
    }
}

@Composable internal fun ChoiceStrip(vararg options:Pair<String,String>,selected:String,choose:(String)->Unit) {
    Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),horizontalArrangement=Arrangement.spacedBy(5.dp)) {
        options.forEach { (id,label) ->
            val on=id==selected;val edge=if(on) Color(0xFF6E9AA1) else Color(0xFFDFE4E4); val shape=RoundedCornerShape(7.dp)
            Box(Modifier.heightIn(min=48.dp).widthIn(min=48.dp).clickable(role=Role.RadioButton){choose(id)}.semantics{this.selected=on},contentAlignment=Alignment.Center) {
                Text(label,Modifier.background(if(on) Color(0xFFE0F0EC) else Color.White.copy(alpha=.6f),shape).border(.8.dp,edge,shape).padding(horizontal=8.dp,vertical=5.dp),fontSize=11.sp,lineHeight=16.sp,color=if(on) Color(0xFF275D63) else Moon.Muted,fontWeight=if(on) FontWeight.SemiBold else FontWeight.Normal)
            }
        }
    }
}

@Composable private fun QuoteDetail(leg:Leg){
    val ink=Color(0xFF535862);val quiet=Color(0xFF6F747B);val hair=Color(0x25717A87)
    Column(Modifier.fillMaxWidth().testTag("quote-detail").padding(start=9.dp,end=9.dp,bottom=10.dp),verticalArrangement=Arrangement.spacedBy(7.dp)) {
        HorizontalDivider(thickness=.7.dp,color=hair)
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp),verticalAlignment=Alignment.CenterVertically){
            Text("α  ${leg.conf.fmt()}",fontSize=12.sp,color=quiet);Text("Odds  ${leg.odds.fmt()}",fontSize=12.sp,color=ink,fontStyle=androidx.compose.ui.text.font.FontStyle.Italic)
            leg.evPercent?.let{Text("EV %+.1f%%".format(java.util.Locale.ROOT,it),fontSize=12.sp,color=if(it>=0)Color(0xFF24765C)else Moon.Rose)}
        }
        leg.entries.forEachIndexed{i,e->Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)){
            Text("%02d".format(i+1),color=quiet,fontSize=10.sp,letterSpacing=.6.sp);Column(Modifier.weight(1f)){Text(e.name,fontSize=13.sp,lineHeight=18.sp,color=ink);e.market?.takeIf{it!=e.name}?.let{Text(it,fontSize=10.sp,color=quiet)}};Text(e.quote?.let{"× $it"}?:"未报价",color=ink,fontSize=13.sp)
        }};leg.suggested?.takeIf{it>0}?.let{Text("建议金额   ${it.fmt()} rmb",color=quiet,fontSize=11.sp)}
    }
}
