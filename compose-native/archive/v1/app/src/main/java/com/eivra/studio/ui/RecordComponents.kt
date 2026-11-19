package com.eivra.studio.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.eivra.studio.ui.Eivra
import org.json.JSONObject

@Composable
fun InvestmentList(bundle: JSONObject, pendingOnly: Boolean) {
    val records = bundle.getJSONArray("investments")
    var shown = 0
    for (i in records.length() - 1 downTo 0) {
        val r = records.getJSONObject(i)
        if (pendingOnly && r.optString("status") != "pending") continue
        shown++
        Column(Modifier.fillMaxWidth().background(Color.White.copy(alpha = .45f), RoundedCornerShape(14.dp)).padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(recordTitle(r), style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(if (r.optString("status") == "pending") "待结算" else if (r.optString("status") == "win") "命中" else "未命中", style = MaterialTheme.typography.labelMedium, color = if (r.optString("status") == "pending") Eivra.Gold else if (r.optString("status") == "win") Eivra.Green else Eivra.Red)
            }
            Text(recordEntry(r), style = MaterialTheme.typography.bodyMedium)
            Text("投入 ¥${r.optDouble("inputs")} · ${r.optString("created_at").take(10)}", style = MaterialTheme.typography.labelMedium, color = LocalEivraSurface.current.muted)
        }
    }
    if (shown == 0) Text("暂无记录", color = LocalEivraSurface.current.muted)
}
fun firstMatch(record: JSONObject): JSONObject = record.optJSONArray("matches")?.optJSONObject(0) ?: record
fun recordTitle(record: JSONObject): String = "${firstMatch(record).optString("home_team", "未命名主队")} vs ${firstMatch(record).optString("away_team", "未命名客队")}"
fun recordEntry(record: JSONObject): String = firstMatch(record).optString("entry_text").ifBlank { firstMatch(record).optJSONArray("entries")?.optJSONObject(0)?.optString("name") ?: "" }
