package com.eivra.studio

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eivra.studio.ui.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

private data class Destination(val id: String, val title: String, val subtitle: String, val icon: ImageVector)
private val destinations = listOf(
    Destination("new", "New", "新建投资", Icons.Outlined.AddCircle),
    Destination("portfolio", "Portfolio", "组合配置", Icons.Outlined.AccountTree),
    Destination("settle", "Settle", "结算记录", Icons.Outlined.TaskAlt),
    Destination("dashboard", "Dashboard", "表现看板", Icons.Outlined.SpaceDashboard),
    Destination("quants", "Quants", "策略研究", Icons.Outlined.Science),
    Destination("history", "History", "历史与球队", Icons.Outlined.History),
    Destination("analysis", "Analysis", "表现切片", Icons.Outlined.Analytics),
    Destination("metrics", "Metrics", "概率校准", Icons.Outlined.Speed),
    Destination("teams", "Teams", "球队画像", Icons.Outlined.Groups),
    Destination("console", "Console", "参数与数据", Icons.Outlined.Tune)
)

@Composable
fun EivraApp(tablet: Boolean) {
    var route by rememberSaveable { mutableStateOf("new") }
    InspirationTheme(route) {
    val context = LocalContext.current
    val repository = remember { WorkspaceRepository(context) }
    var bundle by remember { mutableStateOf<JSONObject?>(null) }
    var engineStatus by remember { mutableStateOf("计算引擎自检中…") }
    var notice by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        try {
            bundle = repository.bootstrap()
            engineStatus = "原生计算 · 原业务内核"
        } catch (e: Exception) {
            bundle = repository.load()
            engineStatus = "引擎启动失败 · ${e.message?.take(80) ?: e.javaClass.simpleName}"
        }
    }
    fun update(next: JSONObject) { bundle = next; repository.save(next) }
    fun saveInvestment(record: JSONObject) {
        scope.launch {
            try { bundle = repository.saveInvestment(record); notice = "已按原数据契约保存"; route = "portfolio" }
            catch (e: Exception) { notice = "保存失败：${e.message}" }
        }
    }
    fun settleInvestment(id: String, form: JSONObject) {
        scope.launch {
            try { bundle = repository.settleInvestment(id, form); notice = "已写入结算与结算时间" }
            catch (e: Exception) { notice = "结算失败：${e.message}" }
        }
    }
    Scaffold(
        contentWindowInsets = WindowInsets.safeDrawing,
        topBar = { EivraTopBar(tablet, route, engineStatus) { route = it } },
        bottomBar = { if (!tablet) PhoneNavigation(route) { route = it } }
    ) { insets ->
        Row(Modifier.fillMaxSize().padding(insets)) {
            if (tablet) TabletNavigation(route) { route = it }
            Box(Modifier.weight(1f).fillMaxHeight().verticalScroll(rememberScrollState()).padding(horizontal = if (tablet) 32.dp else 17.dp, vertical = if (tablet) 26.dp else 19.dp)) {
                Column(Modifier.fillMaxWidth().widthIn(max = 1320.dp).align(Alignment.TopCenter), verticalArrangement = Arrangement.spacedBy(18.dp)) {
                    bundle?.let { current ->
                    when (route) {
                        "new" -> NewInvestmentScreen(tablet, current, repository, ::saveInvestment)
                        "portfolio" -> PortfolioScreen(current)
                        "settle" -> SettleScreen(current, ::settleInvestment)
                        "dashboard" -> DashboardScreen(tablet, current, repository)
                        "quants" -> QuantsScreen(repository)
                        "analysis" -> AnalysisScreen(repository)
                        "metrics" -> MetricsScreen(repository)
                        "teams" -> TeamsScreen(repository)
                        "history" -> HistoryScreen(current)
                        "console" -> ConsoleScreen(current, repository) { next -> bundle = next ?: repository.load(); notice = "本地工作区已更新" }
                    }
                    } ?: GlassCard { Text("正在启动原生计算与工作区…", color = Eivra.Secondary) }
                    if (notice.isNotEmpty()) Text(notice, color = Eivra.Green, style = MaterialTheme.typography.bodyMedium)
                    Text("Precision in uncertainty · 信息期权配仓", style = MaterialTheme.typography.labelMedium, color = Eivra.Secondary, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(vertical = 18.dp))
                }
            }
        }
    }
    }
}

@Composable
private fun EivraTopBar(tablet: Boolean, route: String, status: String, onNavigate: (String) -> Unit) {
    Column(Modifier.background(Eivra.Canvas).padding(horizontal = if (tablet) 28.dp else 18.dp, vertical = 13.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(Modifier.size(if (tablet) 40.dp else 34.dp).clip(CircleShape).background(Eivra.Green), contentAlignment = Alignment.Center) { Text("E", color = Color(0xFFE4CDA6), fontFamily = FontFamily.Serif, fontSize = if (tablet) 26.sp else 21.sp) }
            Column(Modifier.weight(1f)) { Text("Eivra Studio", style = MaterialTheme.typography.titleMedium); Text("Intuition, calibrated.", style = MaterialTheme.typography.labelMedium, color = Eivra.Secondary) }
            if (tablet) { Text("Inspiration", style = MaterialTheme.typography.bodyMedium, color = Eivra.Green); Text("demo · preview", style = MaterialTheme.typography.labelMedium, color = Eivra.Secondary) }
            IconButton(onClick = { onNavigate("console") }) { Icon(Icons.Outlined.Menu, "更多与设置") }
        }
        if (tablet) Row(Modifier.horizontalScroll(androidx.compose.foundation.rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(4.dp)) { destinations.forEach { NavPill(it, route == it.id) { onNavigate(it.id) } } }
        if (route == "new") Text(status, style = MaterialTheme.typography.labelMedium, color = Eivra.Secondary)
    }
}

@Composable
private fun NavPill(destination: Destination, active: Boolean, onClick: () -> Unit) {
    Box(Modifier.clip(RoundedCornerShape(10.dp)).background(if (active) Eivra.Mint else Color.Transparent).clickable(onClick = onClick).padding(horizontal = 11.dp, vertical = 8.dp)) {
        Text(destination.title, style = MaterialTheme.typography.bodyMedium, color = if (active) Eivra.Green else Eivra.Secondary)
    }
}

@Composable
private fun TabletNavigation(route: String, onNavigate: (String) -> Unit) {
    Column(Modifier.width(184.dp).fillMaxHeight().padding(start = 22.dp, top = 22.dp, end = 8.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
        destinations.forEach { item ->
            Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(13.dp)).background(if (route == item.id) Eivra.Mint else Color.Transparent).clickable { onNavigate(item.id) }.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(item.icon, item.subtitle, Modifier.size(18.dp), tint = Eivra.Green)
                Column { Text(item.title, style = MaterialTheme.typography.bodyMedium); Text(item.subtitle, style = MaterialTheme.typography.labelMedium, color = Eivra.Secondary) }
            }
        }
    }
}

@Composable
private fun PhoneNavigation(route: String, onNavigate: (String) -> Unit) {
    NavigationBar(containerColor = Eivra.Surface, tonalElevation = 0.dp) {
        destinations.filter { it.id in listOf("new", "portfolio", "settle", "dashboard") }.forEach { item ->
            NavigationBarItem(selected = route == item.id, onClick = { onNavigate(item.id) }, icon = { Icon(item.icon, item.title, Modifier.size(21.dp)) }, label = { Text(item.title, fontSize = 10.sp) }, colors = NavigationBarItemDefaults.colors(selectedIconColor = Eivra.Green, selectedTextColor = Eivra.Green, indicatorColor = Eivra.Mint, unselectedIconColor = Eivra.Secondary, unselectedTextColor = Eivra.Secondary))
        }
        Row {
            var moreOpen by remember { mutableStateOf(false) }
            val secondary = destinations.drop(4)
            NavigationBarItem(selected = route in secondary.map { it.id }, onClick = { moreOpen = true }, icon = { Icon(Icons.Outlined.MoreHoriz, "更多", Modifier.size(21.dp)) }, label = { Text("More", fontSize = 10.sp) }, colors = NavigationBarItemDefaults.colors(selectedIconColor = Eivra.Green, selectedTextColor = Eivra.Green, indicatorColor = Eivra.Mint, unselectedIconColor = Eivra.Secondary, unselectedTextColor = Eivra.Secondary))
            DropdownMenu(expanded = moreOpen, onDismissRequest = { moreOpen = false }) {
                secondary.forEach { item -> DropdownMenuItem(text = { Text("${item.title} · ${item.subtitle}") }, leadingIcon = { Icon(item.icon, null) }, onClick = { moreOpen = false; onNavigate(item.id) }) }
            }
        }
    }
}

