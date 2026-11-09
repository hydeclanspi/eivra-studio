package com.eivra.studio

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
    Destination("console", "Console", "参数与数据", Icons.Outlined.Tune)
)

@Composable
fun EivraApp(tablet: Boolean) {
    val context = LocalContext.current
    val repository = remember { WorkspaceRepository(context) }
    var route by rememberSaveable { mutableStateOf("new") }
    var bundle by remember { mutableStateOf(repository.load()) }
    var engineStatus by remember { mutableStateOf("计算引擎自检中…") }
    var notice by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        engineStatus = withContext(Dispatchers.Default) {
            try { NativeEngine(context).use { "原生计算 · ${it.healthCheck().getInt("answer")}" } } catch (e: Exception) { "引擎待接入 · ${e.javaClass.simpleName}" }
        }
    }
    fun update(next: JSONObject) { bundle = next; repository.save(next) }
    Scaffold(
        contentWindowInsets = WindowInsets.safeDrawing,
        topBar = { EivraTopBar(tablet, route, engineStatus) { route = it } },
        bottomBar = { if (!tablet) PhoneNavigation(route) { route = it } }
    ) { insets ->
        Row(Modifier.fillMaxSize().padding(insets)) {
            if (tablet) TabletNavigation(route) { route = it }
            Box(Modifier.weight(1f).fillMaxHeight().verticalScroll(rememberScrollState()).padding(horizontal = if (tablet) 32.dp else 17.dp, vertical = if (tablet) 26.dp else 19.dp)) {
                Column(Modifier.fillMaxWidth().widthIn(max = 1320.dp).align(Alignment.TopCenter), verticalArrangement = Arrangement.spacedBy(18.dp)) {
                    when (route) {
                        "new" -> NewInvestmentScreen(tablet, bundle) { update(it); notice = "已保存到本地工作区"; route = "portfolio" }
                        "portfolio" -> PortfolioScreen(bundle)
                        "settle" -> SettleScreen(bundle) { update(it) }
                        "dashboard" -> DashboardScreen(tablet, bundle)
                        "quants" -> QuantsScreen()
                        "history" -> HistoryScreen(bundle)
                        "console" -> ConsoleScreen(bundle, repository) { bundle = repository.load(); notice = "已恢复演示工作区" }
                    }
                    if (notice.isNotEmpty()) Text(notice, color = Eivra.Green, style = MaterialTheme.typography.bodyMedium)
                    Text("Precision in uncertainty · 信息期权配仓", style = MaterialTheme.typography.labelMedium, color = Eivra.Secondary, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(vertical = 18.dp))
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
        if (tablet) Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) { destinations.forEach { NavPill(it, route == it.id) { onNavigate(it.id) } } }
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
        NavigationBarItem(selected = route in listOf("quants", "history", "console"), onClick = { onNavigate(if (route in listOf("quants", "history", "console")) route else "quants") }, icon = { Icon(Icons.Outlined.MoreHoriz, "更多", Modifier.size(21.dp)) }, label = { Text("More", fontSize = 10.sp) }, colors = NavigationBarItemDefaults.colors(selectedIconColor = Eivra.Green, selectedTextColor = Eivra.Green, indicatorColor = Eivra.Mint, unselectedIconColor = Eivra.Secondary, unselectedTextColor = Eivra.Secondary))
    }
}

@Composable
private fun PageIntro(eyebrow: String, title: String, description: String) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) { Eyebrow(eyebrow); Text(title, style = MaterialTheme.typography.displaySmall); Text(description, style = MaterialTheme.typography.bodyMedium, color = Eivra.Secondary) }
}
