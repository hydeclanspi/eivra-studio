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

    private fun navigate(id: String) {
        if (id in listOf("history", "analysis", "metrics", "teams", "console", "quants")) {
            runCatching { rule.onNodeWithTag("nav-more").performClick() }
        }
        rule.onNodeWithTag("nav-$id").performClick()
        rule.waitForIdle()
    }

    private fun capture(name: String) {
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val dir = File("/sdcard/Download/eivra-acceptance")
        dir.mkdirs()
        val saved = device.takeScreenshot(File(dir, "$name.png"))
        if (!saved) throw IllegalStateException("无法保存原生截图 $name")
    }

    @Test fun startsNativeAndNavigatesCoreWorkspace() {
        waitHome()
        capture("phone-new")
        rule.onNodeWithText("Eivra Studio", substring = true).assertIsDisplayed()
        navigate("portfolio")
        waitPage("组合配置")
        capture("phone-portfolio")
        rule.onNodeWithTag("page-title").assertTextEquals("组合配置")
        navigate("dashboard")
        waitPage("判断，留下了什么")
        capture("phone-dashboard")
        rule.onNodeWithTag("page-title").assertTextEquals("判断，留下了什么")
        Espresso.pressBack()
        rule.onNodeWithText("新建投资", substring = true).assertIsDisplayed()
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
        rule.onNodeWithText("Arsenal", substring = true).assertIsDisplayed()
        rule.onNodeWithText("Chelsea", substring = true).assertIsDisplayed()
        rule.onNodeWithText("新建投资", substring = true).assertIsDisplayed()
    }

    @Test fun historyRetainsOriginalForecastEvidence() {
        waitHome()
        navigate("history")
        waitPage("历史与证据")
        capture("phone-history")
        rule.onNodeWithTag("page-title").assertTextEquals("历史与证据")
        rule.onAllNodesWithText("展开 Entries、预测与时间戳", substring = true).onFirst().performClick()
        rule.onAllNodesWithText("结算时间", substring = true).onFirst().performScrollTo()
        rule.onNodeWithText("结算时间", substring = true).assertIsDisplayed()
    }
}
