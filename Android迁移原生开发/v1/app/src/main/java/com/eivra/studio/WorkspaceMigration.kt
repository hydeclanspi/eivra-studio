package com.eivra.studio

import org.json.JSONArray
import org.json.JSONObject

data class BundleValidation(val valid: Boolean, val investmentCount: Int, val firstId: String?, val errors: List<String>, val summary: String = "")

/** Import boundary: validate before touching the persisted owner workspace. */
object WorkspaceMigration {
    fun validate(bundle: JSONObject): BundleValidation {
        val errors = mutableListOf<String>()
        val records = bundle.optJSONArray("investments")
        if (records == null) errors += "缺少 investments 数组"
        val ids = mutableSetOf<String>()
        if (records != null) for (i in 0 until records.length()) {
            val record = records.optJSONObject(i)
            if (record == null) { errors += "第 ${i + 1} 条不是对象"; continue }
            val id = record.optString("id")
            if (id.isBlank()) errors += "第 ${i + 1} 条缺少 id"
            if (!ids.add(id)) errors += "重复 id: $id"
            if (record.optDouble("inputs", -1.0) < 0) errors += "$id: inputs 不能为负"
            if (record.has("expected") && !record.isNull("expected") && record.optDouble("expected", -1.0) !in 0.0..1.0) errors += "$id: expected 必须在 0–1"
            val matches = record.optJSONArray("matches")
            if (matches == null || matches.length() == 0) errors += "$id: 缺少 matches"
            else for (j in 0 until matches.length()) {
                val match = matches.optJSONObject(j)
                if (match == null) { errors += "$id: 第 ${j + 1} 腿不是对象"; continue }
                val entries = match.optJSONArray("entries")
                if (entries == null || entries.length() == 0) errors += "$id: 第 ${j + 1} 腿缺少 entries"
                else for (k in 0 until entries.length()) {
                    val entry = entries.optJSONObject(k)
                    if (entry == null || entry.optString("name").isBlank()) errors += "$id: 第 ${j + 1} 腿 Entry ${k + 1} 缺少名称"
                    // Invalid historical quotes remain visible to the original model_validation;
                    // do not silently drop the leg or reject the entire owner backup.
                }
                if (match.has("conf") && !match.isNull("conf") && match.optDouble("conf", -1.0) !in 0.0..1.0) errors += "$id: 第 ${j + 1} 腿 conf 必须在 0–1"
            }
        }
        val firstId = records?.optJSONObject(0)?.optString("id")
        return BundleValidation(errors.isEmpty(), records?.length() ?: 0, firstId, errors)
    }
    fun merge(local: JSONArray, remote: JSONArray): JSONArray {
        val result = JSONArray()
        val indices = mutableMapOf<String, Int>()
        fun addAll(records: JSONArray) {
            for (i in 0 until records.length()) {
                val record = records.getJSONObject(i)
                val id = record.optString("id")
                val index = indices[id]
                if (index == null) { indices[id] = result.length(); result.put(record) }
                else result.put(index, record) // remote wins for a shared id
            }
        }
        addAll(local); addAll(remote)
        return result
    }
}
