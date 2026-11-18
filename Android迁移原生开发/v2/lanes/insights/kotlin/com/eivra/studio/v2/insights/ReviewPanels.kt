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
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.platform.testTag
import kotlin.math.*

@Composable internal fun Caption(text: String, tint: Color = Moon.Muted) { Text(text,style=MaterialTheme.typography.bodySmall.copy(fontFeatureSettings="tnum"),color=tint,fontSize=12.sp,lineHeight=16.sp,letterSpacing=.1.sp) }
@Composable private fun Body(text: String) { Text(text,color=Moon.Ink,fontSize=15.sp,lineHeight=21.sp) }
@Composable private fun Title(text: String) { Text(text,Modifier.semantics { heading() },color=Moon.Ink,fontSize=16.sp,lineHeight=22.sp,fontWeight=FontWeight.SemiBold) }

// One text run / baseline even when the currency or percent sign has a smaller face.
@Composable private fun MetricValue(value: String) {
    val face=MaterialTheme.typography.titleLarge.copy(fontFeatureSettings="tnum", fontSize=22.sp,
        lineHeight=29.sp, letterSpacing=0.sp, fontWeight=FontWeight.SemiBold)
    val unit=SpanStyle(fontSize=15.sp, fontWeight=FontWeight.Medium)
    val text=remember(value) { buildAnnotatedString {
        if(value.startsWith("¥")) { withStyle(unit){append("¥")}; append(value.drop(1)) }
        else if(value.endsWith("%")) { append(value.dropLast(1)); withStyle(unit){append("%")} }
        else append(value)
    } }
    Text(text,style=face,color=Moon.Ink)
}

@Composable internal fun DrawBlock(b: Block, wide: Boolean, go: (Dest)->Unit, choose: (String)->Unit) {
    when(b) {
        is Block.Stats -> BoxWithConstraints(Modifier.fillMaxWidth()) { val cellWidth=156.dp*LocalDensity.current.fontScale.coerceAtLeast(1f)
            val cols=((maxWidth+8.dp)/(cellWidth+8.dp)).toInt().coerceIn(1,if(wide) b.values.size else 2)
            Column(verticalArrangement=Arrangement.spacedBy(8.dp)) { for(group in b.values.chunked(cols)) Row(horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                for(s in group) GlassPanel(Modifier.weight(1f),padding=if(wide) 21.dp else 15.dp,radius=9.dp) {
                    Column(Modifier.testTag("stat:${s.label}").semantics(mergeDescendants=true){},verticalArrangement=Arrangement.spacedBy(4.dp)) {
                        Caption(s.label); MetricValue(s.value); Caption(s.basis)
                    }
                }
                repeat(cols-group.size) { Spacer(Modifier.weight(1f)) }
            } }
        }
        is Block.Section -> Column(Modifier.padding(top=10.dp,bottom=3.dp),verticalArrangement=Arrangement.spacedBy(3.dp)) { Title(b.name); if(b.hint.isNotEmpty()) Caption(b.hint) }
        is Block.Note -> Column(Modifier.fillMaxWidth().padding(horizontal=10.dp,vertical=8.dp),verticalArrangement=Arrangement.spacedBy(3.dp)) { Title(b.title); Body(b.body) }
        is Block.Line -> ReviewLine(b,wide,go)
        is Block.Match -> MatchPanel(b,wide,go)
        is Block.Slice -> Column(Modifier.fillMaxWidth().padding(horizontal=10.dp,vertical=8.dp),verticalArrangement=Arrangement.spacedBy(4.dp)) {
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween) { Title(b.name); Caption("n = ${b.n} ${b.unit}") }
            if(b.hit!=null) LinearProgressIndicator(progress={ (b.hit/100).toFloat().coerceIn(0f,1f) },modifier=Modifier.fillMaxWidth().height(3.dp),color=Moon.Accent,trackColor=Moon.Mid)
            Body("命中率 ${b.hit.pct()}     ROI ${b.roi.pct()}")
        }
        is Block.Trace -> TracePanel(b,go)
        is Block.Choices -> LazyRow(horizontalArrangement=Arrangement.spacedBy(4.dp)) { items(b.options,key={it.first}) { (id,name) -> StudioPill(name,id==b.active,{choose(id)}) } }
    }
}

@Composable internal fun ReviewPeriod(current:Window,change:(Window)->Unit) {
    var expanded by remember { mutableStateOf(false) }
    Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
        Box {
            TextButton(onClick={expanded=true},modifier=Modifier.heightIn(min=48.dp).testTag("review-period")) {
                Text(current.label, fontSize=13.sp); Text(" ▾",color=Moon.Muted)
            }
            DropdownMenu(expanded=expanded,onDismissRequest={expanded=false}) {
                Window.entries.forEach { w -> DropdownMenuItem(text={Text(w.label)},onClick={expanded=false;change(w)},
                    modifier=Modifier.semantics { selected=w==current }) }
            }
        }
        Caption("按登记时间")
    }
}

@Composable private fun StatusBadge(label:String) {
    val tint=when(label){"命中","已中"->Color(0xFF24684F);"未命中","未中"->Moon.Rose;"待结算"->Moon.Champagne;else->Moon.Muted}
    Text(label,Modifier.background(tint.copy(alpha=.10f),RoundedCornerShape(5.dp)).padding(horizontal=7.dp,vertical=2.dp),
        fontSize=11.sp,lineHeight=16.sp,fontWeight=FontWeight.Medium,color=tint)
}

@Composable private fun ReviewLine(b:Block.Line,wide:Boolean,go:(Dest)->Unit) {
    val dest=b.dest
    val action=if(dest==null) Modifier else Modifier.clickable(role=Role.Button,onClickLabel=if(dest.route==Route.Teams) "查看球队" else "查看原票"){go(dest)}
    Column(Modifier.fillMaxWidth().then(action)) {
        val heading:@Composable ()->Unit={Text(b.title,color=Moon.Ink,fontSize=14.sp,lineHeight=20.sp,fontWeight=FontWeight.Medium)}
        val end:@Composable ()->Unit={
            b.status?.let { StatusBadge(it) }
            if(b.amount!=null) Caption("${b.tail} ${b.amount}") else if(b.tail.isNotBlank()) Caption(b.tail,if(dest==null) Moon.Muted else Moon.Sky)
        }
        if(wide) Row(Modifier.fillMaxWidth().heightIn(min=50.dp).padding(horizontal=10.dp,vertical=6.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)) {
            Column(Modifier.weight(1.2f)){heading()}; Column(Modifier.weight(1f)){Caption(b.detail)}; Column(Modifier.weight(.8f),horizontalAlignment=Alignment.End){end()}
        } else Row(Modifier.fillMaxWidth().heightIn(min=48.dp).padding(horizontal=8.dp,vertical=7.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)) {
            Column(Modifier.weight(1.55f),verticalArrangement=Arrangement.spacedBy(2.dp)){heading();Caption(b.detail)}
            Column(Modifier.weight(1f),horizontalAlignment=Alignment.End){end()}
        }
        HorizontalDivider(thickness=Dp.Hairline,color=Moon.Rule)
    }
}

@Composable private fun MatchPanel(b: Block.Match, wide: Boolean, go: (Dest)->Unit) {
    val l=b.leg
    GlassPanel(Modifier.fillMaxWidth(),padding=if(wide) 18.dp else 14.dp,radius=9.dp) {
        Caption("第 ${b.index} 腿   /   ${l.mode ?: "模式未记录"}",Moon.Accent)
        Title(l.match)
        HorizontalDivider(thickness=Dp.Hairline,color=Moon.Rule)
        val before: @Composable ()->Unit = {
            Caption("投前  ·  ENTRIES",Moon.Sky)
            if(l.entries.isEmpty()) Body(l.entryText ?: "没有记录 Entry") else l.entries.forEach { e -> Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(8.dp)) { Text(e.name,Modifier.weight(1f).alignByBaseline(),fontSize=14.sp,lineHeight=20.sp); e.odds?.let { Text("× ${it.fmt()}",Modifier.alignByBaseline(),style=MaterialTheme.typography.bodyMedium.copy(fontFeatureSettings="tnum"),color=Moon.Sky) } } }
            l.prediction?.let { Body("预测比分  $it") }; Caption("Conf  ${l.conf.fmt()}"); l.note?.let { Body(it) }
        }
        val after: @Composable ()->Unit = {
            Caption("赛后  ·  RESULT",Moon.Champagne)
            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) { Text(l.score ?: "比分未记录",style=MaterialTheme.typography.titleLarge.copy(fontFeatureSettings="tnum"),fontSize=if(l.score==null) 14.sp else 24.sp,fontWeight=FontWeight.SemiBold,color=Moon.Ink); StatusBadge(l.outcome) }
            if(l.result!=null) Caption("结算原文  ${l.result}"); Caption("AJR  ${l.ajr.fmt()}"); l.review?.let { Body(it) }
        }
        if(wide) Row(horizontalArrangement=Arrangement.spacedBy(24.dp)) { Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)) { before() }; Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)) { after() } }
        else { Column(verticalArrangement=Arrangement.spacedBy(4.dp)) { before() }; HorizontalDivider(thickness=Dp.Hairline,color=Moon.Rule); Column(verticalArrangement=Arrangement.spacedBy(4.dp)) { after() } }
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
            onDrawBehind { repeat(3) { val y=pad+h*it/2; drawLine(Moon.Rule,Offset(0f,y),Offset(size.width,y),1.dp.toPx()) }; drawPath(path,Moon.Sky,style=Stroke(width=1.5.dp.toPx())); val selected=point(idx); drawLine(Moon.Rule,Offset(selected.x,0f),Offset(selected.x,size.height),1.dp.toPx()); drawCircle(Moon.Accent,4.dp.toPx(),selected) }
        })
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween) { Caption(pts.first().label); if(pts.size>1) Caption(pts.last().label) }; Body(detail)
        Row(verticalAlignment=Alignment.CenterVertically) { TextButton(onClick={cursor=idx-1},enabled=idx>0) { Text("上一点") }; Caption("${idx+1} / ${pts.size}"); TextButton(onClick={cursor=idx+1},enabled=idx<pts.lastIndex) { Text("下一点") }; p.dest?.let { TextButton(onClick={go(it)}) { Text("看原票") } } }
    }
}
