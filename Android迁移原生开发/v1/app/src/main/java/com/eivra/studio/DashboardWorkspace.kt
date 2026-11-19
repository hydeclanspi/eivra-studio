package com.eivra.studio

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.testTag
import com.eivra.studio.ui.*
import org.json.JSONArray
import org.json.JSONObject

@Composable
fun DashboardScreen(tablet: Boolean, bundle: JSONObject, repository: WorkspaceRepository) {
    PageIntro("DASHBOARD · 归因", "判断，留下了什么", "资金、概率与结果并读；样本不足时，不用一个看似精确的数字掩盖不确定性。")
    var period by remember { mutableStateOf("all") }
    var snapshot by remember(bundle, period) { mutableStateOf<JSONObject?>(null) }
    var error by remember(bundle, period) { mutableStateOf("") }
    LaunchedEffect(bundle, period) { try { snapshot = repository.dashboard(period) } catch (e: Exception) { error = e.message ?: "无法读取分析结果" } }
    val current = snapshot
    if (current == null) GlassCard(Modifier.testTag("dashboard-loading")) { Text(if (error.isEmpty()) "正在由原始分析内核计算…" else error, color = LocalEivraSurface.current.muted) }
    else {
        ChoiceRow(listOf("all", "2w", "4w", "season"), period, onSelect = { period = it })
        Text("", modifier = Modifier.testTag("dashboard-loaded"))
        val settled = current.optInt("settledPeriod")
        val hitRate = current.optDouble("hitRatePeriod")
        val pnl = current.optDouble("cycleProfit")
        val roi = current.optDouble("roiPeriod")
        if (tablet) Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            GlassCard(Modifier.weight(1f)) { Metric("已结算样本", "$settled", "N 还不够时，只描述，不推广") }
            GlassCard(Modifier.weight(1f)) { Metric("周期净结果", "${if (pnl >= 0) "+" else ""}¥ ${"%.1f".format(pnl)}", "记录值，不构成收益承诺", accent = if (pnl >= 0) Eivra.Green else Eivra.Red) }
            GlassCard(Modifier.weight(1f)) { Metric("命中率", if (settled > 0) "%.1f%%".format(hitRate) else "不可用", "来自原 analytics") }
        } else GlassCard {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Metric("已结算样本", "$settled"); Metric("命中率", if (settled > 0) "%.1f%%".format(hitRate) else "不可用") }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Metric("周期净结果", "${if (pnl >= 0) "+" else ""}¥ ${"%.1f".format(pnl)}"); Metric("ROI", if (settled > 0) "%.1f%%".format(roi) else "不可用") }
        }
        val timeline = current.optJSONArray("balanceLedger")
        if (timeline != null && timeline.length() > 0) GlassCard { SectionHeading("02", "Balance ledger", "实际资金轨迹"); BalanceChart(timeline) }
        ProjectionInspector("Dashboard · 完整原投影", current)
        GlassCard { SectionHeading("03", "最近判断"); InvestmentList(bundle, false) }
    }
}

@Composable
private fun BalanceChart(rows: JSONArray) {
    val values = (0 until rows.length()).map { index -> rows.optJSONObject(index)?.let { it.optDouble("balance", it.optDouble("poolBalance", it.optDouble("value", Double.NaN))) } ?: Double.NaN }.filter { it.isFinite() }
    if (values.isEmpty()) { Text("暂无资金轨迹", color = LocalEivraSurface.current.muted); return }
    val min = values.minOrNull() ?: 0.0
    val max = values.maxOrNull() ?: 1.0
    val accent = LocalEivraSurface.current.accent
    val gridColor = LocalEivraSurface.current.muted.copy(alpha = .25f)
    Canvas(Modifier.fillMaxWidth().height(160.dp)) {
        val range = (max - min).takeIf { it > 0 } ?: 1.0
        val path = Path()
        values.forEachIndexed { index, value ->
            val x = index.toFloat() / (values.size - 1).coerceAtLeast(1) * size.width
            val y = size.height - ((value - min) / range).toFloat() * (size.height * .8f) - size.height * .1f
            if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        drawPath(path, accent, style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
        drawLine(gridColor, start = Offset(0f, size.height), end = Offset(size.width, size.height))
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("¥ ${"%.0f".format(min)}", color = LocalEivraSurface.current.muted); Text("¥ ${"%.0f".format(max)}", color = LocalEivraSurface.current.muted) }
}
