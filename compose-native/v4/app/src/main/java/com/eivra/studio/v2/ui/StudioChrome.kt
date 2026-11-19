package com.eivra.studio.v2.ui

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.*
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.api.*

private val Roots = listOf(Route.New, Route.Portfolio, Route.Settle, Route.Quants, Route.Dashboard, Route.History, Route.Console)
private val Groups = mapOf(Route.Dashboard to listOf(Route.Seasons to "Seasons", Route.Dashboard to "Overview", Route.Metrics to "Metrics", Route.Analysis to "Analysis"), Route.History to listOf(Route.History to "Records", Route.Teams to "Teams"))
private val Rail = Brush.horizontalGradient(listOf(Color(0xFF6366F1), Color(0xFF818CF8)))
private data class Facet(val glyph:String,val a:Color,val b:Color,val ink:Color)
private val facets=listOf(Facet("H",Color(0xFFF7F4EF),Color(0xFFEEEAD4),Color(0xFF675F55)),Facet("D",Color(0xFFF3EFE8),Color(0xFFEBE6DA),Color(0xFFB8860B)),Facet("C",Color(0xFFECE8E0),Color(0xFFE5E0D5),Color(0xFF918779)),Facet("S",Color(0xFFE8E3D9),Color(0xFFE0DACE),Color(0xFFAB8B21)))

@Composable private fun Mark(){
    Box(Modifier.size(26.dp).clearAndSetSemantics {},contentAlignment=Alignment.Center){
        Box(Modifier.size(18.dp).rotate(45f).clip(RoundedCornerShape(1.dp))){
            Column { repeat(2){r->Row {repeat(2){c->val f=facets[2*r+c];Box(Modifier.size(9.dp).background(Brush.linearGradient(listOf(f.a,f.b))),contentAlignment=Alignment.Center){Text(f.glyph,Modifier.rotate(-45f),color=f.ink,fontFamily=FontFamily.Serif,fontWeight=FontWeight.SemiBold,fontSize=4.5.sp,lineHeight=5.sp)}}}} }
            Box(Modifier.align(Alignment.Center).size(2.1.dp).background(Color(0xFFDBB654),RoundedCornerShape(2.dp)))
        }
    }
}

@Composable private fun Chevron(){Canvas(Modifier.size(10.dp)){val y=size.height*.40f;val p=Offset(size.width*.5f,size.height*.64f);val ink=Color(0xFF84888E);drawLine(ink,Offset(size.width*.17f,y),p,1.dp.toPx(),StrokeCap.Round);drawLine(ink,p,Offset(size.width*.83f,y),1.dp.toPx(),StrokeCap.Round)}}
@Composable private fun ModeBadge(mode:String){
    if(mode !in listOf("demo","owner")) return
    Text(if(mode=="demo") "demo · preview" else "local",Modifier.background(Color(0x99DCF6E9),RoundedCornerShape(16.dp)).padding(horizontal=8.dp,vertical=2.dp),color=Color(0xFF246550),fontFamily=StudioSans,fontSize=11.sp,lineHeight=14.sp,maxLines=1)
}
@Composable private fun EditionLabel(){
    // Read-only edition label: do not show a fake Modern switch before both editions exist.
    val shape=RoundedCornerShape(7.dp)
    Row(Modifier.height(23.dp).background(Brush.linearGradient(listOf(Color(0xF8FFFFFF),Color(0xA9E7EEF8))),shape).border(.65.dp,Color(0x477C91AE),shape).padding(horizontal=7.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(3.dp)){
        Text("✧",color=Color(0xFF596777),fontSize=12.sp); Text("Inspiration",fontFamily=StudioSans,fontSize=9.sp,lineHeight=11.sp,color=Color(0xFF334155),fontWeight=FontWeight.SemiBold)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun StudioChrome(dest:Dest,width:Int,state:WorkspaceState,go:(Dest)->Unit){
    val scale=LocalDensity.current.fontScale.coerceAtLeast(1f);val room=(width/scale).toInt();val wide=room>=900
    var menu by remember(dest,wide) { mutableStateOf<Route?>(null) };var switcher by remember(dest,wide){ mutableStateOf(false) }
    val route=dest.route
    Row(Modifier.fillMaxWidth().heightIn(min=48.dp).testTag("studio-header").padding(horizontal=if(wide) 22.dp else 12.dp),verticalAlignment=Alignment.CenterVertically){
        Row(Modifier.heightIn(min=48.dp).clip(RoundedCornerShape(6.dp)).clickable(role=Role.Button,onClick={go(Dest(Route.New))}).testTag("brand-home").semantics{contentDescription="Eivra Studio · New"},horizontalArrangement=Arrangement.spacedBy(8.dp),verticalAlignment=Alignment.CenterVertically){
            Mark(); if(room>=205) Text(if(room<290) "Eivra" else "Eivra Studio",fontFamily=StudioSans,fontWeight=FontWeight.SemiBold,fontSize=15.sp,letterSpacing=.4.sp,maxLines=1,color=Color(0xFF171717))
        }
        if(wide || room>=590) {Spacer(Modifier.width(8.dp));EditionLabel()}
        if(room>=260){Text("/",Modifier.padding(horizontal=8.dp),color=Color(0xFF9EA3A9),fontSize=14.sp);Text(route.title,if(wide) Modifier.widthIn(max=150.dp) else Modifier.weight(1f),color=Color(0xFF525252),fontFamily=StudioSans,fontWeight=FontWeight.Medium,fontSize=12.sp,letterSpacing=(-.1).sp,maxLines=1,overflow=TextOverflow.Ellipsis)}
        if(room>=1100){Spacer(Modifier.width(10.dp));ModeBadge(state.mode)}
        if(wide || room<260) Spacer(Modifier.weight(1f))
        if(wide){
            Roots.forEach{top->Box {
                RailItem(top,route.section==top.section,if(top==Route.Settle) state.pendingCount else null){if(top in Groups) menu=top else go(Dest(top))}
                val sub=Groups[top];if(sub!=null) DropdownMenu(expanded=menu==top,onDismissRequest={menu=null},containerColor=Color(0xFFF7F9FC),shape=RoundedCornerShape(14.dp)){sub.forEach{(r,label)->DropdownMenuItem(text={Text(label,fontFamily=StudioSans,fontSize=13.sp,color=if(r==route) Moon.Accent else Moon.Ink)},modifier=Modifier.testTag("go-${r.name}"),onClick={menu=null;go(Dest(r))})}}
            }}
        }else{
            IconButton(onClick={switcher=true},modifier=Modifier.size(48.dp).testTag("menu").semantics{contentDescription="工作区导航"}){Canvas(Modifier.size(18.dp)){val ink=Moon.Ink;for(y in listOf(.24f,.50f,.76f)) drawLine(ink,Offset(1.dp.toPx(),size.height*y),Offset(size.width-1.dp.toPx(),size.height*y),1.3.dp.toPx(),StrokeCap.Round)}}
        }
    }
    if(switcher){
        val sheet=rememberModalBottomSheetState(skipPartiallyExpanded=true)
        ModalBottomSheet(onDismissRequest={switcher=false},sheetState=sheet,containerColor=Color(0xFFF4F7FB),contentColor=Moon.Ink){
            Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(start=22.dp,end=22.dp,bottom=16.dp)){
                Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(9.dp)){Mark();Text("Eivra Studio",fontFamily=StudioSans,fontWeight=FontWeight.SemiBold,fontSize=18.sp);EditionLabel()}
                Row(Modifier.padding(top=4.dp,bottom=12.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(7.dp)){Text("工作区导航",color=Moon.Muted,fontSize=12.sp);ModeBadge(state.mode)}
                Roots.forEach{top->val sub=Groups[top];if(sub==null) SheetLink(top.section,top,route) {switcher=false;go(Dest(it))} else {
                    HorizontalDivider(color=Moon.Rule);Text(top.section,Modifier.padding(start=10.dp,top=9.dp,bottom=3.dp),fontFamily=StudioSans,fontSize=11.sp,color=Moon.Muted,fontWeight=FontWeight.Medium)
                    sub.forEach{(r,label)->SheetLink(label,r,route){switcher=false;go(Dest(it))}}
                }}
            }
        }
    }
}

@Composable private fun SheetLink(label:String,r:Route,current:Route,go:(Route)->Unit){
    val active=r==current;val shape=RoundedCornerShape(9.dp)
    Row(Modifier.fillMaxWidth().heightIn(min=48.dp).clip(shape).background(if(active) Color(0x116366F1) else Color.Transparent).clickable(role=Role.Button){go(r)}.semantics{selected=active}.testTag("go-${r.name}").padding(horizontal=12.dp),verticalAlignment=Alignment.CenterVertically){Text(label,Modifier.weight(1f),fontFamily=StudioSans,fontSize=14.sp,fontWeight=if(active) FontWeight.SemiBold else FontWeight.Normal,color=if(active) Moon.Accent else Moon.Ink);if(active) Box(Modifier.size(5.dp).background(Moon.Accent,RoundedCornerShape(6.dp)))}
}
@Composable private fun RailItem(route:Route,active:Boolean,badge:Int?,open:()->Unit){
    val console=route==Route.Console
    Box(Modifier.height(48.dp).widthIn(min=48.dp).clickable(role=Role.Button,onClick=open).semantics{selected=active}.testTag("nav-${route.section}"),contentAlignment=Alignment.Center){
        Row(Modifier.padding(horizontal=if(console) 9.dp else 10.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(4.dp)){
            if(console) Text("▤",color=Moon.Muted,fontSize=12.sp)
            Text(route.section,fontFamily=StudioSans,fontSize=12.sp,fontWeight=if(active) FontWeight.Medium else FontWeight.Normal,color=if(active) Color(0xFF1A1A2E) else Color(0xFF66686B),maxLines=1)
            if(badge!=null && badge>0) Text(badge.toString(),Modifier.background(Color(0xFF5854D7),RoundedCornerShape(10.dp)).padding(horizontal=4.dp),fontFamily=StudioSans,color=Color.White,fontSize=10.sp,lineHeight=14.sp)
            if(route in Groups) Chevron()
        }
        if(active) Spacer(Modifier.align(Alignment.BottomCenter).matchParentSize().padding(horizontal=10.dp).drawWithCache{ onDrawBehind{drawRect(Rail,Offset(0f,size.height-2.dp.toPx()),androidx.compose.ui.geometry.Size(size.width,2.dp.toPx()))} })
    }
}
