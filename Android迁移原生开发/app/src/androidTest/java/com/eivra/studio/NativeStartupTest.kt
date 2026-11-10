package com.eivra.studio

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.espresso.Espresso
import org.junit.Rule
import org.junit.Test
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import java.io.File

class NativeStartupTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    private fun waitHome() {
        rule.waitUntil(timeoutMillis = 45_000) {
            runCatching { rule.onNodeWithText("新建投资", substring = true).assertIsDisplayed() }.isSuccess
        }
    }

    private fun waitPage(title: String) {
        rule.waitUntil(timeoutMillis = 15_000) {
            runCatching { rule.onNodeWithTag("page-title").assertTextEquals(title) }.isSuccess
        }
    }

    private fun diagnose() {
        runCatching { rule.onRoot().printToLog("EivraTree") }
        capture("failure-diagnostic")
    }

    private fun navigate(id: String) {
        if (id in listOf("history", "analysis", "metrics", "teams", "console", "quants")) {
            runCatching { rule.onNodeWithTag("nav-more").performClick() }
        }
        rule.onNodeWithTag("nav-$id").performClick()
        rule.waitForIdle()
    }

    private fun capture(name: String) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val device = UiDevice.getInstance(instrumentation)
        // Use the instrumentation app's private files directory. On this runner
        // getExternalFilesDir(null) is null; external storage is not required.
        val dir = File(instrumentation.context.filesDir, "acceptance")
        if (!dir.isDirectory) { dir.deleteRecursively(); check(dir.mkdirs()) { "无法创建截图目录 ${dir.absolutePath}" } }
        check(dir.canWrite()) { "截图目录不可写 ${dir.absolutePath}" }
        val output = File(dir, "$name.png")
        val saved = device.takeScreenshot(output)
        android.util.Log.i("EivraNative", "screenshot path=${output.absolutePath} saved=$saved exists=${output.exists()}")
        if (!saved || !output.isFile || output.length() == 0L) {
            throw IllegalStateException("无法保存原生截图 $name 到 ${output.absolutePath}")
        }
    }

    @Test fun startsNativeAndNavigatesCoreWorkspace() {
        waitHome()
        capture("phone-new")
        rule.onNodeWithText("Eivra Studio", substring = true).assertIsDisplayed()
        navigate("portfolio")
        runCatching { waitPage("组合配置") }.onFailure { diagnose(); throw it }
        capture("phone-portfolio")
        rule.onNodeWithTag("page-title").assertTextEquals("组合配置")
        navigate("dashboard")
        runCatching { waitPage("判断，留下了什么") }.onFailure { diagnose(); throw it }
        capture("phone-dashboard")
        rule.onNodeWithTag("page-title").assertTextEquals("判断，留下了什么")
        Espresso.pressBack()
        rule.onNodeWithTag("page-title").assertTextEquals("组合配置")
        Espresso.pressBack()
        rule.onNodeWithTag("page-title").assertTextEquals("新建投资")
    }

    @Test fun draftRejectsUnratedConfidenceInsteadOfUsingHalf() {
        waitHome()
        rule.onNodeWithTag("field-主队").performTextInput("Arsenal")
        rule.onNodeWithTag("field-客队").performTextInput("Chelsea")
        rule.onNodeWithTag("field-实际投入 ¥").performTextInput("10")
        rule.onNodeWithText("确认投资", substring = true).performScrollTo().performClick()
        rule.onAllNodesWithText("原始 Conf", substring = true).onFirst().assertExists()
        rule.onNodeWithText("未确认时不会替你填 0.5", substring = true).assertIsDisplayed()
    }

    @Test fun rotationRetainsDraftAndRoute() {
        waitHome()
        rule.onNodeWithTag("field-主队").performTextInput("Arsenal")
        rule.onNodeWithTag("field-客队").performTextInput("Chelsea")
        rule.activityRule.scenario.recreate()
        waitHome()
        rule.waitUntil(timeoutMillis = 15_000) { runCatching { rule.onNodeWithTag("field-主队").assertExists() }.isSuccess }
        rule.onNodeWithTag("field-主队").assertTextContains("Arsenal")
        rule.onNodeWithTag("field-客队").assertTextContains("Chelsea")
        rule.onNodeWithText("新建投资", substring = true).assertIsDisplayed()
    }

    @Test fun historyRetainsOriginalForecastEvidence() {
        waitHome()
        navigate("history")
        runCatching { waitPage("历史与证据") }.onFailure { diagnose(); throw it }
        capture("phone-history")
        rule.onNodeWithTag("page-title").assertTextEquals("历史与证据")
        rule.onAllNodesWithText("展开 Entries、预测与时间戳", substring = true).onFirst().performScrollTo().performClick()
        rule.waitForIdle()
        rule.onAllNodesWithText("收起证据", substring = true).onFirst().assertExists()
        rule.onAllNodesWithText("Entry 1", substring = true).onFirst().assertExists()
        rule.onAllNodesWithText("Conf", substring = true).onFirst().assertExists()
        rule.onAllNodesWithText("旧记录未包含 forecast snapshot", substring = true).onFirst().assertExists()
        rule.onAllNodesWithText("结算时间", substring = true).onFirst().assertExists()
    }
}
