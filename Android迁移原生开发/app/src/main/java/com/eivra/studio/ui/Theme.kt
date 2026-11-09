package com.eivra.studio.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Inspiration baseline. Values are extracted from the live web styles, not
// Material You dynamic colors; Eivra must not turn into another Android app.
object Eivra {
    val Canvas = Color(0xFFF3F2EE)
    val Surface = Color(0xFFFFFEFF)
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

enum class InspirationMaterial { Folio, Glacier, Prism, Modern }
data class EivraSurface(val canvas: Color, val card: Color, val well: Color, val ink: Color, val muted: Color, val accent: Color, val rim: Color, val radius: Int)
val LocalEivraSurface = staticCompositionLocalOf {
    EivraSurface(Color(0xFFD9D9D5), Color(0xE3F1F0E9), Color(0xADFFFFFA), Color(0xFF393E42), Color(0xFF686D73), Color(0xFF527B93), Color(0xDBFFFFFF), 22)
}
fun inspirationMaterial(route: String) = when {
    route == "new" || route == "combo" -> InspirationMaterial.Folio
    route == "settle" -> InspirationMaterial.Glacier
    route == "teams" -> InspirationMaterial.Modern
    route == "console" -> InspirationMaterial.Modern
    else -> InspirationMaterial.Prism
}

@Composable
fun InspirationTheme(route: String, content: @Composable () -> Unit) {
    val surface = when (inspirationMaterial(route)) {
        InspirationMaterial.Folio -> EivraSurface(Color(0xFFD9D9D5), Color(0xE3F1F0E9), Color(0xADFFFFFA), Color(0xFF393E42), Color(0xFF686D73), Color(0xFF527B93), Color(0xDBFFFFFF), 22)
        InspirationMaterial.Glacier -> EivraSurface(Color(0xFFB6DCE7), Color(0xD6DCF4F6), Color(0xC4EDFBFC), Color(0xFF163E51), Color(0xFF476D7E), Color(0xFF007D9F), Color(0xDBFFFFFF), 26)
        InspirationMaterial.Prism -> EivraSurface(Color(0xFFCEDBE6), Color(0xE0EEF4F9), Color(0x9CFFFFFF), Color(0xFF233747), Color(0xFF5F7383), Color(0xFF3475A7), Color(0xDBFFFFFF), 10)
        InspirationMaterial.Modern -> EivraSurface(Color(0xFFF7F8FA), Color(0xFFFFFFFF), Color(0xFFFFFFFF), Color(0xFF273B35), Color(0xFF71817A), Color(0xFF527B93), Color(0xDBFFFFFF), 18)
    }
    CompositionLocalProvider(LocalEivraSurface provides surface) {
        MaterialTheme(colorScheme = lightColorScheme(primary = surface.accent, onPrimary = Color.White, background = surface.canvas, onBackground = surface.ink, surface = surface.card, onSurface = surface.ink, secondary = surface.muted, outline = surface.accent.copy(alpha = .2f)), typography = EivraTypography, content = content)
    }
}

enum class WindowKind { Phone, Tablet }
fun windowKind(widthDp: Int) = if (widthDp >= 840) WindowKind.Tablet else WindowKind.Phone
