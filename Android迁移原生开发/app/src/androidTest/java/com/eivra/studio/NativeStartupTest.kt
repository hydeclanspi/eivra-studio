package com.eivra.studio

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.espresso.Espresso
import org.junit.Rule
import org.junit.Test

class NativeStartupTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    private fun waitHome() {
        rule.waitUntil(timeoutMillis = 45_000) {
            runCatching { rule.onNodeWithText("新建投资", substring = true).assertIsDisplayed() }.isSuccess
        }
    }

    private fun navigate(id: String) {
        if (id in listOf("history", "analysis", "metrics", "teams", "console", "quants")) {
            runCatching { rule.onNodeWithTag("nav-more").performClick() }
        }
        rule.onNodeWithTag("nav-$id").performClick()
    }

    @Test fun startsNativeAndNavigatesCoreWorkspace() {
        waitHome()
        rule.onNodeWithText("Eivra Studio", substring = true).assertIsDisplayed()
        navigate("portfolio")
        rule.onNodeWithText("组合配置", substring = true).assertIsDisplayed()
        navigate("dashboard")
        rule.onNodeWithText("判断，留下了什么", substring = true).assertIsDisplayed()
        Espresso.pressBack()
        rule.onNodeWithText("新建投资", substring = true).assertIsDisplayed()
    }

    @Test fun draftRejectsUnratedConfidenceInsteadOfUsingHalf() {
        waitHome()
        rule.onNodeWithText("主队", substring = true).performTextInput("Arsenal")
        rule.onNodeWithText("客队", substring = true).performTextInput("Chelsea")
        rule.onNodeWithText("实际投入", substring = true).performTextInput("10")
        rule.onNodeWithText("确认投资", substring = true).performScrollTo().performClick()
        rule.onNodeWithText("原始 Conf", substring = true).assertExists()
        rule.onNodeWithText("未确认时不会替你填 0.5", substring = true).assertIsDisplayed()
    }

    @Test fun rotationRetainsDraftAndRoute() {
        waitHome()
        rule.onNodeWithText("主队", substring = true).performTextInput("Arsenal")
        rule.onNodeWithText("客队", substring = true).performTextInput("Chelsea")
        rule.activityRule.scenario.recreate()
        rule.onNodeWithText("Arsenal", substring = true).assertIsDisplayed()
        rule.onNodeWithText("Chelsea", substring = true).assertIsDisplayed()
        rule.onNodeWithText("新建投资", substring = true).assertIsDisplayed()
    }

    @Test fun historyRetainsOriginalForecastEvidence() {
        waitHome()
        navigate("history")
        rule.onNodeWithText("历史与证据", substring = true).assertIsDisplayed()
        rule.onNodeWithText("展开 Entries、预测与时间戳", substring = true).performScrollTo().performClick()
        rule.onNodeWithText("结算时间", substring = true).assertIsDisplayed()
    }
}
