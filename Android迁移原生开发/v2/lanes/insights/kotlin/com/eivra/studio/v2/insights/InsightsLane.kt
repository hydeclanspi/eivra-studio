package com.eivra.studio.v2.insights

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.*
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.*
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.*
import java.time.*

private sealed interface ResultState {
    data object Loading : ResultState
    data class Ready(val cells: List<Cell>) : ResultState
    data class Failed(val reason: String) : ResultState
}
private val dashboardTabs=listOf(Route.Dashboard to "Overview",Route.Analysis to "Analysis",Route.Metrics to "Metrics",Route.Seasons to "Seasons")
private val historyTabs=listOf(Route.History to "Records",Route.Teams to "Teams")

@Composable fun InsightsScreen(env: StudioEnv) {
    val version by env.ports.state.collectAsStateWithLifecycle()
    val life=LocalLifecycleOwner.current.lifecycle
    var epoch by remember { mutableIntStateOf(0) }
    var foreground by remember(life) { mutableStateOf(life.currentState.isAtLeast(Lifecycle.State.RESUMED)) }
    DisposableEffect(life) {
        val observer=LifecycleEventObserver { _,event -> when(event) {
            Lifecycle.Event.ON_RESUME -> { epoch++; foreground=true }
            Lifecycle.Event.ON_PAUSE -> foreground=false
            else -> Unit
        } }; life.addObserver(observer); onDispose { life.removeObserver(observer) }
    }
    val zone=ZoneId.systemDefault()
    var day by remember(epoch,zone) { mutableStateOf(LocalDate.now(zone)) }
    LaunchedEffect(epoch,foreground,zone) { if(foreground) while(isActive) {
        val next=day.plusDays(1).atStartOfDay(zone).toInstant(); delay(Duration.between(Instant.now(),next).toMillis().coerceAtLeast(1)); day=LocalDate.now(zone)
    } }
    val reader=remember(env.ports,version.mode,version.revision,epoch,day,zone) { ReviewReader(env.ports,version.mode,version.revision,zone,day) }
    key(env.dest,version.mode) { ReviewView(env,reader,foreground) { epoch++ } }
}

@Composable private fun ReviewView(env: StudioEnv, reader: ReviewReader, foreground: Boolean, retry: ()->Unit) {
    val route=env.dest.route; val key=env.dest.key
    var window by rememberSaveable { mutableStateOf(Window.All) }
    var search by rememberSaveable { mutableStateOf("") }; var cut by rememberSaveable { mutableIntStateOf(0) }; var cycle by rememberSaveable { mutableStateOf<String?>(null) }
    val q=Query(env.dest,window,search,cut,cycle)
    // A NEW state holder immediately on every request, not just a restarted producer writing into the old state.
    val result=key(reader,q,foreground) { produceState<ResultState>(ResultState.Loading) {
        if(!foreground) return@produceState
        try { value=ResultState.Ready(withContext(Dispatchers.Default) { reader.page(q) }) }
        catch(c: CancellationException) { throw c }
        catch(e: Exception) { value=ResultState.Failed(if(e is UnsupportedOperationException) "此构建尚未接入所需的只读服务。" else "未能取得完整且一致的记录。请重新读取。") }
    } }.value
    val family=if(route.section=="Dashboard") dashboardTabs else historyTabs
    val title=when(route) { Route.History -> if(key==null) "历史记录" else "记录复盘"; Route.Teams -> if(key==null) "球队档案馆" else "球队档案"; Route.Dashboard -> "Dashboard"; Route.Analysis -> "Deep Analysis"; Route.Metrics -> "Metrics"; else -> "Seasons" }
    BoxWithConstraints(Modifier.fillMaxSize(),contentAlignment=Alignment.TopCenter) {
        val wide=maxWidth>=760.dp; val inset=if(wide) 28.dp else 14.dp
        LazyColumn(Modifier.widthIn(max=1240.dp).fillMaxSize().testTag("review-list"),contentPadding=PaddingValues(start=inset,end=inset,top=12.dp,bottom=36.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
            item("heading") { Column { Caption("${route.section.uppercase()}   /   ${family.firstOrNull { it.first==route }?.second.orEmpty()}",Moon.Accent)
                Row(verticalAlignment=Alignment.CenterVertically) { Text(title,Modifier.weight(1f),style=MaterialTheme.typography.headlineMedium,color=Moon.Ink); if(route==Route.Dashboard || key!=null) TextButton(onClick={env.go(Dest(Route.History))}) { Text(if(key!=null) "记录索引" else "查看历史 →") } }
                Row(Modifier.horizontalScroll(rememberScrollState())) { family.forEach { (r,l) -> StudioPill(l,route==r,{ env.go(Dest(r)) }) } }
                HorizontalDivider(color=Moon.Rule)
            } }
            if(route!=Route.Seasons && !(route==Route.History && key!=null)) item("window") {
                Row(Modifier.horizontalScroll(rememberScrollState()),verticalAlignment=Alignment.CenterVertically) { Caption("登记时间"); Window.entries.forEach { w -> StudioPill(w.label,window==w,{window=w}) } }
            }
            if(key==null && route in listOf(Route.History,Route.Teams)) item("search") { StudioField(if(route==Route.History) "搜索记录" else "搜索球队", search,{search=it},Modifier.fillMaxWidth(),if(route==Route.History) "完整 ID、队名、Entry 或备注" else "球队名或缩写") }
            val cuts=when(route) { Route.History -> if(key==null) RECORDS else ""; Route.Analysis -> SLICES; Route.Metrics -> METRICS; else -> "" }
            if(cuts.isNotEmpty()) item("cut") { Row(Modifier.horizontalScroll(rememberScrollState())) { cuts.split('|').forEachIndexed { i,l -> StudioPill(l,cut==i,{cut=i}) } } }
            when(result) {
                ResultState.Loading -> item("loading") { GlassPanel(Modifier.fillMaxWidth()) { LinearProgressIndicator(Modifier.fillMaxWidth()); Caption("正在读取当前工作区…") } }
                is ResultState.Failed -> item("error") { GlassPanel(Modifier.fillMaxWidth()) { PageHeading("暂时无法读取",result.reason); StudioAction("重新读取",retry) } }
                is ResultState.Ready -> items(result.cells,key={ it.key },contentType={ it.block.javaClass.name }) { cell -> key(reader,q) { DrawBlock(cell.block,wide,env.go) { cycle=it } } }
            }
        }
    }
}
