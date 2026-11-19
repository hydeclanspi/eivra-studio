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
        runCatching {
            rule.waitUntil(timeoutMillis = 60_000) {
                runCatching { rule.onNodeWithTag("workspace-ready").assertExists() }.isSuccess
            }
        }.onFailure { diagnose("startup"); throw it }
    }

    private fun waitPage(title: String) {
        rule.waitUntil(timeoutMillis = 15_000) {
            runCatching { rule.onNodeWithTag("page-title").assertTextEquals(title) }.isSuccess
        }
    }

    private fun diagnose(stage: String = "failure") {
        runCatching { rule.onRoot().printToLog("EivraTree") }
        runCatching { capture("$stage-diagnostic") }
        runCatching {
            val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
            val text = device.executeShellCommand("logcat -d -t 400 -v threadtime")
            File("/sdcard/Download", "$stage-logcat.txt").writeText(text)
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
        // Screenshots are diagnostic evidence, not a product assertion.
        // UiDevice's process needs a shared path; app-private filesDir is not writable by it.
        runCatching {
            val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
            val output = File("/sdcard/Download", "$name.png")
            device.takeScreenshot(output)
            android.util.Log.i("EivraNative", "capture ${output.absolutePath} exists=${output.exists()} bytes=${output.length()}")
        }.onFailure { android.util.Log.w("EivraNative", "capture failed=$name", it) }
    }

    private fun scrollAndInput(tag: String, text: String) {
        val node = rule.onNodeWithTag(tag)
        runCatching { node.performScrollTo() }
        node.performTextInput(text)
    }

    private fun scrollRootTo(tag: String) {
        runCatching {
            rule.onNodeWithTag("page-scroll").performScrollToNode(hasTestTag(tag))
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
        scrollAndInput("field-主队", "Arsenal")
        scrollAndInput("field-客队", "Chelsea")
        scrollAndInput("field-实际投入 ¥", "10")
        rule.onNodeWithTag("page-scroll").performScrollToNode(hasText("确认投资", substring = true))
        rule.onNodeWithText("确认投资", substring = true).performClick()
        rule.onAllNodesWithText("原始 Conf", substring = true).onFirst().assertExists()
        runCatching { rule.onNodeWithText("未确认时不会替你填 0.5", substring = true).assertExists() }.onFailure { diagnose("draft-validation"); throw it }
    }

    @Test fun rotationRetainsDraftAndRoute() {
        waitHome()
        scrollAndInput("field-主队", "Arsenal")
        scrollAndInput("field-客队", "Chelsea")
        rule.activityRule.scenario.recreate()
        waitHome()
        rule.waitUntil(timeoutMillis = 15_000) { runCatching { rule.onNodeWithTag("field-主队").assertExists() }.isSuccess }
        rule.onNodeWithTag("field-主队").assertTextContains("Arsenal")
        rule.onNodeWithTag("field-客队").assertTextContains("Chelsea")
        rule.onNodeWithTag("page-title").assertTextEquals("新建投资")
    }

    @Test fun historyRetainsOriginalForecastEvidence() {
        waitHome()
        navigate("history")
        runCatching { waitPage("历史与证据") }.onFailure { diagnose(); throw it }
        capture("phone-history")
        rule.onNodeWithTag("page-title").assertTextEquals("历史与证据")
        rule.onAllNodesWithText("展开 Entries、预测与时间戳", substring = true).onFirst().performScrollTo().performClick()
        rule.waitForIdle()
        runCatching { rule.onAllNodesWithText("收起证据", substring = true).onFirst().assertExists() }.onFailure { diagnose("history-expand"); throw it }
        rule.onAllNodesWithText("Entry 1", substring = true).onFirst().assertExists()
        rule.onAllNodesWithText("Conf", substring = true).onFirst().assertExists()
        rule.onAllNodesWithText("旧记录未包含 forecast snapshot", substring = true).onFirst().assertExists()
        rule.onAllNodesWithText("结算时间", substring = true).onFirst().assertExists()
    }
    @Test fun preMatchGlassRetainsBothTeamInputs() {
        waitHome()
        rule.onNodeWithTag("pre-match-hero").assertExists()
        rule.onNodeWithTag("team-pane-home").assertExists()
        scrollRootTo("team-pane-away")
        rule.onNodeWithTag("team-pane-away").assertExists()
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
        runCatching {
            rule.waitUntil(timeoutMillis = 30_000) {
                runCatching { rule.onNodeWithText("Expected Rating", substring = true).assertExists() }.isSuccess
            }
        }.onFailure { diagnose("forecast"); throw it }
        rule.onNodeWithTag("page-scroll").performScrollToNode(hasText("确认投资", substring = true))
        rule.onNodeWithText("确认投资", substring = true).performClick()
        runCatching {
            rule.waitUntil(timeoutMillis = 30_000) {
                runCatching { rule.onNodeWithTag("page-title").assertTextEquals("组合配置") }.isSuccess
            }
        }.onFailure { diagnose("save"); throw it }
        navigate("settle")
        waitPage("结算记录")
        rule.onAllNodesWithText("Arsenal vs Chelsea", substring = true).onFirst().performScrollTo().assertIsDisplayed()
        rule.onAllNodesWithText("命中", substring = false).onFirst().performScrollTo().performClick()
        rule.onNodeWithTag("settle-result-android-native-e2e-0").performScrollTo().performTextInput("2-1")
        rule.onNodeWithTag("settle-revenue-android-native-e2e").performScrollTo().performTextInput("20")
        rule.onNodeWithTag("settle-confirm-android-native-e2e").performScrollTo().performClick()
        rule.waitUntil(timeoutMillis = 30_000) {
            runCatching { rule.onNodeWithText("已写入结算与结算时间", substring = true).assertExists() }.isSuccess
        }
        navigate("dashboard")
        waitPage("判断，留下了什么")
        rule.waitUntil(timeoutMillis = 30_000) { runCatching { rule.onNodeWithTag("dashboard-loaded").assertExists() }.isSuccess }
        navigate("history")
        waitPage("历史与证据")
        rule.onNode(hasTestTag("history-count") and hasText("笔", substring = true)).assertExists()
        scrollAndInput("field-搜索球队、盘口、组合或备注", "Chelsea")
        rule.onNodeWithTag("history-list").performScrollToNode(hasText("Chelsea", substring = true))
        rule.onAllNodesWithText("Arsenal vs Chelsea", substring = true).onFirst().assertIsDisplayed()
        rule.onAllNodesWithText("实际 2-1", substring = true).onFirst().assertExists()
        runCatching { rule.onAllNodesWithText("命中", substring = true).onFirst().assertExists() }
            .onFailure { diagnose("history"); throw it }
    }

}
