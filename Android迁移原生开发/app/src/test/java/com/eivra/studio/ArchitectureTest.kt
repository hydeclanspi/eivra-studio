package com.eivra.studio

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class ArchitectureTest {
    @Test fun productionUiNeverUsesWebView() {
        val source = File("src/main/java").walkTopDown().filter { it.extension == "kt" }.map { it.readText() }.joinToString("
")
        assertFalse("Native migration must not render product pages in a WebView", source.contains("android.webkit.WebView"))
        assertTrue(source.contains("Jetpack") || source.contains("Compose") || source.contains("androidx.compose"))
    }
    @Test fun originalEngineDefinesRequiredContracts() {
        val entry = File("../engine/entry.js").readText()
        listOf("localData.saveInvestment", "localData.updateInvestment", "analytics.getDashboardSnapshot", "analytics.getAnalysisSnapshot", "analytics.getMetricsSnapshot", "analytics.getTeamsSnapshot", "quantResearch.getResearchStore", "quantForward.getForwardStore").forEach {
            assertTrue("Missing engine contract: $it", entry.contains(it))
        }
    }
    @Test fun nativeWritesUseOriginalSnakeCaseContract() {
        val screen = File("src/main/java/com/eivra/studio/Workspaces.kt").readText()
        assertTrue(screen.contains("home_team"))
        assertTrue(screen.contains("created_at"))
        assertTrue(screen.contains("localData") || File("src/main/java/com/eivra/studio/WorkspaceRepository.kt").readText().contains("localData.updateInvestment"))
    }
    @Test fun demoDataIsValid() {
        val records = DemoData.json.getJSONArray("investments")
        assertEquals(0, records.length())
        assertTrue(DemoData.json.has("system_config"))
    }
}
