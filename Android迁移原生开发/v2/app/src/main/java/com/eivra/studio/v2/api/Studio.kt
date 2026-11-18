package com.eivra.studio.v2.api

import kotlinx.coroutines.flow.StateFlow
import org.json.JSONArray

enum class Route(val path: String, val title: String, val section: String) {
    New("/new", "New Investment", "New"), Portfolio("/combo", "Smart Portfolio", "Portfolio"),
    Settle("/settle", "Settlement", "Settle"), Quants("/quants", "Quants Lab", "Quants"),
    Dashboard("/dashboard", "Dashboard", "Dashboard"), Analysis("/dashboard/analysis", "Deep Analysis", "Dashboard"),
    Metrics("/dashboard/metrics", "Metrics", "Dashboard"), Seasons("/dashboard/report", "Seasons", "Dashboard"),
    History("/history", "History", "History"), Teams("/history/teams", "Team Archive", "History"),
    Console("/params", "Console", "Console");
    companion object {
        fun fromPath(raw: String): Route? = when (val p = raw.substringBefore('?').substringBefore('#').trimEnd('/')) {
            "" -> New; "/dashboard/quants" -> Quants; else -> entries.firstOrNull { it.path == p }
        }
    }
}

data class Dest(val route: Route, val key: String? = null)
data class WorkspaceState(val mode: String = "unavailable", val revision: Long = 0, val pendingCount: Int? = null)
interface StudioPorts {
    val state: StateFlow<WorkspaceState>
    suspend fun read(op: String, args: JSONArray = JSONArray()): String
    suspend fun write(op: String, args: JSONArray = JSONArray()): String
}
/** Window width is in density-independent pixels. Each feature owns its scroll container. */
data class StudioEnv(val dest: Dest, val widthDp: Int, val ports: StudioPorts, val go: (Dest) -> Unit)
