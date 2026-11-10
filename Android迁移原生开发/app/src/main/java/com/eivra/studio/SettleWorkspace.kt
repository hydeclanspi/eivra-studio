package com.eivra.studio

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.testTag
import com.eivra.studio.ui.*
import org.json.JSONArray
import org.json.JSONObject

private data class SettlementLeg(
    val result: String = "", val correct: Boolean? = null,
    val rating: String = "", val rep: String = "", val note: String = "",
)

@Composable
fun SettleScreen(bundle: JSONObject, onSettle: (String, JSONObject) -> Unit) {
    PageIntro("SETTLE · 观察结果", "结算记录", "逐场记录真实结果；原引擎据此生成整票状态、净结果与可用时间戳。")
    val records = bundle.optJSONArray("investments") ?: JSONArray()
    var pendingCount = 0
    for (i in 0 until records.length()) {
        val record = records.getJSONObject(i)
        if (record.optString("status") != "pending") continue
        pendingCount++
        val matches = record.optJSONArray("matches") ?: JSONArray()
        var legs by remember(record.getString("id")) { mutableStateOf(List(matches.length()) { SettlementLeg() }) }
        var revenue by remember(record.getString("id")) { mutableStateOf("") }
        var error by remember(record.getString("id")) { mutableStateOf("") }
        GlassCard(modifier = Modifier.testTag("settle-card-${record.getString("id")}")) {
            SectionHeading("01", recordTitle(record), "${record.optString("combo_name", "未命名组合")} · 投入 ¥ ${record.optDouble("inputs")}")
            for (index in 0 until matches.length()) {
                val match = matches.getJSONObject(index)
                val leg = legs[index]
                Text("${match.optString("home_team")} vs ${match.optString("away_team")}", style = MaterialTheme.typography.titleMedium)
                Text("原判断：${match.optString("entry_text")} · ${recordEntry(record)}", color = Eivra.Secondary)
                LabeledField("实际比分 / 结果", leg.result, { legs = legs.editSettlement(index) { copy(result = it) } }, "例如 2–1；没有比分时留空")
                Text("该腿判断是否正确？", style = MaterialTheme.typography.bodyMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    EivraButton("命中", { legs = legs.editSettlement(index) { copy(correct = true) } }, Modifier.weight(1f).testTag("settle-hit-${record.getString("id")}-$index"), subtle = leg.correct != true)
                    EivraButton("未命中", { legs = legs.editSettlement(index) { copy(correct = false) } }, Modifier.weight(1f), subtle = leg.correct != false)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    LabeledField("AJR · 可选", leg.rating, { legs = legs.editSettlement(index) { copy(rating = it) } }, "0–0.8", Modifier.weight(1f))
                    LabeledField("REP · 可选", leg.rep, { legs = legs.editSettlement(index) { copy(rep = it) } }, "数字", Modifier.weight(1f))
                }
                LabeledField("赛后备注 · 可选", leg.note, { legs = legs.editSettlement(index) { copy(note = it) } }, "实际结果与当时判断差在哪里？")
                if (index < matches.length() - 1) HorizontalDivider(color = Eivra.Rule)
            }
            LabeledField("Revenue · 实际回款 ¥", revenue, { revenue = it }, "包含本金；未回款填 0")
            Text("原引擎会把每腿 is_correct、results、AJR、REP、备注写回记录；全部命中才是 win，profit = 回款 − 投入。", color = Eivra.Secondary)
            if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error)
            EivraButton("确认结算", {
                val amount = revenue.toDoubleOrNull()
                when {
                    legs.any { it.correct == null } -> error = "请为每场选择命中或未命中；不要用整票结果替代逐腿结果。"
                    amount == null || amount < 0 -> error = "实际回款须是非负数字。"
                    legs.any { it.rating.toDoubleOrNull()?.let { value -> value !in 0.0..0.8 } == true } -> error = "AJR 必须在 0–0.8 之间。"
                    else -> {
                        val form = JSONObject().put("revenues", amount).put("matches", JSONArray().apply {
                            legs.forEach { leg -> put(JSONObject().put("results", leg.result).put("isCorrect", leg.correct)
                                .put("matchRating", if (leg.rating.isBlank()) JSONObject.NULL else leg.rating.toDouble())
                                .put("matchRep", if (leg.rep.isBlank()) JSONObject.NULL else leg.rep.toDoubleOrNull())
                                .put("postNote", leg.note)) }
                        })
                        onSettle(record.getString("id"), form)
                    }
                }
            }, Modifier.fillMaxWidth(), Icons.Outlined.Check)
        }
    }
    if (pendingCount == 0) GlassCard {
        Text("没有待结算的判断。", style = MaterialTheme.typography.titleMedium)
        Text("已完成的投资保留在 History，不会被结算操作删除。", color = Eivra.Secondary)
    }
}

private fun List<SettlementLeg>.editSettlement(index: Int, transform: SettlementLeg.() -> SettlementLeg) = mapIndexed { i, leg -> if (i == index) leg.transform() else leg }
