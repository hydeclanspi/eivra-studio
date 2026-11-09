package com.eivra.studio

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class WorkspaceContractTest {
    private fun record(id: String, inputs: Double = 10.0, conf: Double? = .55): JSONObject {
        val entry = JSONObject().put("name", "主胜").put("odds", 2.0)
        val match = JSONObject().put("id", "$id-match").put("home_team", "Arsenal").put("away_team", "Chelsea")
            .put("entries", JSONArray().put(entry)).put("entry_text", "主胜")
            .put("created_at", "2026-11-01T12:00:00Z")
        if (conf != null) match.put("conf", conf)
        return JSONObject().put("id", id).put("inputs", inputs).put("status", "pending")
            .put("created_at", "2026-11-01T12:00:00Z").put("matches", JSONArray().put(match))
    }
    @Test fun originalWebBundleIsAcceptedWithoutDroppingLegs() {
        val source = JSONObject().put("version", 1).put("investments", JSONArray().put(record("web-1")))
        val result = WorkspaceMigration.validate(source)
        assertTrue(result.errors.joinToString(), result.valid)
        assertEquals(1, result.investmentCount)
        assertEquals("web-1", result.firstId)
    }
    @Test fun missingConfidenceIsUnratedNotDefaultHalf() {
        val source = JSONObject().put("investments", JSONArray().put(record("unrated", conf = null)))
        assertTrue(WorkspaceMigration.validate(source).valid)
        assertFalse(source.getJSONArray("investments").getJSONObject(0).getJSONArray("matches").getJSONObject(0).has("conf"))
    }
    @Test fun invalidProbabilityIsRejectedNotSilentlyCoerced() {
        val source = JSONObject().put("investments", JSONArray().put(record("bad", conf = 2.5)))
        val result = WorkspaceMigration.validate(source)
        assertFalse(result.valid)
        assertTrue(result.errors.first().contains("conf"))
    }
    @Test fun topLevelSimplifiedEntriesAreNotAcceptedAsOriginalModel() {
        val source = JSONObject().put("investments", JSONArray().put(JSONObject().put("id", "bad").put("inputs", 10).put("entries", JSONArray().put(JSONObject().put("name", "主胜")))))
        assertFalse(WorkspaceMigration.validate(source).valid)
    }
    @Test fun mergeIsIdUnionNotRecordLoss() {
        val local = JSONArray().put(record("local", 10.0))
        val remote = JSONArray().put(record("remote", 20.0)).put(record("local", 30.0))
        val merged = WorkspaceMigration.merge(local, remote)
        assertEquals(2, merged.length())
        assertEquals(30.0, (0 until merged.length()).map { merged.getJSONObject(it) }.single { it.getString("id") == "local" }.getDouble("inputs"), 0.0)
    }
    @Test fun forecastSnapshotAndSettlementTimesSurviveMerge() {
        val original = record("forecast").put("forecast_snapshot", JSONObject().put("generated_at", "2026-11-01T12:00:00Z"))
            .put("settled_at", "2026-11-02T12:00:00Z").put("outcome_available_at", "2026-11-02T12:00:00Z")
        val merged = WorkspaceMigration.merge(JSONArray(), JSONArray().put(original)).getJSONObject(0)
        assertEquals("2026-11-01T12:00:00Z", merged.getJSONObject("forecast_snapshot").getString("generated_at"))
        assertEquals("2026-11-02T12:00:00Z", merged.getString("outcome_available_at"))
    }
}
