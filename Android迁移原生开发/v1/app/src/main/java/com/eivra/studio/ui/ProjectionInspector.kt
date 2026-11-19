package com.eivra.studio.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

import org.json.JSONArray
import org.json.JSONObject

/** A navigable view of the original analytics projection, not a substitute chart. */
@Composable
fun ProjectionInspector(title: String, root: Any?) {
    var path by remember(root) { mutableStateOf("") }
    val value = resolveProjection(root, path)
    GlassCard {
        Text(title, style = MaterialTheme.typography.titleLarge)
        Text("原始分析投影 · 可展开检查字段、样本与未返回项", color = Eivra.Secondary)
        val options = projectionChildren(root, path)
        if (path.isNotEmpty()) {
            EivraButton("← 返回上一层", { path = path.substringBeforeLast('.', "") }, subtle = true)
        }
        if (options.isNotEmpty()) Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            options.forEach { key ->
                EivraButton(key, { path = if (path.isBlank()) key else "$path.$key" }, subtle = true)
            }
        }
        if (value == null || value == JSONObject.NULL) Text("未返回 / 无可用样本", color = Eivra.Secondary)
        else if (value is JSONObject || value is JSONArray) {
            Text((value as? JSONObject)?.toString(2) ?: (value as? JSONArray)?.toString(2) ?: value.toString(), fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.bodySmall)
        } else Text(formatProjection(value), style = MaterialTheme.typography.titleMedium)
    }
}

private fun resolveProjection(root: Any?, path: String): Any? {
    var value = root
    if (path.isBlank()) return value
    path.split('.').forEach { part ->
        value = when (val current = value) {
            is JSONObject -> current.opt(part)
            is JSONArray -> part.toIntOrNull()?.let { current.opt(it) }
            else -> null
        }
    }
    return value
}

private fun projectionChildren(root: Any?, path: String): List<String> {
    val value = resolveProjection(root, path)
    return when (value) {
        is JSONObject -> value.keys().asSequence().toList()
        is JSONArray -> (0 until value.length()).take(30).map { it.toString() }
        else -> emptyList()
    }
}

private fun formatProjection(value: Any) = when (value) {
    is Double -> if (value.isFinite()) "%.4f".format(value) else "不可用"
    else -> value.toString()
}
