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
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Metric("综合 ODDS", odds.ifBlank { "--" }); Metric("风控上限", "¥ ${"%.0f".format(bundle.getJSONObject("systemConfig").optDouble("pool", 0.0) * bundle.getJSONObject("systemConfig").optDouble("riskCapRatio", .12))}") }
        Text("蓄水池 ¥${"%.0f".format(bundle.getJSONObject("systemConfig").optDouble("pool", 0.0))} · 原模型校准结果待通过跨端 golden cases 后接入", style = MaterialTheme.typography.bodyMedium, color = Eivra.Secondary)
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
                    val record = JSONObject()
                        .put("id", "android-${System.currentTimeMillis()}")
                        .put("homeTeam", home.trim()).put("awayTeam", away.trim())
                        .put("entries", JSONArray().put(entry)).put("status", "pending")
                        .put("inputs", parsedStake).put("createdAt", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date()))
                        .put("expected", if (parsedExpected == null) JSONObject.NULL else parsedExpected)
                        .put("parameters", JSONObject().put("alpha", alpha).put("betaHome", betaHome).put("betaAway", betaAway).put("gamma", gamma).put("deltaHome", deltaHome).put("deltaAway", deltaAway))
                        .put("note", note).put("source", "android-native")
                    val next = JSONObject(bundle.toString())
                    next.getJSONArray("investments").put(record)
                    onSave(next)
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
    GlassCard { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) { Metric("待结算", "$pending 笔"); Metric("在途冻结", "¥ ${"%.0f".format(exposure)}"); Metric("蓄水池", "¥ ${"%.0f".format(bundle.getJSONObject("systemConfig").optDouble("pool"))}") } }
    GlassCard { SectionHeading("02", "当前候选", "点击 Settle 记录实际结果，闭合反馈链路"); if (pending == 0) Text("还没有待配置的判断。去 New 写下第一条。", color = Eivra.Secondary); InvestmentList(bundle, true) }
    GlassCard { SectionHeading("03", "依赖风险诊断", "不把探索性指数当成已校准的尾部概率"); Text("共享同一场比赛的不同头寸需要按原子选项评估依赖；当前页面仅展示记录，完整 Monte Carlo 与原 analytics 适配通过回归后开放。", color = Eivra.Secondary) }
}

@Composable
fun SettleScreen(bundle: JSONObject, onSave: (JSONObject) -> Unit) {
    PageIntro("SETTLE · 观察结果", "结算记录", "实际发生了什么？让每一笔判断都有结果，也让结果回到证据里。")
    val records = bundle.getJSONArray("investments")
    var any = false
    for (i in 0 until records.length()) {
        val record = records.getJSONObject(i)
        if (record.optString("status") == "pending") {
            any = true
            GlassCard {
                Text("${record.getString("homeTeam")}  vs  ${record.getString("awayTeam")}", style = MaterialTheme.typography.titleLarge)
                Text("投入 ¥${record.optDouble("inputs")} · ${record.optJSONArray("entries")?.optJSONObject(0)?.optString("name")}", color = Eivra.Secondary)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    EivraButton("命中", {
                        val next = JSONObject(bundle.toString()); val r = next.getJSONArray("investments").getJSONObject(i)
                        val odds = r.getJSONArray("entries").getJSONObject(0).optDouble("odds", 0.0)
                        val input = r.optDouble("inputs")
                        r.put("status", "settled").put("result", true).put("profit", if (odds > 0) input * (odds - 1) else 0.0).put("settledAt", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date()))
                        onSave(next)
                    }, Modifier.weight(1f))
                    EivraButton("未命中", {
                        val next = JSONObject(bundle.toString()); val r = next.getJSONArray("investments").getJSONObject(i)
                        r.put("status", "settled").put("result", false).put("profit", -r.optDouble("inputs")).put("settledAt", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date()))
                        onSave(next)
                    }, Modifier.weight(1f), subtle = true)
                }
            }
        }
    }
    if (!any) GlassCard { Text("没有待结算的判断。", style = MaterialTheme.typography.titleMedium); Text("已完成的投资保留在 History，不会被结算操作删除。", color = Eivra.Secondary) }
}

@Composable
fun DashboardScreen(tablet: Boolean, bundle: JSONObject) {
    PageIntro("DASHBOARD · 归因", "判断，留下了什么", "资金、概率与结果并读；样本不足时，不用一个看似精确的数字掩盖不确定性。")
    val records = bundle.getJSONArray("investments")
    var settled = 0; var wins = 0; var pnl = 0.0; var brier = 0.0; var scored = 0
    for (i in 0 until records.length()) { val r = records.getJSONObject(i); if (r.optString("status") == "settled") { settled++; val won = r.optBoolean("result"); if (won) wins++; pnl += r.optDouble("profit"); if (r.has("expected") && !r.isNull("expected")) { val error = r.getDouble("expected") - if (won) 1.0 else 0.0; brier += error * error; scored++ } } }
    if (tablet) Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        GlassCard(Modifier.weight(1f)) { Metric("已结算样本", "$settled", "N 还不够时，只描述，不推广") }
        GlassCard(Modifier.weight(1f)) { Metric("净结果", "${if (pnl >= 0) "+" else ""}¥ ${"%.1f".format(pnl)}", "记录值，不构成收益承诺", accent = if (pnl >= 0) Eivra.Green else Eivra.Red) }
        GlassCard(Modifier.weight(1f)) { Metric("Brier", if (scored > 0) "%.3f".format(brier / scored) else "不可用", if (scored > 0) "越小越好 · 基于冻结概率" else "缺少可评估概率") }
    } else GlassCard {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Metric("已结算样本", "$settled"); Metric("命中率", if (settled > 0) "%.0f%%".format(100.0 * wins / settled) else "不可用") }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Metric("净结果", "${if (pnl >= 0) "+" else ""}¥ ${"%.1f".format(pnl)}"); Metric("Brier", if (scored > 0) "%.3f".format(brier / scored) else "不可用") }
    }
    GlassCard { SectionHeading("01", "Performance", "实际观测，不代替 walk-forward 验证"); Text("已结算 $settled 笔 · 命中 $wins 笔 · 有概率评分 $scored 笔。
校准曲线、时间数据契约和留出评估由原 analytics 统一提供。", color = Eivra.Secondary) }
    GlassCard { SectionHeading("02", "最近判断"); InvestmentList(bundle, false) }
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
fun ConsoleScreen(bundle: JSONObject, repository: WorkspaceRepository, onReset: () -> Unit) {
    PageIntro("CONSOLE · 控制面", "参数与数据", "改参数、迁移数据与检查证据，都应有一个清晰、可恢复的入口。")
    GlassCard { SectionHeading("01", "原生与计算", "无 WebView 页面承载 · 本地优先"); Text("Kotlin + Jetpack Compose
QuickJS 独立计算边界 · Android 10+
原 analytics / Quant golden cases 为发布闸门。", color = Eivra.Secondary) }
    GlassCard { SectionHeading("02", "本地数据", "当前记录不会被预览模式隐式清空"); Text("记录数：${bundle.getJSONArray("investments").length()}
数据保存在 App 私有存储；导出、校验与网页 bundle 合并是下一阶段验收项。", color = Eivra.Secondary) }
    GlassCard { SectionHeading("03", "恢复演示工作区", "将清除当前 App 内的本地修改"); var confirm by remember { mutableStateOf(false) }; if (!confirm) EivraButton("检查重置选项", { confirm = true }, subtle = true) else { Text("确定清除本地工作区并恢复演示数据？此操作不可撤销。"); Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { EivraButton("取消", { confirm = false }, subtle = true); EivraButton("确认恢复", { repository.resetDemo(); onReset(); confirm = false }) } } }
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
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("${r.optString("homeTeam")} vs ${r.optString("awayTeam")}", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis); Text(if (r.optString("status") == "pending") "待结算" else if (r.optBoolean("result")) "命中" else "未命中", style = MaterialTheme.typography.labelMedium, color = if (r.optString("status") == "pending") Eivra.Gold else if (r.optBoolean("result")) Eivra.Green else Eivra.Red) }
            Text(r.optJSONArray("entries")?.optJSONObject(0)?.optString("name") ?: "", style = MaterialTheme.typography.bodyMedium)
            Text("投入 ¥${r.optDouble("inputs")} · ${r.optString("createdAt").take(10)}", style = MaterialTheme.typography.labelMedium, color = Eivra.Secondary)
        }
    }
    if (shown == 0) Text("暂无记录", color = Eivra.Secondary)
}
