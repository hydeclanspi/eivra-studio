package com.eivra.studio.v2.insights

import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.*
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlin.math.*

@Composable internal fun Caption(text: String, tint: Color = Moon.Muted) { Text(text,color=tint,fontSize=12.sp,lineHeight=17.sp) }
@Composable private fun Body(text: String) { Text(text,color=Moon.Ink,fontSize=15.sp,lineHeight=21.sp) }
@Composable private fun Title(text: String) { Text(text,color=Moon.Ink,fontSize=18.sp,lineHeight=23.sp,fontWeight=FontWeight.SemiBold) }

@Composable internal fun DrawBlock(b: Block, wide: Boolean, go: (Dest)->Unit, choose: (String)->Unit) {
    when(b) {
        is Block.Stats -> { val cols=if(wide) b.values.size else 2
            Column(verticalArrangement=Arrangement.spacedBy(8.dp)) { for(group in b.values.chunked(cols)) Row(horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                for(s in group) GlassPanel(Modifier.weight(1f),padding=14.dp,radius=16.dp) { Caption(s.label); Text(s.value,color=Moon.Ink,fontSize=if(wide) 29.sp else 24.sp,lineHeight=32.sp,fontWeight=FontWeight.Medium); Caption(s.basis) }
                repeat(cols-group.size) { Spacer(Modifier.weight(1f)) }
            } }
        }
        is Block.Section -> Column(Modifier.padding(top=10.dp,bottom=3.dp),verticalArrangement=Arrangement.spacedBy(3.dp)) { Title(b.name); if(b.hint.isNotEmpty()) Caption(b.hint) }
        is Block.Note -> GlassPanel(Modifier.fillMaxWidth(),padding=16.dp,radius=16.dp) { Title(b.title); Body(b.body) }
        is Block.Line -> { val shape=RoundedCornerShape(12.dp); val dest=b.dest
            val action=if(dest==null) Modifier else Modifier.clickable(role=Role.Button,onClickLabel="查看原记录或档案") { go(dest) }
            Column(Modifier.fillMaxWidth().clip(shape).background(Color.White.copy(alpha=.55f)).then(action).padding(horizontal=14.dp,vertical=10.dp)) {
                if(wide) Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(14.dp)) { Text(b.title,Modifier.weight(1f),fontWeight=FontWeight.Medium); Text(b.detail,Modifier.weight(1.15f),color=Moon.Muted,fontSize=13.sp); Caption(b.tail,Moon.Accent) }
                else { Body(b.title); Caption(b.detail); Caption(b.tail,Moon.Accent) }
            }
        }
        is Block.Match -> MatchPanel(b,wide,go)
        is Block.Slice -> GlassPanel(Modifier.fillMaxWidth(),padding=16.dp,radius=14.dp) {
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween) { Title(b.name); Caption("n = ${b.n} ${b.unit}") }
            if(b.hit!=null) LinearProgressIndicator(progress={ (b.hit/100).toFloat().coerceIn(0f,1f) },modifier=Modifier.fillMaxWidth().height(5.dp),color=Moon.Accent,trackColor=Moon.Mid)
            Body("命中率 ${b.hit.pct()}     ROI ${b.roi.pct()}")
        }
        is Block.Trace -> TracePanel(b,go)
        is Block.Choices -> LazyRow(horizontalArrangement=Arrangement.spacedBy(4.dp)) { items(b.options,key={it.first}) { (id,name) -> StudioPill(name,id==b.active,{choose(id)}) } }
    }
}

@Composable private fun MatchPanel(b: Block.Match, wide: Boolean, go: (Dest)->Unit) {
    val l=b.leg
    GlassPanel(Modifier.fillMaxWidth(),padding=if(wide) 22.dp else 16.dp) {
        Caption("第 ${b.index} 腿   /   ${l.mode ?: "模式未记录"}",Moon.Accent)
        Title(l.match)
        HorizontalDivider(color=Moon.Rule)
        val before: @Composable ()->Unit = {
            Caption("投前  ·  ENTRIES",Moon.Sky)
            if(l.entries.isEmpty()) Body(l.entryText ?: "没有记录 Entry") else l.entries.forEach { e -> Body(e.name + (e.odds?.let { "   × ${it.fmt()}" } ?: "")) }
            l.prediction?.let { Body("预测比分  $it") }; Caption("Conf  ${l.conf.fmt()}"); l.note?.let { Body(it) }
        }
        val after: @Composable ()->Unit = {
            Caption("赛后  ·  RESULT",Moon.Champagne)
            Text(l.score ?: "比分未记录",fontSize=if(l.score==null) 16.sp else 28.sp,fontWeight=FontWeight.SemiBold,color=Moon.Ink)
            Body(l.outcome); if(l.result!=null) Caption("结算原文  ${l.result}"); Caption("AJR  ${l.ajr.fmt()}"); l.review?.let { Body(it) }
        }
        if(wide) Row(horizontalArrangement=Arrangement.spacedBy(24.dp)) { Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)) { before() }; Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)) { after() } }
        else { Column(verticalArrangement=Arrangement.spacedBy(4.dp)) { before() }; HorizontalDivider(color=Moon.Rule); Column(verticalArrangement=Arrangement.spacedBy(4.dp)) { after() } }
        Row(Modifier.horizontalScroll(rememberScrollState())) { listOf(b.home,b.away).filter { it.isNotBlank() }.distinct().forEach { name -> TextButton(onClick={go(Dest(Route.Teams,name))}) { Text("$name 档案 →",fontSize=13.sp) } } }
    }
}

@Composable private fun TracePanel(t: Block.Trace, go: (Dest)->Unit) {
    val pts=t.points; if(pts.isEmpty()) return
    var cursor by rememberSaveable { mutableIntStateOf(pts.lastIndex) }; val idx=cursor.coerceIn(0,pts.lastIndex); val p=pts[idx]
    val range=remember(pts) { pts.minOf { it.value } to pts.maxOf { it.value } }
    val detail="${p.label} · ${p.readout}"
    GlassPanel(Modifier.fillMaxWidth(),padding=16.dp) {
        Title(t.title); Caption("${pts.size} 个观测   /   ${range.first.fmt()} – ${range.second.fmt()} ${t.unit}")
        Spacer(Modifier.fillMaxWidth().height(100.dp).semantics {
            contentDescription=t.title; stateDescription="第 ${idx+1} 个，$detail"
            if(pts.size>1) { progressBarRangeInfo=ProgressBarRangeInfo(idx.toFloat(),0f..pts.lastIndex.toFloat()); setProgress { v -> cursor=v.roundToInt().coerceIn(0,pts.lastIndex); true } }
        }.pointerInput(pts.size) { detectTapGestures { tap -> cursor=(tap.x/size.width.coerceAtLeast(1)*pts.lastIndex).roundToInt().coerceIn(0,pts.lastIndex) } }.drawWithCache {
            val pad=6.dp.toPx(); val w=(size.width-2*pad).coerceAtLeast(1f); val h=(size.height-2*pad).coerceAtLeast(1f)
            fun point(i:Int) = Offset(if(pts.size==1) size.width/2 else pad+w*i/pts.lastIndex,if(range.first==range.second) size.height/2 else pad+h*(1-(pts[i].value-range.first)/(range.second-range.first)).toFloat())
            val path=Path(); val first=point(0); path.moveTo(first.x,first.y)
            for(i in 1 until pts.size) { val at=point(i); path.lineTo(at.x,at.y) }
            onDrawBehind { repeat(3) { val y=pad+h*it/2; drawLine(Moon.Rule,Offset(0f,y),Offset(size.width,y),1.dp.toPx()) }; drawPath(path,Moon.Sky,style=Stroke(width=2.dp.toPx())); val selected=point(idx); drawLine(Moon.Rule,Offset(selected.x,0f),Offset(selected.x,size.height),1.dp.toPx()); drawCircle(Moon.Accent,4.dp.toPx(),selected) }
        })
        Body(detail)
        Row(verticalAlignment=Alignment.CenterVertically) { TextButton(onClick={cursor=idx-1},enabled=idx>0) { Text("上一点") }; Caption("${idx+1} / ${pts.size}"); TextButton(onClick={cursor=idx+1},enabled=idx<pts.lastIndex) { Text("下一点") }; p.dest?.let { TextButton(onClick={go(it)}) { Text("看原票") } } }
    }
}
