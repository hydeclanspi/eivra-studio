package com.eivra.studio

import android.content.Context
import app.cash.quickjs.QuickJs
import org.json.JSONArray
import org.json.JSONObject

/** One original business kernel, called on Dispatchers.Default. No DOM/WebView. */
class NativeEngine(context: Context, workspace: JSONObject? = null) : AutoCloseable {
    private val quickJs = QuickJs.create()
    init {
        context.assets.open("eivra-engine.js").bufferedReader().use { quickJs.evaluate(it.readText()) }
        quickJs.evaluate("eivraEngine.hydrate(${JSONObject.quote(JSONObject().put("eivra.full_session_latch.v1", "1").put("eivra.workspace.native", workspace?.toString() ?: "{}").toString())})")
    }
    fun healthCheck(): JSONObject = JSONObject().put("engine", "QuickJS").put("native", true).put("answer", 42)
    fun invoke(name: String, args: JSONArray = JSONArray()): String = quickJs.evaluate("eivraEngine.invokeJSON(${JSONObject.quote(name)}, ${JSONObject.quote(args.toString())})") as String
    fun workspace(): JSONObject = JSONObject(quickJs.evaluate("eivraEngine.exportWorkspaceJSON()") as String)
    override fun close() = quickJs.close()
}
