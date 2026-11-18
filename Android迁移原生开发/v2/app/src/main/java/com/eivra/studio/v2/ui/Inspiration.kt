package com.eivra.studio.v2.ui

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.*
import androidx.compose.ui.geometry.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import kotlin.math.*

object Moon {
    val Light = Color(0xFFF5F7FB); val Base = Color(0xFFE4E9EF); val Mid = Color(0xFFCFD9E5); val Cool = Color(0xFFACBCD0)
    val Warm = Color(0xFFDCE0E8); val WarmLight = Color(0xFFF2F5F8)
    val Ink = Color(0xFF26282D); val Muted = Color(0xFF626976); val Accent = Color(0xFF5856B9)
    val Champagne = Color(0xFF90713E); val Rose = Color(0xFFAC496A); val Sky = Color(0xFF4679A9)
    val Rule = Color(0x22394358)
}

// CSS angle convention: 0deg points up; endpoints span the bounding box along the gradient axis.
private fun gradient(angle: Double, rect: Rect, vararg stops: Pair<Float,Color>): Brush {
    val theta = Math.toRadians(angle); val x = sin(theta).toFloat(); val y = -cos(theta).toFloat()
    val d = (abs(x)*rect.width + abs(y)*rect.height)/2f; val v = Offset(x*d, y*d)
    return Brush.linearGradient(colorStops = stops, start=rect.center-v, end=rect.center+v)
}

/** Static, cached draw instructions. No screenshot sampling, full-screen blur or per-frame ticker. */
@Composable fun MoonScene(modifier: Modifier = Modifier) {
    Spacer(modifier.drawWithCache {
        val w=size.width; val h=size.height; val bounds=Rect(Offset.Zero,size)
        val cool=Rect(.04f*w,-1.15f*h,1.60f*w,.57f*h); val warm=Rect(-.54f*w,.74f*h,1.06f*w,2.14f*h)
        val base=gradient(120.0,bounds,0f to Moon.Light,.67f to Moon.Base)
        val upper=gradient(166.0,cool,.43f to Moon.Light,.68f to Moon.Mid,.93f to Moon.Cool)
        val lower=gradient(30.0,warm,.42f to Moon.Warm,.92f to Moon.WarmLight)
        val veil=gradient(108.0,bounds,0f to Color.White.copy(alpha=.21f),.46f to Color.Transparent,1f to Color.White.copy(alpha=.07f))
        val cr=CornerRadius(cool.width*.48f,cool.height*.48f); val wr=CornerRadius(warm.width*.48f,warm.height*.48f)
        onDrawBehind {
            drawRect(base)
            rotate(-24f,cool.center){drawRoundRect(Color.White.copy(alpha=.47f),cool.topLeft+Offset(0f,2.dp.toPx()),cool.size,cr);drawRoundRect(upper,cool.topLeft,cool.size,cr)}
            rotate(-21f,warm.center){drawRoundRect(Color.White.copy(alpha=.60f),warm.topLeft-Offset(0f,2.dp.toPx()),warm.size,wr);drawRoundRect(lower,warm.topLeft,warm.size,wr)}
            drawRect(veil)
        }
    })
}

@Composable fun StudioTheme(content: @Composable () -> Unit) {
    val colors=remember {lightColorScheme(primary=Moon.Accent, onPrimary=Color.White, background=Moon.Light, onBackground=Moon.Ink, surface=Moon.Light, onSurface=Moon.Ink, onSurfaceVariant=Moon.Muted, outline=Moon.Rule, error=Color(0xFFAF394C))}
    MaterialTheme(colorScheme=colors){ CompositionLocalProvider(LocalContentColor provides Moon.Ink,content=content) }
}

/** A translucent composited surface; not a real-time backdrop blur. Content is never blurred. */
@Composable fun GlassPanel(modifier: Modifier = Modifier, padding: Dp = 20.dp, radius: Dp = 20.dp, content: @Composable ColumnScope.() -> Unit) {
    val shape=RoundedCornerShape(radius)
    Column(modifier.shadow(5.dp,shape,ambientColor=Moon.Cool.copy(alpha=.25f),spotColor=Moon.Cool.copy(alpha=.27f)).clip(shape)
        .background(Brush.linearGradient(listOf(Color.White.copy(alpha=.76f),Color(0xA6F4F7FC),Color.White.copy(alpha=.49f))))
        .border(.8.dp,Brush.linearGradient(listOf(Color.White.copy(alpha=.95f),Color.White.copy(alpha=.36f),Color.White.copy(alpha=.8f))),shape)
        .padding(padding),verticalArrangement=Arrangement.spacedBy(10.dp),content=content)
}

@Composable fun PageHeading(title: String, subtitle: String, modifier: Modifier = Modifier) {
    Column(modifier,verticalArrangement=Arrangement.spacedBy(4.dp)) {
        Text(title,style=TextStyle(fontSize=26.sp,lineHeight=32.sp,fontWeight=FontWeight.SemiBold,letterSpacing=(-.6).sp),color=Moon.Ink)
        Text(subtitle,style=TextStyle(fontSize=13.sp,lineHeight=19.sp),color=Moon.Muted)
    }
}

@Composable fun StudioPill(label: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val shape=RoundedCornerShape(12.dp)
    Box(modifier.heightIn(min=44.dp).clip(shape).clickable(role=Role.Button,onClick=onClick).semantics{this.selected=selected}.padding(vertical=5.dp),contentAlignment=Alignment.Center){
        Text(label,Modifier.background(if(selected) Moon.Accent.copy(alpha=.10f) else Color.Transparent,shape).padding(horizontal=12.dp,vertical=6.dp),color=if(selected) Moon.Accent else Moon.Muted,fontSize=13.sp,maxLines=1,overflow=TextOverflow.Ellipsis)
    }
}

@Composable fun StudioField(label:String, value:String, onChange:(String)->Unit, modifier:Modifier=Modifier, hint:String="", singleLine:Boolean=true) {
    val source=remember{MutableInteractionSource()};val focused by source.collectIsFocusedAsState();val shape=RoundedCornerShape(12.dp)
    Column(modifier,verticalArrangement=Arrangement.spacedBy(5.dp)){
        Text(label,color=Moon.Muted,fontSize=12.sp)
        BasicTextField(value=value,onValueChange=onChange,singleLine=singleLine,interactionSource=source,textStyle=TextStyle(fontSize=15.sp,lineHeight=21.sp,color=Moon.Ink),cursorBrush=SolidColor(Moon.Accent),modifier=Modifier.fillMaxWidth().semantics{contentDescription=label},decorationBox={inner->
            Box(Modifier.fillMaxWidth().heightIn(min=44.dp).background(Color.White.copy(alpha=.68f),shape).border(if(focused) 1.3.dp else .8.dp,if(focused) Moon.Accent else Moon.Rule,shape).padding(horizontal=12.dp,vertical=9.dp),contentAlignment=Alignment.CenterStart){if(value.isEmpty()) Text(hint,color=Moon.Muted.copy(alpha=.72f),fontSize=15.sp);inner()}
        })
    }
}

@Composable fun StudioAction(label:String,onClick:()->Unit,modifier:Modifier=Modifier,enabled:Boolean=true){
    Button(onClick=onClick,enabled=enabled,modifier=modifier.heightIn(min=44.dp),shape=RoundedCornerShape(12.dp),colors=ButtonDefaults.buttonColors(containerColor=Moon.Accent)){ Text(label,fontSize=14.sp) }
}

@Composable fun LanePending(title:String){
    Box(Modifier.fillMaxSize().padding(22.dp),contentAlignment=Alignment.TopCenter){GlassPanel(Modifier.widthIn(max=780.dp).fillMaxWidth()){PageHeading(title,"此工作区正在独立分支开发，尚未接入此构建。");Text("集成基线 · 未加载账本",fontSize=12.sp,color=Moon.Muted)}}
}
