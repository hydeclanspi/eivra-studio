package com.eivra.studio

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.eivra.studio.ui.*
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun PortfolioScreen(bundle: JSONObject) {
    PageIntro("PORTFOLIO CONSTRUCTION", "组合配置", "候选判断、资金约束与依赖关系，放在同一张桌面上看。")
    val records = bundle.getJSONArray("investments")
    var pending = 0
    var exposure = 0.0
    for (i in 0 until records.length()) { val r = records.getJSONObject(i); if (r.optString("status") == "pending") { pending++; exposure += r.optDouble("inputs") } }
    GlassCard { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) { Metric("待结算", "$pending 笔"); Metric("在途冻结", "¥ ${"%.0f".format(exposure)}"); Metric("蓄水池", "¥ ${"%.0f".format((bundle.optJSONObject("system_config") ?: bundle.optJSONObject("systemConfig"))?.optDouble("initialCapital", 0.0) ?: 0.0)}") } }
    GlassCard { SectionHeading("02", "当前候选", "点击 Settle 记录实际结果，闭合反馈链路"); if (pending == 0) Text("还没有待配置的判断。去 New 写下第一条。", color = Eivra.Secondary); InvestmentList(bundle, true) }
    GlassCard { SectionHeading("03", "依赖风险诊断", "不把探索性指数当成已校准的尾部概率"); Text("共享同一场比赛的不同头寸需要按原子选项评估依赖；当前页面仅展示记录，完整 Monte Carlo 与原 analytics 适配通过回归后开放。", color = Eivra.Secondary) }
}

@Composable
fun DashboardScreen(tablet: Boolean, bundle: JSONObject, repository: WorkspaceRepository) {
    PageIntro("DASHBOARD · 归因", "判断，留下了什么", "资金、概率与结果并读；样本不足时，不用一个看似精确的数字掩盖不确定性。")
    var period by remember { mutableStateOf("all") }
    var snapshot by remember(bundle, period) { mutableStateOf<JSONObject?>(null) }
    var error by remember(bundle, period) { mutableStateOf("") }
    LaunchedEffect(bundle, period) {
        try { snapshot = repository.dashboard(period) } catch (e: Exception) { error = e.message ?: "无法读取分析结果" }
    }
    val current = snapshot
    if (current == null) GlassCard { Text(if (error.isEmpty()) "正在由原始分析内核计算…" else error, color = Eivra.Secondary) }
    else {
        ChoiceRow(listOf("all", "2w", "4w", "season"), period) { period = it }
        ProjectionInspector("Dashboard · 完整原投影", current)
        val settled = current.optInt("settledPeriod")
        val hitRate = current.optDouble("hitRatePeriod")
        val pnl = current.optDouble("timelineTotalProfit", current.optJSONArray("timeline")?.let { rows -> (0 until rows.length()).sumOf { rows.optJSONObject(it)?.optDouble("profit") ?: 0.0 } } ?: 0.0)
        val roi = current.optDouble("roiPeriod")
        if (tablet) Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            GlassCard(Modifier.weight(1f)) { Metric("已结算样本", "$settled", "N 还不够时，只描述，不推广") }
            GlassCard(Modifier.weight(1f)) { Metric("净结果", "${if (pnl >= 0) "+" else ""}¥ ${"%.1f".format(pnl)}", "记录值，不构成收益承诺", accent = if (pnl >= 0) Eivra.Green else Eivra.Red) }
            GlassCard(Modifier.weight(1f)) { Metric("命中率", if (settled > 0) "%.1f%%".format(hitRate) else "不可用", "来自原 analytics") }
        } else GlassCard {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Metric("已结算样本", "$settled"); Metric("命中率", if (settled > 0) "%.1f%%".format(hitRate) else "不可用") }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Metric("净结果", "${if (pnl >= 0) "+" else ""}¥ ${"%.1f".format(pnl)}"); Metric("ROI", if (settled > 0) "%.1f%%".format(roi) else "不可用") }
        }
        GlassCard { SectionHeading("01", "Performance", "由原 analytics 统一派生，不在页面另算指标"); Text("已结算 $settled 笔 · 命中率 ${"%.1f".format(hitRate)}% · ROI ${"%.1f".format(roi)}%。
校准曲线、时间数据契约和留出评估分别在 Analysis 与 Metrics 中查看。", color = Eivra.Secondary) }
        val timeline = current.optJSONArray("timeline")
        if (timeline != null && timeline.length() > 0) GlassCard { SectionHeading("02", "Balance timeline", "实际资金轨迹"); BalanceChart(timeline) }
        GlassCard { SectionHeading("03", "最近判断"); InvestmentList(bundle, false) }
    }
}

@Composable
private fun BalanceChart(rows: org.json.JSONArray) {
    val values = (0 until rows.length()).map { index ->
        val row = rows.optJSONObject(index)
        row?.optDouble("balance", row.optDouble("poolBalance", row.optDouble("value", Double.NaN))) ?: Double.NaN
    }.filter { it.isFinite() }
    if (values.isEmpty()) { Text("暂无资金轨迹", color = Eivra.Secondary); return }
    val min = values.minOrNull() ?: 0.0; val max = values.maxOrNull() ?: 1.0
    androidx.compose.foundation.Canvas(Modifier.fillMaxWidth().height(160.dp)) {
        val range = (max - min).takeIf { it > 0 } ?: 1.0
        val path = androidx.compose.ui.graphics.Path()
        values.forEachIndexed { index, value ->
            val x = index.toFloat() / (values.size - 1).coerceAtLeast(1) * size.width
            val y = size.height - ((value - min) / range).toFloat() * (size.height * .8f) - size.height * .1f
            if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        drawPath(path, Eivra.Green, style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3.dp.toPx(), cap = androidx.compose.ui.graphics.StrokeCap.Round, join = androidx.compose.ui.graphics.StrokeJoin.Round))
        drawLine(Eivra.Rule, start = androidx.compose.ui.geometry.Offset(0f, size.height), end = androidx.compose.ui.geometry.Offset(size.width, size.height))
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("¥ ${"%.0f".format(min)}", color = Eivra.Secondary, style = MaterialTheme.typography.labelMedium); Text("¥ ${"%.0f".format(max)}", color = Eivra.Secondary, style = MaterialTheme.typography.labelMedium) }
}

@Composable
fun QuantsScreen() {
    PageIntro("QUANTS · 策略研究", "一个直觉，如何成为规则", "策略版本与实验记录不可变；证据条件决定能做什么实验，而不是菜单想点什么就点什么。")
    listOf(
        "研究台" to "最近实验、待补结论与等待结果的影子计划",
        "实验工作台" to "假设、失效条件、适用范围、概率来源与评估协议",
        "策略库" to "冻结输入、版本谱系、对照结果与研究结论",
        "影子观察" to "赛前预测、报价快照、完整候选日志与阶段复盘",
        "数据中心" to "赛事身份、报价时点、赛果可知时间与覆盖缺口"
    ).forEachIndexed { index, item -> GlassCard { Eyebrow("0${index + 1}"); Text(item.first, style = MaterialTheme.typography.titleLarge); Text(item.second, color = Eivra.Secondary); Text("原生研究接口适配中 · 未开放不显示为可运行", style = MaterialTheme.typography.labelMedium, color = Eivra.Gold) } }
}

@Composable
private fun InvestmentList(bundle: JSONObject, pendingOnly: Boolean) {
    val records = bundle.getJSONArray("investments")
    var shown = 0
    for (i in records.length() - 1 downTo 0) {
        val r = records.getJSONObject(i)
        if (pendingOnly && r.optString("status") != "pending") continue
        shown++
        Column(Modifier.fillMaxWidth().background(Color.White.copy(alpha = .45f), RoundedCornerShape(14.dp)).padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(recordTitle(r), style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis); Text(if (r.optString("status") == "pending") "待结算" else if (recordIsWin(r)) "命中" else "未命中", style = MaterialTheme.typography.labelMedium, color = if (r.optString("status") == "pending") Eivra.Gold else if (r.optString("status") == "win" || r.optBoolean("result")) Eivra.Green else Eivra.Red) }
            Text(recordEntry(r), style = MaterialTheme.typography.bodyMedium)
            Text("投入 ¥${r.optDouble("inputs")} · ${r.optString("created_at", r.optString("createdAt")).take(10)}", style = MaterialTheme.typography.labelMedium, color = Eivra.Secondary)
        }
    }
    if (shown == 0) Text("暂无记录", color = Eivra.Secondary)
}

private fun firstMatch(record: JSONObject): JSONObject = record.optJSONArray("matches")?.optJSONObject(0) ?: record
private fun recordTitle(record: JSONObject): String {
    val match = firstMatch(record)
    val home = match.optString("home_team", record.optString("homeTeam", "未命名主队"))
    val away = match.optString("away_team", record.optString("awayTeam", "未命名客队"))
    return "$home  vs  $away"
}
private fun recordEntry(record: JSONObject): String {
    val match = firstMatch(record)
    return match.optString("entry_text").ifBlank { match.optJSONArray("entries")?.optJSONObject(0)?.optString("name") ?: record.optJSONArray("entries")?.optJSONObject(0)?.optString("name") ?: "" }
}
private fun recordIsWin(record: JSONObject): Boolean = record.optString("status") == "win" || record.optBoolean("result")
