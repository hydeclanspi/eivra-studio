package com.eivra.studio.v2
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.espresso.Espresso.pressBack
import org.junit.Rule
import org.junit.Test

class NavigationSmoke {
 @get:Rule val ui = createAndroidComposeRule<MainActivity>()
 @Test fun navigationAndSystemBack() {
     ui.onNodeWithTag("workspace-New").assertIsDisplayed()
     if(ui.onAllNodesWithTag("menu").fetchSemanticsNodes().isNotEmpty()) {
        ui.onNodeWithTag("menu").performClick();ui.onNodeWithTag("go-Portfolio").performClick()
     } else { ui.onNodeWithTag("nav-Portfolio").performClick() }
     ui.onNodeWithTag("workspace-Portfolio").assertIsDisplayed();pressBack();ui.onNodeWithTag("workspace-New").assertIsDisplayed()
 }
}
