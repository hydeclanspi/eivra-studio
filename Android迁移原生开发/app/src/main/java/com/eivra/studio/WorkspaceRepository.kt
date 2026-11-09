package com.eivra.studio

import android.content.Context
import org.json.JSONObject

class WorkspaceRepository(context: Context) {
    private val preferences = context.applicationContext.getSharedPreferences("eivra.workspace.v1", Context.MODE_PRIVATE)
    private val key = "bundle"
    fun load(): JSONObject = try { JSONObject(preferences.getString(key, null) ?: DemoData.json.toString()) } catch (_: Exception) { DemoData.json }
    fun save(bundle: JSONObject) { preferences.edit().putString(key, bundle.toString()).apply() }
    fun resetDemo() { preferences.edit().remove(key).apply() }
    fun export(): String = load().toString(2)
}
