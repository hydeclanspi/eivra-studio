package com.eivra.studio.v2.ui

import androidx.compose.foundation.background
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.geometry.*
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.*
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.font.*
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.R
import com.eivra.studio.v2.api.Route

// One unmodified, OFL-licensed variable font. Android resolves missing CJK glyphs locally.
@OptIn(ExperimentalTextApi::class)
val StudioSans = FontFamily(listOf(FontWeight.Light,FontWeight.Normal,FontWeight.Medium,FontWeight.SemiBold,FontWeight.Bold).map { weight -> Font(R.font.dm_sans, weight=weight, variationSettings=FontVariation.Settings(FontVariation.weight(weight.weight))) })
private fun style(size:Int, line:Int, weight:FontWeight=FontWeight.Normal, tracking:Double=0.0)=TextStyle(fontFamily=StudioSans,fontSize=size.sp,lineHeight=line.sp,fontWeight=weight,letterSpacing=tracking.sp)
internal val StudioType = Typography(displaySmall=style(26,32,FontWeight.SemiBold,-.55),headlineLarge=style(26,33,FontWeight.SemiBold,-.5),headlineMedium=style(24,31,FontWeight.SemiBold,-.35),headlineSmall=style(21,28,FontWeight.SemiBold),titleLarge=style(20,27,FontWeight.SemiBold),titleMedium=style(16,22,FontWeight.Medium),titleSmall=style(14,20,FontWeight.Medium),bodyLarge=style(15,22),bodyMedium=style(13,20),bodySmall=style(12,18),labelLarge=style(14,20,FontWeight.Medium),labelMedium=style(12,17,FontWeight.Medium),labelSmall=style(10,15,FontWeight.Medium,.2))

@Immutable data class PageEdition(val ink:Color,val muted:Color,val radius:Dp,val titleSp:Int,val titleWeight:FontWeight)
private val Folio = PageEdition(Color(0xFF393E42),Color(0xFF666C74),24.dp,26,FontWeight.SemiBold)
private val Glacier = PageEdition(Color(0xFF163E51),Color(0xFF476D7E),23.dp,24,FontWeight.SemiBold)
private val Prism = PageEdition(Color(0xFF233747),Color(0xFF5F7383),10.dp,24,FontWeight.Bold)
private val Records = Prism.copy(titleWeight=FontWeight.SemiBold)
private val Modern = PageEdition(Color(0xFF1A1A2E),Color(0xFF626B76),24.dp,24,FontWeight.Bold)
val LocalPageEdition=staticCompositionLocalOf {Folio}
@Composable internal fun WorkspaceEdition(route:Route,content:@Composable ()->Unit){
    val edition=when(route){Route.New, Route.Portfolio->Folio; Route.Settle->Glacier; Route.History->Records;Route.Console,Route.Teams->Modern;else->Prism}
    CompositionLocalProvider(LocalPageEdition provides edition, LocalContentColor provides edition.ink,content=content)
}

enum class GlassKind { Panel, QuickInput, Well }
/** Layered optical approximation for the static Moon field. No screenshot readback, blur on type, or animation at rest. */
@Composable fun StudioSurface(modifier:Modifier=Modifier,kind:GlassKind=GlassKind.Panel,padding:Dp=20.dp,radius:Dp=LocalPageEdition.current.radius,content:@Composable ColumnScope.()->Unit){
    val shape=remember(kind,radius){when(kind){GlassKind.QuickInput->RoundedCornerShape(7.dp,26.dp,7.dp,7.dp);GlassKind.Well->RoundedCornerShape(12.dp);else->RoundedCornerShape(radius)}}
    val body = kind == GlassKind.Panel; val quick = kind == GlassKind.QuickInput
    val rim=remember(kind){ Brush.linearGradient(listOf(Color.White.copy(alpha=.86f),Color.White.copy(alpha=.64f),Color(0x59657882))) }
    // Shadow is outside the clipped lens. Never put a rectangular fill behind the inner content column.
    Column(modifier.shadow(if(body) 8.dp else if(quick) 7.dp else 1.dp,shape,clip=false,ambientColor=Color(0x20536D80),spotColor=Color(0x4A536B81)).clip(shape).sampleField(quick)
        .drawWithCache {
            val sheen=Brush.radialGradient(colorStops=arrayOf(.18f to Color(0x38F7FBFD),.77f to Color.Transparent),center=Offset(size.width*.45f,size.height*.46f),radius=maxOf(1f,maxOf(size.width,size.height)*.70f))
            val line=Brush.linearGradient(colorStops=arrayOf(.38f to Color.Transparent,.46f to Color(0x0FFFFFFF),.55f to Color.Transparent))
            onDrawBehind{drawRect(if(body) Color(0x1AFFFFFF) else if(quick) Color(0x4DFFFFFF) else Color(0xADFFFFFF));if(body){drawRect(sheen);drawRect(line)}}
        }.border(.9.dp,rim,shape).padding(padding),verticalArrangement=Arrangement.spacedBy(10.dp)) {
        val column=this; LensChildren { column.content() }
    }
}
@Composable internal fun EditionHeading(title:String,subtitle:String,modifier:Modifier){
    val e=LocalPageEdition.current
    Column(modifier,verticalArrangement=Arrangement.spacedBy(4.dp)){Text(title,Modifier.semantics{heading()},fontSize=(e.titleSp*.9f).sp,lineHeight=(e.titleSp*1.23f*.9f).sp,fontFamily=StudioSans,letterSpacing=(-.84).sp,fontWeight=e.titleWeight,color=e.ink);Text(subtitle,style=StudioType.bodyMedium,color=e.muted)}
}
