package com.eivra.studio

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import com.eivra.studio.ui.*
import org.json.JSONArray
import org.json.JSONObject

@Composable
fun HistoryScreen(bundle: JSONObject) {
    PageIntro("HISTORY · 可回看", "历史与证据", "按球队、组合或状态找回判断；原始 forecast 与逐腿结果不被折叠掉。")
    var query by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("all") }
    val records = bundle.optJSONArray("investments") ?: JSONArray()
    LabeledField("搜索球队、盘口、组合或备注", query, { query = it }, "例如 Arsenal / 主胜 / demo")
    ChoiceRow(listOf("all", "pending", "win", "lose"), status, onSelect = { status = it }
    val rows = (0 until records.length()).map { records.getJSONObject(it) }.filter { record ->
        (status == "all" || record.optString("status") == status) &&
            (query.isBlank() || record.toString().contains(query, ignoreCase = true))
    }.sortedByDescending { it.optString("created_at") }
    Text("${rows.size} / ${records.length()} 笔记录", color = Eivra.Secondary)
    rows.forEach { record -> HistoryRecord(record) }
    if (rows.isEmpty()) GlassCard { Text("没有匹配的记录。换一个关键词或状态。", color = Eivra.Secondary) }
}

@Composable
private fun HistoryRecord(record: JSONObject) {
    var expanded by remember(record.optString("id")) { mutableStateOf(false) }
    GlassCard {
        SectionHeading(record.optString("status", "—").uppercase(), recordTitle(record), "${record.optString("created_at")} · ${record.optString("combo_name", "未命名组合")}")
        Text("投入 ¥ ${record.optDouble("inputs")} · 建议 ¥ ${record.optDouble("suggested_amount")} · 回款 ¥ ${record.optDouble("revenues")} · 净结果 ¥ ${record.optDouble("profit")}")
        val matches = record.optJSONArray("matches") ?: JSONArray()
        for (i in 0 until matches.length()) {
            val match = matches.getJSONObject(i)
            Text("${match.optString("home_team")} vs ${match.optString("away_team")}", style = MaterialTheme.typography.titleMedium)
            Text("判断 ${match.optString("entry_text")} · 实际 ${match.optString("results", "未结算")} · ${when (match.opt("is_correct")) { true -> "命中"; false -> "未命中"; else -> "待结算" }}", color = Eivra.Secondary)
            if (expanded) {
                val entries = match.optJSONArray("entries") ?: JSONArray()
                for (j in 0 until entries.length()) {
                    val entry = entries.getJSONObject(j)
                    Text("Entry ${j + 1} · ${entry.optString("name")} · odds ${entry.optDouble("odds")} · ${entry.optString("market_label")}", color = Eivra.Secondary)
                }
                Text("Conf ${match.opt("conf")} · TYS ${match.optString("tys_home")}/${match.optString("tys_away")} · FID ${match.opt("fid")} · FSE ${match.opt("fse_home")}/${match.opt("fse_away")}", color = Eivra.Secondary)
                if (match.optString("note").isNotBlank()) Text("投前：${match.optString("note")}")
                if (match.optString("post_note").isNotBlank()) Text("赛后：${match.optString("post_note")}")
            }
        }
        if (expanded) {
            record.optJSONObject("forecast_snapshot")?.let { forecast ->
                Text("冻结预测 · ${forecast.optString("generated_at")}", style = MaterialTheme.typography.titleMedium)
                Text("模型 ${forecast.optString("model_version")} · ${forecast.optString("expected_rating_semantics")}", color = Eivra.Secondary)
                Text(forecast.toString(2), fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.bodySmall)
            } ?: Text("旧记录未包含 forecast snapshot；不以当前模型反填历史。", color = Eivra.Secondary)
            Text("结算时间 ${record.optString("settled_at", "未结算")} · 结果可用 ${record.optString("outcome_available_at", "未记录")}", color = Eivra.Secondary)
        }
        EivraButton(if (expanded) "收起证据" else "展开 Entries、预测与时间戳", { expanded = !expanded }, Modifier.fillMaxWidth(), subtle = true)
    }
}
