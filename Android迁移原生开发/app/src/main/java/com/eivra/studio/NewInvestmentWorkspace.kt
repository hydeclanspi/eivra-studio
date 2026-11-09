package com.eivra.studio

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eivra.studio.ui.*
import kotlinx.coroutines.delay
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant

@kotlinx.parcelize.Parcelize
private data class EntryDraft(val name: String = "主胜", val odds: String = "2.00") : android.os.Parcelable
@kotlinx.parcelize.Parcelize
private data class MatchDraft(
    val home: String = "", val away: String = "", val entries: List<EntryDraft> = listOf(EntryDraft()),
    val conf: String = "", val mode: String = "常规-杠杆", val tysHome: String = "M", val tysAway: String = "M",
    val fid: String = "0.40", val fseHome: String = "0.50", val fseAway: String = "0.50", val note: String = "",
) : android.os.Parcelable

@Composable
fun NewInvestmentScreen(tablet: Boolean, bundle: JSONObject, repository: WorkspaceRepository, onSave: (JSONObject) -> Unit) {
    var matches by rememberSaveable { mutableStateOf(listOf(MatchDraft())) }
    var stake by rememberSaveable { mutableStateOf("") }
    var comboName by rememberSaveable { mutableStateOf("") }
    var prediction by remember { mutableStateOf<JSONObject?>(null) }
    var computing by remember { mutableStateOf(false) }
    var validation by remember { mutableStateOf("") }
    var computingKey by remember { mutableStateOf(0) }
    val previewTime = remember(matches) { Instant.now().toString() }
    val payload = remember(matches, previewTime) {
        JSONArray().apply { matches.forEachIndexed { index, match -> put(match.toJSON(index)) } }
    }
    LaunchedEffect(payload.toString()) {
        val key = ++computingKey
        if (!matches.any { it.home.isNotBlank() && it.away.isNotBlank() }) { prediction = null; return@LaunchedEffect }
        delay(220)
        computing = true
        try { prediction = repository.forecast(payload, previewTime); validation = "" }
        catch (e: Exception) { prediction = null; validation = "投前模型暂不可用：${e.message ?: "请检查输入"}" }
        if (key == computingKey) computing = false
    }
    PageIntro("NEW INVESTMENT · 投前研判", "新建投资", "把每场的判断拆成可复核的 Entries，再用同一套原始模型冻结预测。")
    matches.forEachIndexed { index, match ->
        GlassCard {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                SectionHeading("${index + 1}", if (match.home.isBlank() && match.away.isBlank()) "对阵 · 等待输入" else "${match.home} vs ${match.away}", "原始概率、Entries 与判断参数")
                if (matches.size > 1) IconButton(onClick = { matches = matches.filterIndexed { i, _ -> i != index } }) { Icon(Icons.Outlined.Delete, "移除本场", tint = Eivra.Secondary) }
            }
            if (tablet) Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                LabeledField("主队", match.home, { matches = matches.edit(index) { copy(home = it) } }, "球队名 / 缩写", Modifier.weight(1f))
                LabeledField("客队", match.away, { matches = matches.edit(index) { copy(away = it) } }, "球队名 / 缩写", Modifier.weight(1f))
            } else {
                LabeledField("主队", match.home, { matches = matches.edit(index) { copy(home = it) } }, "球队名 / 缩写")
                LabeledField("客队", match.away, { matches = matches.edit(index) { copy(away = it) } }, "球队名 / 缩写")
            }
            Text("Entries · 同场可并列多个盘口，每条有自己的赔率", style = MaterialTheme.typography.titleMedium)
            match.entries.forEachIndexed { entryIndex, entry ->
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    LabeledField("盘口 ${entryIndex + 1}", entry.name, { value -> matches = matches.edit(index) { copy(entries = entries.edit(entryIndex) { copy(name = value) }) } }, "主胜 / 平局 / 比分 / 大小球", Modifier.weight(1.5f))
                    LabeledField("Odds", entry.odds, { value -> matches = matches.edit(index) { copy(entries = entries.edit(entryIndex) { copy(odds = value) }) } }, "> 1.00", Modifier.weight(.75f))
                    if (match.entries.size > 1) IconButton(onClick = { matches = matches.edit(index) { copy(entries = entries.filterIndexed { i, _ -> i != entryIndex }) } }) { Icon(Icons.Outlined.RemoveCircleOutline, "删除 Entry", tint = Eivra.Secondary) }
                }
            }
            EivraButton("添加 Entry", { matches = matches.edit(index) { copy(entries = entries + EntryDraft(name = "", odds = "")) } }, subtle = true, icon = Icons.Outlined.Add)
            if (tablet) Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                LabeledField("我的原始 Conf", match.conf, { matches = matches.edit(index) { copy(conf = it) } }, "0–1", Modifier.weight(1f))
                LabeledField("FID", match.fid, { matches = matches.edit(index) { copy(fid = it) } }, "0–1", Modifier.weight(1f))
                LabeledField("FSE 主", match.fseHome, { matches = matches.edit(index) { copy(fseHome = it) } }, "0–1", Modifier.weight(1f))
                LabeledField("FSE 客", match.fseAway, { matches = matches.edit(index) { copy(fseAway = it) } }, "0–1", Modifier.weight(1f))
            } else {
                LabeledField("我的原始 Conf", match.conf, { matches = matches.edit(index) { copy(conf = it) } }, "0–1；不是整票命中率")
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    LabeledField("FID", match.fid, { matches = matches.edit(index) { copy(fid = it) } }, "0–1", Modifier.weight(1f))
                    LabeledField("FSE 主", match.fseHome, { matches = matches.edit(index) { copy(fseHome = it) } }, "0–1", Modifier.weight(1f))
                    LabeledField("FSE 客", match.fseAway, { matches = matches.edit(index) { copy(fseAway = it) } }, "0–1", Modifier.weight(1f))
                }
            }
            Text("模式", style = MaterialTheme.typography.bodyMedium)
            ChoiceRow(listOf("常规-杠杆", "保守", "半彩票半保险"), match.mode, onSelect = { matches = matches.edit(index) { copy(mode = it) } })
            Text("TYS · 主 / 客", style = MaterialTheme.typography.bodyMedium)
            ChoiceRow(listOf("S", "M", "L", "H"), match.tysHome, onSelect = { matches = matches.edit(index) { copy(tysHome = it) } })
            ChoiceRow(listOf("S", "M", "L", "H"), match.tysAway, onSelect = { matches = matches.edit(index) { copy(tysAway = it) } })
            LabeledField("投前备注", match.note, { matches = matches.edit(index) { copy(note = it) } }, "为什么这样判断？")
            prediction?.optJSONArray("profiles")?.optJSONObject(index)?.let { profile ->
                Text("校准概率 ${formatProbability(profile.optDouble("hitProbability"))} · 模型状态 ${profile.optString("modelStatus", "待确认")}", color = Eivra.Secondary, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
    EivraButton("添加一场比赛", { matches = matches + MatchDraft() }, Modifier.fillMaxWidth(), Icons.Outlined.Add, subtle = true)
    GlassCard {
        SectionHeading("${matches.size + 1}", "Portfolio Construction", "原模型分布，不是手写期望概率")
        LabeledField("组合名称（可选）", comboName, { comboName = it }, "例如：周末研究组合")
        LabeledField("实际投入 ¥", stake, { stake = it }, "0")
        val current = prediction
        if (computing) Text("原始模型正在计算概率分布…", color = Eivra.Secondary)
        if (current != null) {
            val combined = current.optJSONObject("combinedProfile")
            Text("Expected Rating ${formatProbability(current.optDouble("expectedRating"))}", style = MaterialTheme.typography.titleLarge)
            Text("各腿校准概率均值 · 非整票命中概率", color = Eivra.Secondary)
            Text("组合等效赔率 ${formatOdds(current.optDouble("combinedOdds"))}", style = MaterialTheme.typography.titleMedium)
            Text("建议仓位 ¥ ${"%.0f".format(current.optDouble("recommendedInvest"))} · 蓄水池 ¥ ${"%.0f".format(current.optDouble("poolBalance"))}", color = Eivra.Secondary)
            if (combined != null) {
                Text("整票命中 ${formatProbability(combined.optDouble("hitProbability"))} · 盈利概率 ${formatProbability(combined.optDouble("profitProbability"))}", color = Eivra.Secondary)
                val states = combined.optJSONArray("states") ?: JSONArray()
                Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
                    for (i in 0 until states.length()) {
                        val state = states.getJSONObject(i)
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("毛回报 × ${formatOdds(state.optDouble("gross"))}", color = Eivra.Secondary)
                            Text(formatProbability(state.optDouble("probability")), fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
            current.optJSONObject("forecastSnapshot")?.let { Text("预测将在保存时冻结：${it.optString("generated_at")}", color = Eivra.Secondary, style = MaterialTheme.typography.bodySmall) }
        }
        if (validation.isNotBlank()) Text(validation, color = MaterialTheme.colorScheme.error)
        EivraButton("确认投资 · 冻结预测", {
            val amount = stake.toDoubleOrNull()
            when {
                amount == null || amount < 0 -> validation = "实际投入须是非负数字。"
                matches.any { it.home.isBlank() || it.away.isBlank() } -> validation = "请填写每场的主队与客队。"
                matches.any { draft -> draft.entries.any { it.name.isBlank() || (it.odds.toDoubleOrNull()?.let { o -> o <= 1 } != false) } } -> validation = "每条 Entry 都须有盘口名称和大于 1 的赔率。"
                matches.any { it.conf.toDoubleOrNull()?.let { c -> c in 0.0..1.0 } != true } -> validation = "请确认每场的原始 Conf（0–1）；未确认时不会替你填 0.5。"
                prediction == null -> validation = "原模型尚未给出有效预测分布；不会用默认概率替代。"
                else -> {
                    val createdAt = Instant.now().toString()
                    val record = JSONObject().put("id", "android-${System.currentTimeMillis()}")
                        .put("created_at", createdAt).put("combo_name", comboName.trim())
                        .put("status", "pending").put("inputs", amount).put("parlay_size", matches.size)
                        .put("matches", payload)
                        .put("expected_rating", prediction?.opt("expectedRating") ?: JSONObject.NULL)
                        .put("expected_rating_semantics", "mean_calibrated_leg_probability")
                        .put("combined_odds", prediction?.opt("combinedOdds") ?: JSONObject.NULL)
                        .put("suggested_amount", prediction?.opt("recommendedInvest") ?: JSONObject.NULL).put("revenues", JSONObject.NULL).put("profit", JSONObject.NULL)
                    onSave(record)
                }
            }
        }, Modifier.fillMaxWidth(), Icons.Outlined.Check)
    }
}

private fun MatchDraft.toJSON(index: Int) = JSONObject()
    .put("id", "android-match-${System.currentTimeMillis()}-$index")
    .put("home_team", home.trim()).put("away_team", away.trim())
    .put("entries", JSONArray().apply { entries.forEach { put(JSONObject().put("name", it.name.trim()).put("odds", it.odds.toDouble())) } })
    .put("entry_text", entries.joinToString(" / ") { it.name.trim() })
    .put("conf", conf.toDoubleOrNull() ?: JSONObject.NULL).put("mode", mode)
    .put("tys_home", tysHome).put("tys_away", tysAway).put("fid", fid.toDoubleOrNull() ?: .4)
    .put("fse_home", fseHome.toDoubleOrNull() ?: .5).put("fse_away", fseAway.toDoubleOrNull() ?: .5).put("note", note)
private fun <T> List<T>.edit(index: Int, transform: T.() -> T) = mapIndexed { i, value -> if (i == index) value.transform() else value }
private fun formatProbability(value: Double) = if (value.isFinite()) "%.1f%%".format(value * 100) else "未评级"
private fun formatOdds(value: Double) = if (value.isFinite()) "%.2f".format(value) else "—"

