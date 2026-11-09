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
fun NewInvestmentScreen(tablet: Boolean, bundle: JSONObject, onSave: (JSONObject) -> Unit) {
    var home by rememberSaveable { mutableStateOf("") }
    var away by rememberSaveable { mutableStateOf("") }
    var entryName by rememberSaveable { mutableStateOf("主胜") }
    var odds by rememberSaveable { mutableStateOf("") }
    var expected by rememberSaveable { mutableStateOf("") }
    var stake by rememberSaveable { mutableStateOf("") }
    var alpha by rememberSaveable { mutableStateOf("0.5") }
    var betaHome by rememberSaveable { mutableStateOf("M") }
    var betaAway by rememberSaveable { mutableStateOf("M") }
    var gamma by rememberSaveable { mutableStateOf("0.4") }
    var deltaHome by rememberSaveable { mutableStateOf("0.1") }
    var deltaAway by rememberSaveable { mutableStateOf("0.1") }
    var note by rememberSaveable { mutableStateOf("") }
    var validation by remember { mutableStateOf("") }
    PageIntro("NEW INVESTMENT · 投前研判", "新建投资", "登记我对这场的观点：两队 → Entries → 进球区间与浓度 → 比分云图")
    GlassCard {
        SectionHeading("1", "对阵 · 两队 PK", "先记录判断，再让证据决定下一次修正")
        if (tablet) Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            LabeledField("主队", home, { home = it }, "输入球队名或缩写", Modifier.weight(1f))
            Text("VS", Modifier.align(Alignment.CenterVertically), color = Eivra.Secondary)
            LabeledField("客队", away, { away = it }, "输入球队名或缩写", Modifier.weight(1f))
        } else {
            LabeledField("主队", home, { home = it }, "输入球队名或缩写")
            LabeledField("客队", away, { away = it }, "输入球队名或缩写")
        }
        HorizontalDivider(color = Eivra.Rule)
        Text("Entries · 结果一条 · 比分一条（odds 都可空）", style = MaterialTheme.typography.titleMedium)
        if (tablet) Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            LabeledField("判断结果", entryName, { entryName = it }, "主胜 / 平局 / 比分", Modifier.weight(1f))
            LabeledField("赔率 ODDS", odds, { odds = it }, "1.85", Modifier.weight(1f))
            LabeledField("Expected Rating", expected, { expected = it }, "0.54", Modifier.weight(1f))
            LabeledField("投入 ¥", stake, { stake = it }, "0", Modifier.weight(1f))
        } else {
            LabeledField("判断结果", entryName, { entryName = it }, "主胜 / 平局 / 比分")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                LabeledField("赔率 ODDS", odds, { odds = it }, "1.85", Modifier.weight(1f))
                LabeledField("Expected Rating", expected, { expected = it }, "0.54", Modifier.weight(1f))
            }
            LabeledField("投入 ¥", stake, { stake = it }, "0")
        }
        Text("赔率 1.85 表示押中后 100 变 185。隐含概率 ≈ 1 ÷ 赔率。Expected Rating 为各场校准命中概率的均值，非整票命中概率。", style = MaterialTheme.typography.bodyMedium, color = Eivra.Secondary)
    }
    GlassCard {
        SectionHeading("2", "Portfolio Construction", "Directional · 单场均值口径")
        Text("变量 α", style = MaterialTheme.typography.bodyMedium)
        ChoiceRow(listOf("0.2", "0.4", "0.5", "0.6", "0.8"), alpha) { alpha = it }
        if (tablet) Row(horizontalArrangement = Arrangement.spacedBy(18.dp)) {
            Column(Modifier.weight(1f)) { Text("变量 β (主)", style = MaterialTheme.typography.bodyMedium); ChoiceRow(listOf("S", "M", "L", "H"), betaHome) { betaHome = it } }
            Column(Modifier.weight(1f)) { Text("变量 β (客)", style = MaterialTheme.typography.bodyMedium); ChoiceRow(listOf("S", "M", "L", "H"), betaAway) { betaAway = it } }
        } else {
            Text("变量 β (主)", style = MaterialTheme.typography.bodyMedium); ChoiceRow(listOf("S", "M", "L", "H"), betaHome) { betaHome = it }
            Text("变量 β (客)", style = MaterialTheme.typography.bodyMedium); ChoiceRow(listOf("S", "M", "L", "H"), betaAway) { betaAway = it }
        }
        Text("变量 γ", style = MaterialTheme.typography.bodyMedium)
        ChoiceRow(listOf("0", "0.25", "0.4", "0.6", "0.75"), gamma) { gamma = it }
        Text("变量 δ (主 / 客)", style = MaterialTheme.typography.bodyMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            LabeledField("主", deltaHome, { deltaHome = it }, "0.10", Modifier.weight(1f))
            LabeledField("客", deltaAway, { deltaAway = it }, "0.10", Modifier.weight(1f))
        }
        OutlinedTextField(note, { note = it }, placeholder = { Text("赛前备注：我看见了什么，什么会推翻这个判断？") }, modifier = Modifier.fillMaxWidth().heightIn(min = 100.dp), shape = RoundedCornerShape(13.dp), textStyle = MaterialTheme.typography.bodyLarge)
    }
    GlassCard {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Metric("综合 ODDS", odds.ifBlank { "--" }); Metric("风控上限", "¥ ${"%.0f".format((bundle.optJSONObject("system_config") ?: bundle.optJSONObject("systemConfig"))?.optDouble("initialCapital", 0.0) ?: 0.0 * (bundle.optJSONObject("system_config") ?: bundle.optJSONObject("systemConfig"))?.optDouble("riskCapRatio", .12) ?: .12)}") }
        Text("蓄水池 ¥${"%.0f".format((bundle.optJSONObject("system_config") ?: bundle.optJSONObject("systemConfig"))?.optDouble("initialCapital", 0.0) ?: 0.0)} · 原模型校准结果待通过跨端 golden cases 后接入", style = MaterialTheme.typography.bodyMedium, color = Eivra.Secondary)
        if (validation.isNotEmpty()) Text(validation, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
        EivraButton("确认投资", {
            val parsedOdds = odds.toDoubleOrNull()
            val parsedExpected = expected.toDoubleOrNull()
            val parsedStake = stake.toDoubleOrNull() ?: 0.0
            when {
                home.isBlank() || away.isBlank() -> validation = "请先填写主队和客队。"
                entryName.isBlank() -> validation = "请写下一条判断结果。"
                parsedOdds != null && parsedOdds <= 1.0 -> validation = "赔率须大于 1；留空表示尚未取得报价。"
                parsedExpected != null && parsedExpected !in 0.0..1.0 -> validation = "Expected Rating 请输入 0–1 之间的概率。"
                parsedStake < 0 -> validation = "投入不能为负数。"
                else -> {
                    val entry = JSONObject().put("name", entryName.trim()).put("odds", if (parsedOdds == null) JSONObject.NULL else parsedOdds)
                    val match = JSONObject()
                        .put("id", "android-match-${System.currentTimeMillis()}")
                        .put("home_team", home.trim()).put("away_team", away.trim())
                        .put("entries", JSONArray().put(entry))
                        .put("entry_text", entryName.trim())
                        .put("conf", parsedExpected ?: 0.5)
                        .put("tys_home", betaHome).put("tys_away", betaAway)
                        .put("fid", gamma.toDoubleOrNull() ?: .4)
                        .put("fse_home", deltaHome.toDoubleOrNull() ?: .1)
                        .put("fse_away", deltaAway.toDoubleOrNull() ?: .1)
                    val record = JSONObject()
                        .put("id", "android-${System.currentTimeMillis()}")
                        .put("status", "pending").put("inputs", parsedStake)
                        .put("created_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date()))
                        .put("matches", JSONArray().put(match))
                        .put("expected_rating", if (parsedExpected == null) JSONObject.NULL else parsedExpected)
                        .put("expected_rating_semantics", "mean_leg_rating")
                        .put("forecast_source", if (parsedExpected == null) "unrated" else "user_confirmed")
                        .put("parlay_size", 1)
                        .put("parameters", JSONObject().put("alpha", alpha))
                        .put("note", note).put("source", "android-native")
                    onSave(record)
                }
            }
        }, Modifier.fillMaxWidth(), Icons.Outlined.Check)
    }
}

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
fun SettleScreen(bundle: JSONObject, onSettle: (String, Boolean) -> Unit) {
    PageIntro("SETTLE · 观察结果", "结算记录", "实际发生了什么？让每一笔判断都有结果，也让结果回到证据里。")
    val records = bundle.getJSONArray("investments")
    var any = false
    for (i in 0 until records.length()) {
        val record = records.getJSONObject(i)
        if (record.optString("status") == "pending") {
            any = true
            GlassCard {
                Text(recordTitle(record), style = MaterialTheme.typography.titleLarge)
                Text("投入 ¥${record.optDouble("inputs")} · ${recordEntry(record)}", color = Eivra.Secondary)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    EivraButton("命中", { onSettle(record.getString("id"), true) }, Modifier.weight(1f))
                    EivraButton("未命中", { onSettle(record.getString("id"), false) }, Modifier.weight(1f), subtle = true)
                }
            }
        }
    }
    if (!any) GlassCard { Text("没有待结算的判断。", style = MaterialTheme.typography.titleMedium); Text("已完成的投资保留在 History，不会被结算操作删除。", color = Eivra.Secondary) }
}

@Composable
fun DashboardScreen(tablet: Boolean, bundle: JSONObject, repository: WorkspaceRepository) {
    PageIntro("DASHBOARD · 归因", "判断，留下了什么", "资金、概率与结果并读；样本不足时，不用一个看似精确的数字掩盖不确定性。")
    var snapshot by remember(bundle) { mutableStateOf<JSONObject?>(null) }
    var error by remember(bundle) { mutableStateOf("") }
    LaunchedEffect(bundle) {
        try { snapshot = repository.dashboard() } catch (e: Exception) { error = e.message ?: "无法读取分析结果" }
    }
    val current = snapshot
    if (current == null) GlassCard { Text(if (error.isEmpty()) "正在由原始分析内核计算…" else error, color = Eivra.Secondary) }
    else {
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
fun HistoryScreen(bundle: JSONObject) {
    PageIntro("HISTORY · 可回看", "历史与球队", "不是只留成功的路径，判断、修改、结算与失效条件都要能找回。")
    InvestmentList(bundle, false)
    GlassCard { SectionHeading("TEAM", "球队画像", "事件身份与记录时间必须明确区分"); Text("球队历史、别名与样本画像将由同一份投资记录派生，避免在 Android 另造一套统计口径。", color = Eivra.Secondary) }
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
fun ConsoleScreen(bundle: JSONObject, repository: WorkspaceRepository, onChanged: (JSONObject?) -> Unit) {
    PageIntro("CONSOLE · 控制面", "参数与数据", "改参数、迁移数据与检查证据，都应有一个清晰、可恢复的入口。")
    val config = bundle.optJSONObject("system_config") ?: JSONObject()
    var poolText by remember(bundle) { mutableStateOf(config.optDouble("initialCapital", 0.0).toString()) }
    var riskText by remember(bundle) { mutableStateOf((config.optDouble("riskCapRatio", .12) * 100).toString()) }
    val scope = rememberCoroutineScope()
    GlassCard {
        SectionHeading("01", "资金与风控", "配置由原 saveSystemConfig 保存")
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            LabeledField("初始资金 ¥", poolText, { poolText = it }, "1529", Modifier.weight(1f))
            LabeledField("单笔风控上限 %", riskText, { riskText = it }, "12", Modifier.weight(1f))
        }
        EivraButton("保存资金设置", {
            val capital = poolText.toDoubleOrNull(); val risk = riskText.toDoubleOrNull()
            if (capital == null || capital < 0 || risk == null || risk !in 0.0..100.0) message = "请输入非负资金和 0–100 的风险比例"
            else scope.launch {
                val next = JSONObject(config.toString()).put("initialCapital", capital).put("riskCapRatio", risk / 100)
                onChanged(repository.saveSystemConfig(next)); message = "资金设置已保存"
            }
        })
    }
    var importText by rememberSaveable { mutableStateOf("") }
    var merge by rememberSaveable { mutableStateOf(true) }
    var message by remember { mutableStateOf("") }
    var exported by remember { mutableStateOf("") }
    GlassCard { SectionHeading("01", "原生与计算", "无 WebView 页面承载 · 本地优先"); Text("Kotlin + Jetpack Compose\nQuickJS 独立计算边界 · Android 10+\n原 analytics / Quant golden cases 为发布闸门。", color = Eivra.Secondary) }
    GlassCard {
        SectionHeading("02", "网页备份导入", "先校验，再合并；原始工作区自动备份")
        OutlinedTextField(importText, { importText = it }, placeholder = { Text("粘贴网页端导出的 JSON bundle；不会自动上传") }, modifier = Modifier.fillMaxWidth().heightIn(min = 120.dp), shape = RoundedCornerShape(13.dp))
        Text("记录数：${bundle.getJSONArray("investments").length()} · ${if (merge) "按 id 合并，远端覆盖同 id" else "替换当前工作区"}", color = Eivra.Secondary)
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            EivraButton(if (merge) "合并导入" else "替换导入", {
                val result = repository.importWebBundle(importText, merge)
                message = if (result.valid) "已导入 ${result.investmentCount} 条记录；导入前数据已备份" else result.errors.joinToString("；")
                if (result.valid) onChanged(null)
            }, Modifier.weight(1f))
            EivraButton(if (merge) "改替换" else "改合并", { merge = !merge }, Modifier.weight(1f), subtle = true)
        }
        if (message.isNotEmpty()) Text(message, color = if (message.startsWith("已")) Eivra.Green else MaterialTheme.colorScheme.error)
        EivraButton("生成当前工作区备份", { exported = repository.export() }, subtle = true)
        if (exported.isNotEmpty()) OutlinedTextField(exported, {}, readOnly = true, modifier = Modifier.fillMaxWidth().heightIn(min = 100.dp), shape = RoundedCornerShape(13.dp))
        EivraButton("撤销上次导入／重置", { if (repository.restoreBackup()) { onChanged(null); message = "已恢复变更前备份" } else message = "尚无可用备份" }, subtle = true)
    }
    GlassCard { SectionHeading("03", "恢复演示工作区", "先备份当前记录，再恢复演示"); var confirm by remember { mutableStateOf(false) }; if (!confirm) EivraButton("检查重置选项", { confirm = true }, subtle = true) else { Text("当前记录会先备份，可用上一步恢复。确定继续？"); Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { EivraButton("取消", { confirm = false }, subtle = true); EivraButton("确认恢复", { repository.resetDemo(); onChanged(null); confirm = false }) } } }
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
