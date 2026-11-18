package com.eivra.studio.v2.strategy

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.ui.*

@Composable internal fun Label(s:String) = Text(s,color=Moon.Ink,fontSize=16.sp,fontWeight=FontWeight.SemiBold)
@Composable internal fun Note(s:String) = Text(s,color=Moon.Muted,fontSize=13.sp,lineHeight=19.sp)
@Composable internal fun Serial(s:String) = Text(s,color=Moon.Accent,fontSize=12.sp,fontFamily=FontFamily.Monospace,fontWeight=FontWeight.Medium)
@Composable internal fun LineItem(k:String,v:String) {
    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp)) {
        Text(k,Modifier.weight(1f),color=Moon.Muted,fontSize=13.sp); Text(v,color=Moon.Ink,fontSize=14.sp,fontFamily=FontFamily.Monospace)
    }
}
@Composable internal fun Strip(vararg options:Pair<String,String>, selected:String, choose:(String)->Unit) {
    Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),horizontalArrangement=Arrangement.spacedBy(2.dp)) {
        options.forEach { (value,title) -> StudioPill(title,value==selected,{ choose(value) }) }
    }
}
@Composable internal fun Message(title:String,why:String,action:String?=null,click:()->Unit={}) {
    GlassPanel(Modifier.fillMaxWidth(),padding=16.dp) { Label(title); Note(why); if(action!=null) TextButton(onClick=click) { Text(action) } }
}
@Composable internal fun <T> readResource(vararg identity:Any?, enabled:Boolean=true, wait:Long=0, load:suspend ()->T): Pair<LatestRead<T>,ReadState<T>> {
    val scope=rememberCoroutineScope()
    val slot=remember(*identity,enabled) { LatestRead<T>(scope) }
    DisposableEffect(slot) { if(enabled) slot.start(wait,load); onDispose { slot.invalidate() } }
    return slot to key(slot) { slot.state.collectAsState().value }
}
@Composable internal fun Desk(wide:Boolean, title:String, subtitle:String, right:Boolean, setRight:(Boolean)->Unit, tabs:Pair<String,String>, inputs:LazyListScope.()->Unit, results:LazyListScope.()->Unit) {
    Column(Modifier.fillMaxSize(),verticalArrangement=Arrangement.spacedBy(8.dp)) {
        PageHeading(title,subtitle)
        if(!wide) Strip("left" to tabs.first,"right" to tabs.second,selected=if(right) "right" else "left",choose={setRight(it=="right")})
        val leftScroll=rememberLazyListState(); val rightScroll=rememberLazyListState()
        Row(Modifier.fillMaxSize(), horizontalArrangement=Arrangement.spacedBy(16.dp)) {
            if(wide || !right) LazyColumn(Modifier.weight(if(wide) .42f else 1f).fillMaxHeight().testTag("desk.input"),state=leftScroll,verticalArrangement=Arrangement.spacedBy(8.dp),contentPadding=PaddingValues(bottom=36.dp),content=inputs)
            if(wide || right) LazyColumn(Modifier.weight(if(wide) .58f else 1f).fillMaxHeight().testTag("desk.output"),state=rightScroll,verticalArrangement=Arrangement.spacedBy(8.dp),contentPadding=PaddingValues(bottom=36.dp),content=results)
        }
    }
}
@Composable internal fun EntryRows(leg:Leg) {
    leg.entries.forEachIndexed { index, entry ->
        HorizontalDivider(color=Moon.Rule)
        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)) {
            Serial("E%02d".format(index+1)); Column(Modifier.weight(1f)) { Text(entry.name,color=Moon.Ink,fontSize=14.sp); entry.market?.let {Note(it)} }; Serial(entry.quote?.let { "× $it" } ?: "未报价")
        }
    }
}
