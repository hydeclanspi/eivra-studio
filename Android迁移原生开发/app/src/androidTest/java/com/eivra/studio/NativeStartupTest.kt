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
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dir = File(context.filesDir, "native-screenshots").apply { mkdirs() }
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val output = File(dir, "$name.png")
        check(device.takeScreenshot(output)) { "无法保存原生截图：${output.absolutePath}" }
        check(output.length() > 0L) { "原生截图为空：${output.absolutePath}" }
        android.util.Log.i("EivraNative", "capture saved=${output.absolutePath} bytes=${output.length()}")
    }

    private fun scrollAndInput(tag: String, text: String) {
        val node = rule.onNodeWithTag(tag)
        runCatching { node.performScrollTo() }
        node.performTextInput(text)
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
        rule.waitUntil(timeoutMillis = 30_000) { runCatching { rule.onNodeWithTag("dashboard-loaded").assertExists() }.isSuccess }
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
    @Test fun preMatchGlassRetainsBothTeamInputs() {
        waitHome()
        rule.onNodeWithTag("pre-match-hero").assertExists()
        rule.onNodeWithTag("team-pane-home").assertIsDisplayed()
        rule.onNodeWithTag("team-pane-away").assertIsDisplayed()
        rule.onNodeWithTag("field-主队").assertTextContains("主队")
        rule.onNodeWithTag("field-客队").assertTextContains("客队")
        scrollAndInput("field-主队", "Arsenal")
        scrollAndInput("field-客队", "Chelsea")
        rule.onNodeWithTag("field-主队").assertTextContains("Arsenal")
        rule.onNodeWithTag("field-客队").assertTextContains("Chelsea")
        capture("phone-new-glass")
    }

    @Test fun newInvestmentCanBeSavedAndSettledLegByLeg() {
        waitHome()
        scrollAndInput("field-主队", "Arsenal")
        scrollAndInput("field-客队", "Chelsea")
        scrollAndInput("field-我的原始 Conf", "0.6")
        scrollAndInput("field-实际投入 ¥", "10")
        rule.onNodeWithText("确认投资", substring = true).performScrollTo().performClick()
        rule.waitUntil(timeoutMillis = 30_000) {
            runCatching { rule.onNodeWithTag("page-title").assertTextEquals("组合配置") }.isSuccess
        }
        navigate("settle")
        waitPage("结算记录")
        rule.onNodeWithText("Arsenal vs Chelsea", substring = true).performScrollTo().assertIsDisplayed()
        rule.onNodeWithText("命中", substring = false).performScrollTo().performClick()
        scrollAndInput("field-实际比分 / 结果", "2-1")
        scrollAndInput("field-Revenue · 实际回款 ¥", "20")
        rule.onNodeWithText("确认结算", substring = true).performScrollTo().performClick()
        rule.waitUntil(timeoutMillis = 30_000) {
            runCatching { rule.onNodeWithText("没有待结算的判断。", substring = true).assertExists() }.isSuccess
        }
        navigate("dashboard")
        rule.waitUntil(timeoutMillis = 30_000) { runCatching { rule.onNodeWithTag("dashboard-loaded").assertExists() }.isSuccess }
        navigate("history")
        waitPage("历史与证据")
        rule.onAllNodesWithText("Arsenal", substring = true).onFirst().assertExists()
        rule.onAllNodesWithText("Chelsea", substring = true).onFirst().assertExists()
    }

}
