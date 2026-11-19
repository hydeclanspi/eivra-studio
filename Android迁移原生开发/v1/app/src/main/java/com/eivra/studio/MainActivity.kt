package com.eivra.studio

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.material3.Surface
import androidx.compose.ui.graphics.Color
import com.eivra.studio.ui.Eivra
import com.eivra.studio.ui.EivraTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            EivraTheme {
                Surface(color = Eivra.Canvas) {
                    BoxWithConstraints { EivraApp(tablet = maxWidth.value >= 840, recordIdFactory = { "android-native-e2e" }) }
                }
            }
        }
    }
}
