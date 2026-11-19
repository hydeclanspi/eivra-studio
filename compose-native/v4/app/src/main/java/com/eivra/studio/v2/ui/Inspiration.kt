package com.eivra.studio.v2.ui

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
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
    MaterialTheme(colorScheme=colors, typography=StudioType){ CompositionLocalProvider(LocalContentColor provides Moon.Ink,content=content) }
}

/** A translucent composited surface; not a real-time backdrop blur. Content is never blurred. */
@Composable fun GlassPanel(modifier: Modifier = Modifier, padding: Dp = 20.dp, radius: Dp = LocalPageEdition.current.radius, content: @Composable ColumnScope.() -> Unit) = StudioSurface(modifier, GlassKind.Panel, padding, radius, content)

@Composable fun PageHeading(title: String, subtitle: String, modifier: Modifier = Modifier) = EditionHeading(title,subtitle,modifier)

@Composable fun StudioPill(label: String, selected: Boolean, onClick: ()->Unit, modifier:Modifier=Modifier){
    val source=remember{MutableInteractionSource()}; val down by source.collectIsPressedAsState();val shape=RoundedCornerShape(7.dp)
    Box(modifier.heightIn(min=44.dp).clickable(interactionSource=source,indication=null,role=Role.Button,onClick=onClick).semantics{this.selected=selected},contentAlignment=Alignment.Center){
        Box(Modifier.clip(shape).background(if(selected) Color(0xFFEEF2FF) else if(down) Color(0xFFEDECF4) else Color(0xCCF8F9FB)).border(.8.dp,if(selected) Color(0xFFC7D2FE) else Color(0x8CE4E3E8),shape).padding(horizontal=9.dp,vertical=4.dp)){
            Text(label,fontSize=11.sp,lineHeight=15.sp,fontWeight=if(selected) FontWeight.SemiBold else FontWeight.Medium,fontFamily=StudioSans,color=if(selected) Color(0xFF4947AC) else Moon.Muted,maxLines=1,overflow=TextOverflow.Ellipsis)
        }
    }
}

@Composable fun StudioField(label:String,value:String,onChange:(String)->Unit,modifier:Modifier=Modifier,hint:String="",singleLine:Boolean=true){
    val source=remember{MutableInteractionSource()};val focused by source.collectIsFocusedAsState();val shape=RoundedCornerShape(12.dp)
    Column(modifier,verticalArrangement=Arrangement.spacedBy(4.dp)){
        Text(label,style=StudioType.bodySmall,color=LocalPageEdition.current.muted)
        BasicTextField(value,onChange,singleLine=singleLine,interactionSource=source,textStyle=TextStyle(fontFamily=StudioSans,fontSize=14.sp,lineHeight=20.sp,color=LocalPageEdition.current.ink),cursorBrush=SolidColor(Moon.Accent),modifier=Modifier.fillMaxWidth().semantics{contentDescription=label},decorationBox={input->
            Box(Modifier.fillMaxWidth().heightIn(min=44.dp).clip(shape).background(Brush.verticalGradient(listOf(Color(0xACFFFFFF),Color(0xDAFFFFFF)))).border(if(focused) 1.2.dp else .8.dp,if(focused) Color(0xB7828ACA) else Color(0x559A9D9E),shape).padding(horizontal=11.dp,vertical=8.dp),contentAlignment=Alignment.CenterStart){if(value.isEmpty()) Text(hint,fontSize=14.sp,lineHeight=20.sp,fontFamily=StudioSans,color=Color(0xFF898D95));input()}
        })
    }
}

@Composable fun StudioAction(label:String,onClick:()->Unit,modifier:Modifier=Modifier,enabled:Boolean=true){
    val src=remember{MutableInteractionSource()};val down by src.collectIsPressedAsState();val shape=RoundedCornerShape(11.7.dp)
    val fill=if(!enabled) listOf(Color(0x759DA5AA),Color(0x6F9AA4AB)) else if(down) listOf(Color(0xFF507186),Color(0xFF496B81)) else listOf(Color(0xFF7193A6),Color(0xFF527B93))
    Box(modifier.heightIn(min=44.dp).clickable(interactionSource=src,indication=null,enabled=enabled,role=Role.Button,onClick=onClick),contentAlignment=Alignment.Center){
        Box(Modifier.clip(shape).background(Brush.linearGradient(fill)).border(.8.dp,Brush.verticalGradient(listOf(Color(0xBFFFFFFF),Color(0x668DA7B6))),shape).padding(horizontal=17.dp,vertical=7.dp),contentAlignment=Alignment.Center){Text(label,fontFamily=StudioSans,fontSize=12.6.sp,lineHeight=18.sp,letterSpacing=(-.09).sp,fontWeight=FontWeight.SemiBold,color=if(enabled) Color.White else Color(0xFF555F66))}
    }
}

@Composable fun LanePending(title:String){
    Box(Modifier.fillMaxSize().padding(22.dp),contentAlignment=Alignment.TopCenter){GlassPanel(Modifier.widthIn(max=780.dp).fillMaxWidth()){PageHeading(title,"此工作区正在独立分支开发，尚未接入此构建。");Text("集成基线 · 未加载账本",fontSize=12.sp,color=Moon.Muted)}}
}
