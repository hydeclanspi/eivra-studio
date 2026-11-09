package com.eivra.studio

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

class WorkspaceRepository(context: Context) {
    private val preferences = context.applicationContext.getSharedPreferences("eivra.workspace.v1", Context.MODE_PRIVATE)
    private val key = "bundle"
    private val backupKey = "backup.before-import"
    fun load(): JSONObject = try { JSONObject(preferences.getString(key, null) ?: DemoData.json.toString()) } catch (_: Exception) { DemoData.json }
    fun save(bundle: JSONObject) { preferences.edit().putString(key, bundle.toString()).apply() }
    fun export(): String = load().toString(2)
    fun backup(): String = export()
    fun restoreBackup(): Boolean {
        val backup = preferences.getString(backupKey, null) ?: return false
        save(JSONObject(backup)); return true
    }
    fun importWebBundle(text: String, merge: Boolean): BundleValidation {
        val parsed = try { JSONObject(text) } catch (_: Exception) { return BundleValidation(false, 0, null, listOf("文件不是有效 JSON")) }
        val validation = WorkspaceMigration.validate(parsed)
        if (!validation.valid) return validation
        val before = export()
        val incoming = parsed.getJSONArray("investments")
        val next = JSONObject(parsed.toString())
        if (merge) next.put("investments", WorkspaceMigration.merge(load().optJSONArray("investments") ?: JSONArray(), incoming))
        preferences.edit().putString(backupKey, before).putString(key, next.toString()).apply()
        return validation
    }
    fun resetDemo() { preferences.edit().putString(backupKey, export()).putString(key, DemoData.json.toString()).apply() }
}
