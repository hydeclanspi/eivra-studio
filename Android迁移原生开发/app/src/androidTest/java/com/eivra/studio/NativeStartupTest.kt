package com.eivra.studio

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.assertIsDisplayed
import org.junit.Rule
import org.junit.Test

class NativeStartupTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()
    @Test fun startsNativeAndNavigates() {
        rule.onNodeWithText("Eivra Studio").assertIsDisplayed()
        rule.onNodeWithText("新建投资", substring = true).assertIsDisplayed()
        rule.onNodeWithText("Portfolio", substring = true).performClick()
        rule.onNodeWithText("组合配置", substring = true).assertIsDisplayed()
    }
}
