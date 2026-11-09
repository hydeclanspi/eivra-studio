package com.eivra.studio

import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.eivra.studio.ui.*
import org.json.JSONObject

@Composable
fun AnalysisScreen(repository: WorkspaceRepository) {
    PageIntro("ANALYSIS · 表现切片", "优势，究竟来自哪里", "按策略、模式与事件切片，寻找下一轮研究线索；不把切片当成因果证明。")
    var period by remember { mutableStateOf("all") }
    var data by remember(period) { mutableStateOf<JSONObject?>(null) }
    var error by remember { mutableStateOf("") }
    LaunchedEffect(period) { try { data = repository.analysis(period) } catch (e: Exception) { error = e.message ?: "读取失败" } }
    val snapshot = data
    if (snapshot == null) { GlassCard { Text(if (error.isEmpty()) "正在分析…" else error, color = Eivra.Secondary) }; return }
    ChoiceRow(listOf("all", "2w", "4w", "season"), period, onSelect = { period = it })
    val modes = snapshot.optJSONArray("modeData")
    GlassCard { SectionHeading("01", "Mode breakdown", "每条腿按原始归因拆分"); if (modes == null || modes.length() == 0) Text("暂无可用切片", color = Eivra.Secondary) else for (i in 0 until modes.length()) { val row = modes.getJSONObject(i); Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(row.optString("mode", row.optString("label"))); Text("N ${row.optInt("samples")} · ${"%.1f".format(row.optDouble("hitRate"))}% · ROI ${"%.1f".format(row.optDouble("roi"))}%", color = Eivra.Secondary) } } }
    val strategies = snapshot.optJSONArray("strategyData")
    GlassCard { SectionHeading("02", "Position structure", "单标、双标与多标的实际记录"); if (strategies != null) for (i in 0 until strategies.length()) { val row = strategies.getJSONObject(i); Text("${row.optString("label")} · N ${row.optInt("samples")} · ${"%.1f".format(row.optDouble("hitRate"))}% · ROI ${"%.1f".format(row.optDouble("roi"))}%", color = Eivra.Secondary) } }
    ProjectionInspector("Analysis · 完整投影", snapshot)
    GlassCard { SectionHeading("03", "研究边界", "解释比数字更重要"); Text("切片由 getAnalysisSnapshot 返回。样本量、时间范围与独立事件身份必须一起阅读；关联不是因果，历史表现不是收益承诺。", color = Eivra.Secondary) }
}

@Composable
fun MetricsScreen(repository: WorkspaceRepository) {
    PageIntro("METRICS · 校准", "信心，配得上结果吗", "Brier、对数损失与风险指标必须建立在冻结预测和可用时间上。")
    var period by remember { mutableStateOf("all") }
    var data by remember(period) { mutableStateOf<JSONObject?>(null) }
    var error by remember { mutableStateOf("") }
    LaunchedEffect(period) { try { data = repository.metrics(period) } catch (e: Exception) { error = e.message ?: "读取失败" } }
    val snapshot = data
    if (snapshot == null) { GlassCard { Text(if (error.isEmpty()) "正在计算指标…" else error, color = Eivra.Secondary) }; return }
    ChoiceRow(listOf("all", "2w", "4w", "season"), period, onSelect = { period = it })
    val headline = snapshot.optJSONObject("headline") ?: snapshot
    GlassCard { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) { Metric("Brier", metricText(headline, listOf("brier", "brierScore"))); Metric("Log loss", metricText(headline, listOf("logLoss", "log_loss"))); Metric("Sharpe", metricText(headline, listOf("sharpe"))) } }
    ProjectionInspector("Metrics · 完整投影", snapshot)
    GlassCard { SectionHeading("VALIDATION", "概率更新与留出评估", "不可用比伪精确更诚实"); Text("模型校验由 getMetricsSnapshot / getModelValidationSnapshot 提供。评分仅描述记录与概率，不证明预测能力。", color = Eivra.Secondary) }
}

@Composable
fun TeamsScreen(repository: WorkspaceRepository) {
    PageIntro("TEAMS · 事件画像", "球队与历史", "按同一支球队聚合过往判断，保留时间、样本和语义边界。")
    var data by remember { mutableStateOf<org.json.JSONArray?>(null) }
    LaunchedEffect(Unit) { data = repository.teams() }
    val teams = data
    if (teams != null) ProjectionInspector("Teams · 完整球队画像", teams)
    GlassCard { SectionHeading("01", "Team profiles", "由原始记录与别名库派生"); if (teams == null) Text("正在汇总球队画像…", color = Eivra.Secondary) else if (teams.length() == 0) Text("还没有球队样本", color = Eivra.Secondary) else for (i in 0 until minOf(teams.length(), 40)) { val row = teams.getJSONObject(i); Text("${row.optString("name", row.optString("teamName"))} · N ${row.optInt("samples", row.optInt("count", 0))} · ROI ${"%.1f".format(row.optDouble("roi"))}%", color = Eivra.Secondary) } }
}

@Composable
fun QuantsScreen(repository: WorkspaceRepository) {
    PageIntro("QUANTS · 策略研究", "一个直觉，如何成为规则", "策略版本与实验记录不可变；证据条件决定能做什么实验，而不是菜单想点什么就点什么。")
    var data by remember { mutableStateOf<JSONObject?>(null) }
    var error by remember { mutableStateOf("") }
    LaunchedEffect(Unit) { try { data = repository.research() } catch (e: Exception) { error = e.message ?: "读取失败" } }
    val current = data
    if (current == null) { GlassCard { Text(if (error.isEmpty()) "正在读取研究记录…" else error, color = Eivra.Secondary) }; return }
    val research = current.optJSONObject("research") ?: JSONObject()
    val runs = research.optJSONArray("runs")
    val projects = research.optJSONArray("projects")
    val plans = current.optJSONObject("forward")?.optJSONArray("plans")
    GlassCard { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) { Metric("研究项目", "${projects?.length() ?: 0}"); Metric("实验记录", "${runs?.length() ?: 0}"); Metric("影子计划", "${plans?.length() ?: 0}") } }
    ProjectionInspector("Research / Forward · 原始研究投影", current)
    listOf(
        "研究台" to "最近实验、待补结论与等待结果的影子计划",
        "实验工作台" to "假设、失效条件、适用范围、概率来源与评估协议",
        "策略库" to "冻结输入、版本谱系、对照结果与研究结论",
        "影子观察" to "赛前预测、报价快照、完整候选日志与阶段复盘",
        "数据中心" to "赛事身份、报价时点、赛果可知时间与覆盖缺口"
    ).forEachIndexed { index, item -> GlassCard { Eyebrow("0${index + 1}"); Text(item.first, style = MaterialTheme.typography.titleLarge); Text(item.second, color = Eivra.Secondary) } }
}

private fun metricText(objects: JSONObject, keys: List<String>): String {
    for (key in keys) if (objects.has(key) && !objects.isNull(key)) { val value = objects.optDouble(key, Double.NaN); if (value.isFinite()) return "%.3f".format(value) }
    return "不可用"
}
