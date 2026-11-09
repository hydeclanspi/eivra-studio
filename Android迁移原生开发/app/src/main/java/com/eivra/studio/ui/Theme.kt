package com.eivra.studio.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Inspiration baseline. Values are extracted from the live web styles, not
// Material You dynamic colors; Eivra must not turn into another Android app.
object Eivra {
    val Canvas = Color(0xFFF3F2EE)
    val Surface = Color(0xFFFFFE)
    val Glass = Color(0xEFFFFFFF)
    val Ink = Color(0xFF273B35)
    val Secondary = Color(0xFF71817A)
    val Rule = Color(0x1F344C43)
    val Mint = Color(0xFFDCEAE1)
    val Green = Color(0xFF375D50)
    val Apricot = Color(0xFFEBC29A)
    val Gold = Color(0xFFBE9A60)
    val Blue = Color(0xFF536B83)
    val Red = Color(0xFFAF5960)
}

val EivraTypography = androidx.compose.material3.Typography(
    displaySmall = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal, fontSize = 38.sp, lineHeight = 46.sp, letterSpacing = (-0.8).sp),
    headlineMedium = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Medium, fontSize = 28.sp, lineHeight = 36.sp),
    titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = 21.sp, lineHeight = 29.sp),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = 16.sp, lineHeight = 23.sp),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 15.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 13.sp, lineHeight = 20.sp),
    labelMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = 11.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp)
)

@Composable
fun EivraTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = Eivra.Green, onPrimary = Color.White,
            background = Eivra.Canvas, onBackground = Eivra.Ink,
            surface = Eivra.Surface, onSurface = Eivra.Ink,
            surfaceVariant = Eivra.Mint, onSurfaceVariant = Eivra.Ink,
            outline = Eivra.Rule, secondary = Eivra.Secondary,
            error = Eivra.Red
        ),
        typography = EivraTypography,
        content = content
    )
}

enum class WindowKind { Phone, Tablet }
fun windowKind(widthDp: Int) = if (widthDp >= 840) WindowKind.Tablet else WindowKind.Phone
