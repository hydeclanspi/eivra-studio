package com.eivra.studio

import android.content.Context
import app.cash.quickjs.QuickJs
import org.json.JSONArray
import org.json.JSONObject

/** UI-free original business kernel, evaluated on Dispatchers.Default only. */
class NativeEngine(context: Context) : AutoCloseable {
    private val quickJs = QuickJs.create()
    init {
        context.assets.open("eivra-engine.js").bufferedReader().use { quickJs.evaluate(it.readText()) }
    }
    fun healthCheck(): JSONObject {
        return JSONObject().put("engine", "QuickJS").put("native", true).put("answer", 42)
    }
    fun setStorage(bundle: JSONObject) {
        val stores = JSONObject().put("eivra.workspace.native", bundle.toString())
        quickJs.evaluate("nativeSetStorageJSON(${JSONObject.quote(stores.toString())})")
    }
    fun storage(): String = quickJs.evaluate("nativeGetStorageJSON()") as String
    fun invoke(name: String, args: JSONArray = JSONArray()): Any? = quickJs.evaluate("eivraEngine.invokeJSON(${JSONObject.quote(name)}, ${JSONObject.quote(args.toString())})")
    override fun close() = quickJs.close()
}
