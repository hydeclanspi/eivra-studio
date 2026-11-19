package com.eivra.studio.v2.ui

import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.*
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.*
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.currentStateAsState
import kotlinx.coroutines.delay
import kotlin.math.*

/** A single clock per indicator. Consumers read it only in draw, never in layout or accessibility. */
@Composable internal fun studioPhase(period:Int):State<Float>{
 val life by LocalLifecycleOwner.current.lifecycle.currentStateAsState();val resolver=LocalContext.current.contentResolver
 fun enabled()=Settings.Global.getFloat(resolver,Settings.Global.ANIMATOR_DURATION_SCALE,1f)>0f
 var motion by remember(resolver){mutableStateOf(enabled())}
 DisposableEffect(resolver){val o=object:ContentObserver(Handler(Looper.getMainLooper())){override fun onChange(selfChange:Boolean){motion=enabled()}};resolver.registerContentObserver(Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE),false,o);onDispose{resolver.unregisterContentObserver(o)}}
 return if(life.isAtLeast(Lifecycle.State.STARTED)&&motion)rememberInfiniteTransition(label="optical phase").animateFloat(0f,1f,infiniteRepeatable(tween(period,easing=LinearEasing)),label="phase") else remember{mutableFloatStateOf(.27f)}
}
private val facets=listOf(Color(0xFF507598),Color(0xFF98BECB),Color(0xFF6D648F),Color(0xFFC3AB83))
private val glints=listOf(Color(0xFF6296AB),Color(0xFFA385BA),Color(0xFFBD975E))
@Composable fun TideWait(label:String="正在读取工作区",modifier:Modifier=Modifier){
 var lit by remember{mutableStateOf(false)};LaunchedEffect(Unit){delay(140);lit=true}
 if(!lit){Spacer(modifier.fillMaxWidth().height(40.dp));return}
 val clock=studioPhase(6000);val row=Modifier.fillMaxWidth().heightIn(min=40.dp).testTag("tide.wait").semantics(mergeDescendants=true){progressBarRangeInfo=ProgressBarRangeInfo.Indeterminate}
 BoxWithConstraints(modifier.then(row)){val wide=maxWidth>=408.dp;val railWidth=(maxWidth*.28f).coerceIn(105.dp,220.dp)
    Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)){
        PrismRotor(clock)
        if(wide){Text(label,Modifier.weight(1f),fontSize=13.sp,lineHeight=19.sp,color=Color(0xFF4C5B69));PrismRail(clock,Modifier.width(railWidth))}
        else Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(6.dp)){Text(label,fontSize=12.5.sp,lineHeight=18.sp,color=Color(0xFF4C5B69));PrismRail(clock,Modifier.fillMaxWidth())}
    }
 }
}
@Composable private fun PrismRotor(clock:State<Float>){
 Spacer(Modifier.size(42.dp,40.dp).testTag("tide.prism").drawWithCache{
    val c=Offset(size.width/2,size.height/2);val u=1.dp.toPx();val points=listOf(Offset(c.x,c.y-12*u),Offset(c.x+12*u,c.y),Offset(c.x,c.y+12*u),Offset(c.x-12*u,c.y));val hub=c+Offset(1.4f*u,-1.7f*u)
    val paths=List(4){i->Path().apply{moveTo(points[i].x,points[i].y);lineTo(points[(i+1)%4].x,points[(i+1)%4].y);lineTo(hub.x,hub.y);close()}};val outline=Path().apply{moveTo(points[0].x,points[0].y);for(i in 1..3)lineTo(points[i].x,points[i].y);close()};val rim=Stroke(1.1f*u,join=StrokeJoin.Round)
    val halo=Brush.radialGradient(listOf(Color(0x3261A8BF),Color.Transparent),center=c,radius=20*u);val spec=Brush.linearGradient(listOf(Color.White.copy(alpha=.67f),Color.Transparent),points[0],points[2]);val dirs=listOf(Offset(-.76f,-.65f),Offset(.86f,-.5f),Offset(.61f,.79f));val star=Path()
    onDrawBehind { val t=clock.value;drawCircle(halo,20*u,c);rotate(t*720f,c){paths.forEachIndexed{i,p->drawPath(p,facets[i])};drawPath(paths[0],spec);drawPath(outline,Color(0xFF617C92),style=rim);for(i in 0..3)drawLine(Color.White.copy(alpha=if(i==0).90f else .47f),hub,points[i],.8f*u,StrokeCap.Round)}
        for(i in 0..2){val dt=(t-i*.052f-.47f+1f)%1f;if(dt<.24f){val s=dt/.24f;val a=sin(PI*s).toFloat();val at=c+dirs[i]*((13f+8f*s)*u);val r=(.9f+1.8f*a)*u;star.reset();star.moveTo(at.x,at.y-r);star.lineTo(at.x+.26f*r,at.y-.22f*r);star.lineTo(at.x+r,at.y);star.lineTo(at.x+.26f*r,at.y+.22f*r);star.lineTo(at.x,at.y+r);star.lineTo(at.x-.26f*r,at.y+.22f*r);star.lineTo(at.x-r,at.y);star.lineTo(at.x-.26f*r,at.y-.22f*r);star.close();drawPath(star,glints[i].copy(alpha=a*.92f))}}
    }
 })
}
@Composable private fun PrismRail(clock:State<Float>,modifier:Modifier){
 Spacer(modifier.height(7.dp).testTag("tide.rail").drawWithCache{
    val h=4.dp.toPx();val y=size.height/2;val radius=CornerRadius(h/2);val w=size.width;val left=h/2;val right=(w-left).coerceAtLeast(left);val span=w*.37f
    val mask=Path().apply{addRoundRect(RoundRect(Rect(0f,y-h/2,w,y+h/2),radius))};val band=Brush.horizontalGradient(colorStops=arrayOf(0f to Color(0x007185AC),.20f to Color(0xAA7484AD),.55f to Color(0xFF538899),.80f to Color(0xFFA8C7C6),1f to Color(0x0084A8BB)),startX=0f,endX=span.coerceAtLeast(1f));val rail=Color(0x3855687A)
    onDrawBehind {drawLine(rail,Offset(left,y),Offset(right,y),h,StrokeCap.Round);clipPath(mask){val pos=(clock.value*3f)%1f;for(j in 0..1){val q=(pos+j*.5f)%1f;val x=-span+(w+span)*q;translate(x,0f){drawRect(band,Offset(0f,y-h/2),Size(span,h),alpha=if(j==0)1f else .60f)}}};drawLine(Color.White.copy(alpha=.70f),Offset(left,y+h/2+.3.dp.toPx()),Offset(right,y+h/2+.3.dp.toPx()),.65.dp.toPx(),StrokeCap.Round)}
 })
}
