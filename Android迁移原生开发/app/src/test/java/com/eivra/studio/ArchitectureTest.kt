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
    @Test fun demoDataIsValid() {
        val records = DemoData.json.getJSONArray("investments")
        assertTrue(records.length() > 0)
        for (i in 0 until records.length()) {
            assertTrue(records.getJSONObject(i).has("id"))
            assertTrue(records.getJSONObject(i).has("createdAt"))
        }
    }
}
