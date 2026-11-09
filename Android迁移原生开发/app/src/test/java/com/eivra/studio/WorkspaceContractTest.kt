package com.eivra.studio

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class WorkspaceContractTest {
    private fun record(id: String, inputs: Double, odds: Double, won: Boolean, expected: Double? = null): JSONObject {
        val entry = JSONObject().put("name", "主胜").put("odds", odds)
        return JSONObject().put("id", id).put("homeTeam", "A").put("awayTeam", "B")
            .put("entries", JSONArray().put(entry)).put("status", "settled")
            .put("result", won).put("inputs", inputs)
            .put("profit", if (won) inputs * (odds - 1) else -inputs)
            .put("createdAt", "2026-11-01T12:00:00Z")
            .apply { if (expected != null) put("expected", expected) }
    }
    @Test fun webBundleCanBeValidatedWithoutDroppingRecords() {
        val source = JSONObject().put("version", 1)
            .put("system_config", JSONObject().put("pool", 1529.0))
            .put("investments", JSONArray().put(record("web-1", 20.0, 2.0, true, .55)))
        val result = WorkspaceMigration.validate(source)
        assertTrue(result.valid)
        assertEquals(1, result.investmentCount)
        assertEquals("web-1", result.firstId)
    }
    @Test fun invalidProbabilityIsRejectedNotSilentlyCoerced() {
        val source = JSONObject().put("version", 1).put("investments", JSONArray().put(record("bad", 10.0, 2.0, false, 2.5)))
        val result = WorkspaceMigration.validate(source)
        assertFalse(result.valid)
        assertTrue(result.errors.first().contains("expected"))
    }
    @Test fun mergeIsIdUnionNotRecordLoss() {
        val local = JSONArray().put(record("local", 10.0, 1.8, false))
        val remote = JSONArray().put(record("remote", 20.0, 2.0, true)).put(record("local", 30.0, 1.9, false))
        val merged = WorkspaceMigration.merge(local, remote)
        assertEquals(2, merged.length())
        assertEquals(30.0, (0 until merged.length()).map { merged.getJSONObject(it) }.single { it.getString("id") == "local" }.getDouble("inputs"), 0.0)
    }
}
