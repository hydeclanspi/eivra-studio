package com.eivra.studio.v2.ledger

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.*
import androidx.compose.ui.geometry.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.*
import androidx.compose.ui.text.font.*
import androidx.compose.ui.text.style.*
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.R
import com.eivra.studio.v2.ui.*
import kotlin.math.*

@OptIn(ExperimentalTextApi::class)
private val QuickFace=FontFamily(listOf(400,540,570,720).map{w->Font(R.font.dm_sans,weight=FontWeight(w),variationSettings=FontVariation.Settings(FontVariation.weight(w)))})
private fun face(pt:Double,height:Double,weight:Int,spacing:Double=0.0)=TextStyle(fontFamily=QuickFace,fontSize=pt.sp,lineHeight=height.sp,fontWeight=FontWeight(weight),letterSpacing=spacing.sp,platformStyle=PlatformTextStyle(includeFontPadding=false))
@Composable internal fun QuickHeading(open:Boolean,toggle:()->Unit){
 val angle by animateFloatAsState(if(open)90f else 0f,tween(160),label="quick disclosure")
 Row(Modifier.fillMaxWidth().testTag("quick.heading").semantics{stateDescription=if(open)"已展开" else "已收起"}.clickable(role=Role.Button,onClickLabel=if(open)"收起快捷录入" else "展开快捷录入",onClick=toggle).heightIn(min=40.5.dp).padding(start=16.2.dp,end=16.2.dp,top=12.6.dp,bottom=9.dp),verticalAlignment=Alignment.CenterVertically){
    Canvas(Modifier.size(12.6.dp).testTag("quick.chevron").rotate(angle)){val u=size.width/24f;val p=Path().apply{moveTo(9*u,18*u);lineTo(15*u,12*u);lineTo(9*u,6*u)};drawPath(p,Color(0xFFA68147),style=androidx.compose.ui.graphics.drawscope.Stroke(2.2f*u,cap=StrokeCap.Round,join=StrokeJoin.Round))}
    Spacer(Modifier.width(7.2.dp));Text("Quick Input",Modifier.testTag("quick.title"),style=face(12.6,18.9,570,.05),color=Color(0xFF7D6136),maxLines=1);Spacer(Modifier.width(10.8.dp));QuickPlaque();Spacer(Modifier.width(10.8.dp));Text("大模型自然语言快捷录入",Modifier.weight(1f),style=face(9.9,14.85,540,.08),color=Color(0xFF9A815B),maxLines=2,overflow=TextOverflow.Ellipsis)
 }
}
@Composable private fun QuickPlaque(){
 val shape=RoundedCornerShape(4.5.dp);val time=studioPhase(3900)
 Box(Modifier.testTag("quick.badge").widthIn(min=42.5.dp).heightIn(min=14.4.dp).shadow(1.4.dp,shape,ambientColor=Color(0x247F6032),spotColor=Color(0x337F6032)).clip(shape).drawWithCache{
    val w=size.width;val h=size.height;val end=w*2.6f;val vert=end*.40f;val gold=Brush.linearGradient(colorStops=arrayOf(0f to Color(0xFFF4EAD8),.22f to Color(0xFFD7BE8E),.42f to Color(0xFFEEE1C9),.59f to Color(0xFFC4A66D),.78f to Color(0xFFE4D2B0),1f to Color(0xFFF2E8D7)),start=Offset(0f,h/2-vert/2),end=Offset(end,h/2+vert/2));val shine=Brush.linearGradient(colorStops=arrayOf(.18f to Color.Transparent,.42f to Color.White.copy(alpha=.38f),.54f to Color(0x1FECDDC1),.76f to Color.Transparent),start=Offset.Zero,end=Offset(w,h*.55f));val u=1.dp.toPx()
    onDrawBehind {val t=time.value;val dx=-.5f*(1f-cos((t*2*PI).toFloat()))*(end-w);drawContext.transform.translate(dx,0f);drawRect(gold,Offset(-dx,0f),Size(w,h));drawContext.transform.translate(-dx,0f);val q=((t-.12f)/.5f).coerceIn(0f,1f);val sx=w*(-1.05f+2.20f*q*q*(3-2*q));drawContext.transform.translate(sx,0f);drawRect(shine,Offset.Zero,Size(w,h));drawContext.transform.translate(-sx,0f);drawLine(Color.White.copy(alpha=.76f),Offset(0f,.7f*u),Offset(w,.7f*u),.9f*u);drawLine(Color(0x1C755424),Offset(0f,h-.9f*u),Offset(w,h-.9f*u),.9f*u)}
 }.border(.65.dp,Color(0x4DA68249),shape).padding(start=5.4.dp,end=5.4.dp,top=.9.dp),contentAlignment=Alignment.Center){Text("LAB · AI",maxLines=1,softWrap=false,color=Color(0xFF70552D),style=face(7.2,7.9,720,.64).copy(shadow=Shadow(Color.White.copy(alpha=.66f),Offset(0f,.65f),.1f)))}
}
@Composable internal fun QuickField(value:String,change:(String)->Unit){
 val src=remember{MutableInteractionSource()};val focused by src.collectIsFocusedAsState();val sh=RoundedCornerShape(9.dp);val sty=face(12.6,18.0,400)
 BasicTextField(value=value,onValueChange=change,modifier=Modifier.fillMaxWidth().testTag("quick").semantics{contentDescription="自然语言快捷录入"},textStyle=sty.copy(color=Color(0xFF4F493F)),cursorBrush=SolidColor(Color(0xFF997846)),interactionSource=src,minLines=2,maxLines=7,decorationBox={inner->Box(Modifier.fillMaxWidth().heightIn(min=69.3.dp).clip(sh).drawWithCache{val glow=Brush.radialGradient(listOf(Color(0x47EFE1C7),Color.Transparent),center=Offset(size.width*.98f,0f),radius=maxOf(size.width*.38f,1f));onDrawBehind{drawRect(Color.White.copy(alpha=.9f));drawRect(glow)}}.border(if(focused)1.dp else .8.dp,if(focused)Color(0xFFA98C5B)else Color(0xFFE2E4E9),sh).padding(horizontal=10.8.dp,vertical=7.2.dp)){
 if(value.isEmpty())Text("示例：1. 利兹联1-2拜仁 conf 0.45 odds 4.3 fse 0.72 mode 常规-杠杆  阿森纳2-0利物浦 odds 3.9 conf 0.71  140块\n2. 巴萨3-3皇马 odds 7.5 20块",style=sty,color=Color(0xFF9CA3AF));inner()}})
}
