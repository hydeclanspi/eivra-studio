package com.eivra.studio.v2

import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.platform.*
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.*
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import com.eivra.studio.v2.ledger.LedgerScreen
import com.eivra.studio.v2.strategy.StrategyScreen
import com.eivra.studio.v2.insights.InsightsScreen
import com.eivra.studio.v2.platform.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState); enableEdgeToEdge()
        val ports=openPorts(applicationContext)
        setContent { StudioTheme { StudioHost(ports) } }
    }
}
private fun Dest.token() = route.name + "|" + (key?.let { Uri.encode(it) } ?: "")
private fun decode(s:String) = Dest(Route.valueOf(s.substringBefore('|')),s.substringAfter('|', "").ifEmpty { null }?.let { Uri.decode(it) })
private val primary=listOf(Route.New,Route.Portfolio,Route.Settle,Route.Quants,Route.Dashboard,Route.History,Route.Console)
private fun children(r:Route)=when(r.section){
    "Dashboard" -> listOf(Route.Dashboard to "Overview",Route.Seasons to "Seasons",Route.Metrics to "Metrics",Route.Analysis to "Analysis")
    "History" -> listOf(Route.History to "Records",Route.Teams to "Teams")
    else -> emptyList()
}

@Composable fun StudioHost(ports:StudioPorts) {
    var stack by rememberSaveable { mutableStateOf(arrayListOf(Dest(Route.New).token())) }
    val holder=rememberSaveableStateHolder(); val token=stack.last(); val dest=remember(token){decode(token)}
    val go:(Dest)->Unit={ next -> val id=next.token(); if(id!=stack.last()){
        val before=stack; val after=ArrayList((before + id).takeLast(24)); stack=after
        before.filterNot { it in after }.distinct().forEach{holder.removeState(it)}
    }}
    BackHandler(stack.size>1){ val last=stack.last();stack=ArrayList(stack.dropLast(1)); if(last !in stack) holder.removeState(last) }
    val state by ports.state.collectAsState()
    BoxWithConstraints(Modifier.fillMaxSize()){
        MoonScene(Modifier.matchParentSize()); val width=maxWidth.value.toInt()
        Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing).imePadding()){
            Header(dest,width,state,go)
            Box(Modifier.fillMaxSize().testTag("workspace-${dest.route.name}")){
                holder.SaveableStateProvider(token){
                    val env=StudioEnv(dest,width,ports,go)
                    when(dest.route){
                        Route.New, Route.Settle -> LedgerScreen(env)
                        Route.Portfolio, Route.Quants -> StrategyScreen(env)
                        Route.Console -> PlatformScreen(env)
                        else -> InsightsScreen(env)
                    }
                }
            }
        }
    }
}

@Composable private fun Header(dest:Dest,width:Int,state:WorkspaceState,go:(Dest)->Unit){
    var menu by remember { mutableStateOf("") };val wide=width>=900; val shape=RoundedCornerShape(17.dp)
    Row(Modifier.fillMaxWidth().padding(horizontal=if(wide) 14.dp else 9.dp,vertical=7.dp)
        .shadow(5.dp,shape,ambientColor=Moon.Cool.copy(alpha=.25f),spotColor=Moon.Cool.copy(alpha=.30f)).clip(shape)
        .background(Brush.horizontalGradient(listOf(Color.White.copy(alpha=.79f),Color.White.copy(alpha=.44f))))
        .border(.8.dp,Color.White.copy(alpha=.88f),shape).heightIn(min=48.dp).padding(horizontal=if(wide) 14.dp else 10.dp),verticalAlignment=Alignment.CenterVertically){
        BrandMark(); Spacer(Modifier.width(8.dp))
        Text(if(width<305) "Eivra" else "Eivra Studio",fontWeight=FontWeight.SemiBold,fontSize=15.sp,letterSpacing=(-.3).sp,maxLines=1)
        if(width>=520){ Text("Inspiration",Modifier.padding(start=10.dp).background(Color.White.copy(alpha=.60f),RoundedCornerShape(8.dp)).padding(horizontal=8.dp,vertical=4.dp),fontSize=10.sp,color=Moon.Muted) }
        if(width>=1150 || (!wide && width>=340)) Text(" /  ${dest.route.title}",Modifier.weight(if(wide) .30f else 1f).padding(start=4.dp),maxLines=1,overflow=TextOverflow.Ellipsis,color=Moon.Muted,fontSize=12.sp)
        if(state.mode in listOf("demo","owner") && width>=1220) Text(if(state.mode=="demo") "demo · preview" else "local",Modifier.background(Color(0x558EE3C1),RoundedCornerShape(12.dp)).padding(horizontal=8.dp,vertical=3.dp),color=Color(0xFF336553),fontSize=10.sp)
        if(wide){
            Spacer(Modifier.width(8.dp));Row(Modifier.weight(1f).horizontalScroll(rememberScrollState()),horizontalArrangement=Arrangement.spacedBy(2.dp),verticalAlignment=Alignment.CenterVertically){ primary.forEach{r->
                val sub=children(r); val active=dest.route.section==r.section
                Box { NavItem(r.section,active,sub.isNotEmpty(),if(r==Route.Settle) state.pendingCount else null){if(sub.isEmpty()) go(Dest(r)) else menu=r.name}
                    DropdownMenu(expanded=menu==r.name,onDismissRequest={menu=""}){sub.forEach{(route,label)->DropdownMenuItem(text={Text(label)},onClick={menu="";go(Dest(route))})}} }
            }}
        } else {
            if(width<340) Spacer(Modifier.weight(1f))
            Box { TextButton(onClick={menu="all"},modifier=Modifier.testTag("menu").semantics{contentDescription="工作区导航"}){Text("☰",color=Moon.Ink,fontSize=18.sp)}
                DropdownMenu(expanded=menu=="all",onDismissRequest={menu=""}){ Route.entries.forEach{r->DropdownMenuItem(text={Text(if(r==Route.Portfolio) "Portfolio" else r.name,color=if(dest.route==r) Moon.Accent else Moon.Ink)},onClick={menu="";go(Dest(r))},modifier=Modifier.testTag("go-${r.name}"))} } }
        }
    }
}

@Composable private fun NavItem(label:String,active:Boolean,hasChildren:Boolean,badge:Int?,click:()->Unit){
    Box(Modifier.height(44.dp).clip(RoundedCornerShape(8.dp)).clickable(role=Role.Button,onClick=click).semantics{selected=active}.testTag("nav-$label").padding(horizontal=9.dp),contentAlignment=Alignment.Center){
        Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(3.dp)){
            Text(label,fontSize=12.sp,maxLines=1,fontWeight=if(active) FontWeight.SemiBold else FontWeight.Normal,color=if(active) Moon.Ink else Moon.Muted)
            if(badge!=null && badge>0) Text(badge.toString(),Modifier.background(Moon.Accent,RoundedCornerShape(8.dp)).padding(horizontal=4.dp),color=Color.White,fontSize=10.sp,lineHeight=13.sp)
            if(hasChildren) Text("⌄",fontSize=10.sp,color=Moon.Muted)
        }
        if(active) Spacer(Modifier.align(Alignment.BottomCenter).size(26.dp,2.dp).background(Moon.Accent,RoundedCornerShape(1.dp)))
    }
}

@Composable private fun BrandMark(){
    val facets=listOf(Triple("H",0xFFF7F4EF,0xFFEEEAD4),Triple("D",0xFFF3EFE8,0xFFEBE6DA),Triple("C",0xFFECE8E0,0xFFE5E0D5),Triple("S",0xFFE8E3D9,0xFFE0DACE))
    Box(Modifier.size(30.dp).clearAndSetSemantics{},contentAlignment=Alignment.Center){
        Box(Modifier.size(21.dp).rotate(45f).clip(RoundedCornerShape(2.dp))){
            Column { repeat(2){row->Row{repeat(2){col->val (letter,a,b)=facets[row*2+col];Box(Modifier.size(10.5.dp).background(Brush.linearGradient(listOf(Color(a),Color(b)))),contentAlignment=Alignment.Center){Text(letter,Modifier.rotate(-45f),fontSize=4.8.sp,lineHeight=6.sp,fontFamily=FontFamily.Serif,color=Moon.Champagne)}}}} }
            Spacer(Modifier.align(Alignment.Center).size(2.5.dp).background(Color(0xFFE5C763),RoundedCornerShape(2.dp)))
        }
    }
}
