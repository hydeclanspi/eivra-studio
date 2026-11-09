package com.eivra.studio

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

class WorkspaceRepository(private val context: Context) {
    private val preferences = context.applicationContext.getSharedPreferences("eivra.workspace.v1", Context.MODE_PRIVATE)
    private val key = "bundle"
    private val backupKey = "backup.before-import"
    fun load(): JSONObject = try { JSONObject(preferences.getString(key, null) ?: DemoData.json.toString()) } catch (_: Exception) { DemoData.json }
    fun save(bundle: JSONObject) { if (!preferences.edit().putString(key, bundle.toString()).commit()) throw IllegalStateException("本地工作区写入失败") }
    suspend fun bootstrap(): JSONObject = withContext(Dispatchers.Default) {
        NativeEngine(context, if (preferences.contains(key)) load() else null).use { it.workspace() }.also { save(it) }
    }
    suspend fun forecast(matches: JSONArray, generatedAt: String): JSONObject = withContext(Dispatchers.Default) {
        NativeEngine(context, load()).use { JSONObject(it.invoke("forecast.buildDraft", JSONArray().put(matches).put(generatedAt))) }
    }
    suspend fun saveInvestment(record: JSONObject): JSONObject = withContext(Dispatchers.Default) {
        NativeEngine(context, load()).use {
            it.invoke("localData.saveInvestment", JSONArray().put(record))
            it.workspace().also { next -> save(next) }
        }
    }
    suspend fun settleInvestment(id: String, form: JSONObject): JSONObject = withContext(Dispatchers.Default) {
        NativeEngine(context, load()).use {
            it.invoke("localData.settleFromForm", JSONArray().put(id).put(form))
            it.workspace().also { next -> save(next) }
        }
    }
    suspend fun saveSystemConfig(config: JSONObject): JSONObject = withContext(Dispatchers.Default) {
        NativeEngine(context, load()).use {
            it.invoke("localData.saveSystemConfig", org.json.JSONArray().put(config))
            it.workspace().also { next -> save(next) }
        }
    }
    suspend fun dashboard(period: String = "all"): JSONObject = withContext(Dispatchers.Default) {
        NativeEngine(context, load()).use { JSONObject(it.invoke("analytics.getDashboardSnapshot", org.json.JSONArray().put(period))) }
    }
    suspend fun analysis(period: String = "all"): JSONObject = withContext(Dispatchers.Default) {
        NativeEngine(context, load()).use { JSONObject(it.invoke("analytics.getAnalysisSnapshot", org.json.JSONArray().put(period))) }
    }
    suspend fun metrics(period: String = "all"): JSONObject = withContext(Dispatchers.Default) {
        NativeEngine(context, load()).use { JSONObject(it.invoke("analytics.getMetricsSnapshot", org.json.JSONArray().put(period))) }
    }
    suspend fun teams(): org.json.JSONArray = withContext(Dispatchers.Default) {
        NativeEngine(context, load()).use { org.json.JSONArray(it.invoke("analytics.getTeamsSnapshot", org.json.JSONArray().put("").put("all"))) }
    }
    suspend fun research(): JSONObject = withContext(Dispatchers.Default) {
        NativeEngine(context, load()).use {
            JSONObject().put("research", JSONObject(it.invoke("quantResearch.getResearchStore")))
                .put("forward", JSONObject(it.invoke("quantForward.getForwardStore")))
        }
    }
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
    fun resetDemo() { preferences.edit().putString(backupKey, export()).remove(key).apply() }
}
