package com.eivra.studio

import org.json.JSONObject

/** Cold-start fallback only. Normal bootstrap uses the original curated demo. */
object DemoData {
    val json = JSONObject().put("version", 1).put("investments", org.json.JSONArray())
        .put("system_config", JSONObject().put("initialCapital", 0.0))
}
