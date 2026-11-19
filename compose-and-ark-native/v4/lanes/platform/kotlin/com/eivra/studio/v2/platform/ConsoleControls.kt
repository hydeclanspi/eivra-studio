package com.eivra.studio.v2.platform

import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.ui.*

// All dimensions here concern the visible controls, not the host's viewport padding.
private data class Parameter(val key:String,val label:String,val en:String,val tint:Color,val ink:Color,val unit:String="")
private val parameters=listOf(
    Parameter("initialCapital","初始本金","Initial Capital",Color(0xFFECFDF5),Color(0xFF047857),"¥"),
    Parameter("riskCapRatio","风控比例上限","Risk Cap Ratio",Color(0xFFEFF6FF),Color(0xFF0369A1)),
    Parameter("defaultOdds","默认 Odds","Default Odds",Color(0xFFF5F3FF),Color(0xFF6D28D9)),
    Parameter("maxWorstDrawdownAlertPct","最坏回撤二次确认阈值","Worst Drawdown Confirm (%)",Color(0xFFFFFBEB),Color(0xFF92400E),"%"),
    Parameter("kellyDivisor","Kelly 分母","Kelly Divisor",Color(0xFFF5F3FF),Color(0xFF6D28D9)))
private val textInk=Color(0xFF44403C)

@Composable internal fun ConsoleAction(label:String,onClick:()->Unit,modifier:Modifier=Modifier,enabled:Boolean=true,danger:Boolean=false,selected:Boolean=false){
    val source=remember { MutableInteractionSource() };val pressed by source.collectIsPressedAsState();val focused by source.collectIsFocusedAsState()
    val ink=if(danger) Color(0xFF9F3C25) else if(selected) Moon.Accent else textInk
    val shape=RoundedCornerShape(8.dp)
    Box(modifier.heightIn(min=48.dp).widthIn(min=48.dp).clickable(interactionSource=source,indication=null,enabled=enabled,role=Role.Button,onClick=onClick),contentAlignment=Alignment.Center){
        Box(Modifier.clip(shape).background(when{!enabled->Moon.Rule.copy(alpha=.08f);pressed->ink.copy(alpha=.21f);danger||selected->ink.copy(alpha=.12f);else->Color.White.copy(alpha=.54f)})
            .border(if(focused) 1.5.dp else .8.dp,if(focused) Moon.Accent else ink.copy(alpha=if(enabled) .19f else .09f),shape).padding(horizontal=11.dp,vertical=6.dp)){
            Text(label,color=if(enabled) ink else Moon.Muted,fontSize=12.sp,lineHeight=17.sp,fontWeight=FontWeight.Medium,letterSpacing=0.sp)
        }
    }
}

@Composable private fun TitlePair(name:String,en:String,badge:String){
    Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.Top,horizontalArrangement=Arrangement.spacedBy(9.dp)){
        Column(Modifier.weight(1f)){Text(name,modifier=Modifier.semantics{heading()},color=textInk,fontSize=15.sp,lineHeight=19.sp,fontWeight=FontWeight.SemiBold);Text(en,color=Moon.Muted,fontSize=10.sp,lineHeight=15.sp,letterSpacing=.3.sp)}
        Text(badge,modifier=Modifier.background(Color(0x99ECFDF5),RoundedCornerShape(9.dp)).padding(horizontal=9.dp,vertical=3.dp),color=Color(0xFF047857),fontSize=9.sp,lineHeight=14.sp,letterSpacing=.7.sp,fontWeight=FontWeight.SemiBold)
    }
}
@Composable internal fun ConsoleParameterGroups(values:List<String>,enabled:Boolean,onEdit:(Int,String)->Unit){
    GlassPanel(Modifier.fillMaxWidth().testTag("console.risk"),padding=14.dp,radius=16.dp){
        TitlePair("资金与风控","Capital & Risk Controls","4 PARAMS")
        Spacer(Modifier.fillMaxWidth().height(1.dp).background(Brush.horizontalGradient(listOf(Color(0x8877DDB5),Color.Transparent))))
        BoxWithConstraints { val wide=maxWidth>=490.dp
            Column(verticalArrangement=Arrangement.spacedBy(10.dp)){
                if(wide){for(pair in listOf(0 to 1,2 to 3)) Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp)){
                    for(i in listOf(pair.first,pair.second)) NumberTile(i,values[i],enabled,{onEdit(i,it)},Modifier.weight(if(i==0||i==3) 3f else 2f))
                }}else for(i in 0..3) NumberTile(i,values[i],enabled,{onEdit(i,it)},Modifier.fillMaxWidth())
            }
        }
    }
    GlassPanel(Modifier.fillMaxWidth(),padding=14.dp,radius=16.dp){TitlePair("Kelly 参数","Kelly Parameters","KELLY");NumberTile(4,values[4],enabled,{onEdit(4,it)},Modifier.fillMaxWidth())}
}
@Composable private fun NumberTile(i:Int,value:String,enabled:Boolean,onEdit:(String)->Unit,modifier:Modifier){
    val field=parameters[i];val source=remember{MutableInteractionSource()};val focus by source.collectIsFocusedAsState();val shape=RoundedCornerShape(14.dp);val editShape=RoundedCornerShape(7.dp)
    Row(modifier.clip(shape).background(Brush.linearGradient(listOf(Color.White.copy(alpha=.86f),field.tint.copy(alpha=.69f),field.tint.copy(alpha=.45f)))).border(.8.dp,field.ink.copy(alpha=.12f),shape).padding(12.dp),verticalAlignment=Alignment.Top,horizontalArrangement=Arrangement.spacedBy(6.dp)){
        Column(Modifier.weight(1f)){
            Canvas(Modifier.size(25.dp).background(Color.White.copy(alpha=.73f),RoundedCornerShape(9.dp)).padding(5.dp)){
                val w=size.width;val h=size.height;val c=field.ink;val pts=when(i){0->listOf(.12f to .3f,.86f to .3f,.86f to .8f,.12f to .8f,.12f to .3f,.66f to .13f);1->listOf(.5f to .1f,.86f to .25f,.78f to .66f,.5f to .9f,.22f to .66f,.14f to .25f,.5f to .1f);3->listOf(.5f to .1f,.92f to .84f,.08f to .84f,.5f to .1f);else->listOf(.08f to .76f,.4f to .43f,.61f to .61f,.9f to .2f)};pts.zipWithNext().forEach{(a,b)->drawLine(c,Offset(a.first*w,a.second*h),Offset(b.first*w,b.second*h),1.35.dp.toPx())}
            };Spacer(Modifier.height(6.dp));Text(field.label,color=textInk,fontSize=13.sp,lineHeight=18.sp,fontWeight=FontWeight.SemiBold,letterSpacing=0.sp);Text(field.en,color=Moon.Muted,fontSize=10.sp,lineHeight=15.sp,letterSpacing=0.sp)
        }
        Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(3.dp)){
            if(i==0) Text("¥",color=Moon.Muted,fontSize=13.sp)
            BasicTextField(value,onEdit,modifier=Modifier.width(86.dp).heightIn(min=48.dp).testTag("console.field.${field.key}").semantics{contentDescription=listOf(field.label,field.unit).filter{it.isNotEmpty()}.joinToString(" ")},enabled=enabled,singleLine=true,interactionSource=source,keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Decimal),textStyle=TextStyle(color=textInk,fontSize=13.sp,lineHeight=18.sp,fontWeight=FontWeight.SemiBold,textAlign=TextAlign.End,fontFeatureSettings="tnum"),cursorBrush=SolidColor(Moon.Accent),decorationBox={inner->
                Box(Modifier.fillMaxWidth().heightIn(min=48.dp),contentAlignment=Alignment.Center){Box(Modifier.fillMaxWidth().background(Color.White.copy(alpha=.82f),editShape).border(if(focus) 1.4.dp else .8.dp,if(focus) Moon.Accent else Moon.Rule,editShape).padding(horizontal=9.dp,vertical=6.dp)){inner()}}
            });if(i==3) Text("%",color=Moon.Muted,fontSize=13.sp)
        }
    }
}

@Composable internal fun RestorePreview(p:org.json.JSONObject,busy:Boolean,onCancel:()->Unit,onConfirm:()->Unit){
    val workspace=if(p.getString("mode")=="demo") "演示工作区" else "个人工作区"
    Column(Modifier.fillMaxWidth().testTag("console.restore.preview").background(Color(0x44FFF3DD),RoundedCornerShape(10.dp)).padding(12.dp),verticalArrangement=Arrangement.spacedBy(3.dp)){
        Text("预检通过 · 尚未恢复",modifier=Modifier.semantics{heading()},color=Moon.Ink,fontSize=14.sp,fontWeight=FontWeight.SemiBold)
        Text("$workspace：${p.getInt("before")} 笔 → ${p.getInt("after")} 笔，其中 ${p.getInt("pending")} 笔待结算。",color=textInk,fontSize=13.sp)
        Text(if(p.getBoolean("replacesDrafts")) "当前草稿也将替换。" else "当前草稿不会改动。",color=Moon.Muted,fontSize=12.sp)
        Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){ConsoleAction("取消恢复",onCancel,enabled=!busy);ConsoleAction("确认替换此工作区",onConfirm,Modifier.testTag("console.restore.confirm"),enabled=!busy,danger=true)}
    }
}
