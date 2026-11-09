package com.eivra.studio

import org.json.JSONArray
import org.json.JSONObject

data class EntryDraft(var name: String = "", var odds: String = "")
data class InvestmentDraft(
    var home: String = "", var away: String = "", var entries: MutableList<EntryDraft> = mutableListOf(EntryDraft(), EntryDraft()),
    var alpha: String = "0.5", var betaHome: String = "M", var betaAway: String = "M",
    var gamma: String = "0.4", var deltaHome: String = "0.1", var deltaAway: String = "0.1",
    var note: String = "", var odds: String = "", var expected: String = "", var stake: String = ""
)

object DemoData {
    val json = JSONObject().apply {
        put("workspace", "demo")
        put("investments", JSONArray().apply {
            put(JSONObject().apply {
                put("id", "demo-arsenal-city"); put("homeTeam", "Arsenal"); put("awayTeam", "Manchester City")
                put("entries", JSONArray().apply { put(JSONObject().apply { put("name", "主胜"); put("odds", 2.10) }) })
                put("status", "settled"); put("result", true); put("inputs", 42.0); put("profit", 46.2)
                put("createdAt", "2026-10-31T12:00:00Z"); put("expected", 0.54)
            })
            put(JSONObject().apply {
                put("id", "demo-liverpool-real"); put("homeTeam", "Liverpool"); put("awayTeam", "Real Madrid")
                put("entries", JSONArray().apply { put(JSONObject().apply { put("name", "双方进球"); put("odds", 1.85) }) })
                put("status", "pending"); put("inputs", 35.0); put("createdAt", "2026-11-07T12:00:00Z"); put("expected", 0.59)
            })
            put(JSONObject().apply {
                put("id", "demo-bayern-inter"); put("homeTeam", "Bayern München"); put("awayTeam", "Inter")
                put("entries", JSONArray().apply { put(JSONObject().apply { put("name", "平局"); put("odds", 3.40) }) })
                put("status", "settled"); put("result", false); put("inputs", 20.0); put("profit", -20.0)
                put("createdAt", "2026-10-24T12:00:00Z"); put("expected", 0.34)
            })
        })
        put("systemConfig", JSONObject().apply { put("pool", 1529.0); put("riskCapRatio", 0.12) })
    }
}
