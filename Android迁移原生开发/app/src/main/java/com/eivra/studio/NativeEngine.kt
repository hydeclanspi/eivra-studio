package com.eivra.studio

import app.cash.quickjs.QuickJs
import org.json.JSONObject

/** Bounded, UI-free calculation boundary. No WebView, DOM, or remote renderer. */
class NativeEngine : AutoCloseable {
    private val quickJs = QuickJs.create()
    fun healthCheck(): JSONObject {
        val result = quickJs.evaluate("JSON.stringify({engine:'QuickJS',native:true,answer:6*7})") as String
        return JSONObject(result)
    }
    override fun close() = quickJs.close()
}
