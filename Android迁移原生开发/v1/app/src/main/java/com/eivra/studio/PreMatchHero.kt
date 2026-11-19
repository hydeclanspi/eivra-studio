package com.eivra.studio

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Native counterpart of the web PreMatchHero. Only presentation changes here;
 * the parent still owns home_team / away_team and the original model contract.
 * The two tinted panes deliberately remain stacked on a phone, not squeezed
 * into two narrow columns; tablet uses the original three-column composition.
 */
@Composable
fun PreMatchHero(
    home: String,
    away: String,
    onHomeChange: (String) -> Unit,
    onAwayChange: (String) -> Unit,
    tablet: Boolean,
) {
    if (tablet) {
        Row(Modifier.fillMaxWidth().testTag("pre-match-hero"), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
            TeamGlassField("home", "主队", home, onHomeChange, Modifier.weight(1f))
            VersusBadge()
            TeamGlassField("away", "客队", away, onAwayChange, Modifier.weight(1f))
        }
    } else {
        Column(Modifier.fillMaxWidth().testTag("pre-match-hero"), verticalArrangement = Arrangement.spacedBy(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            TeamGlassField("home", "主队", home, onHomeChange, Modifier.fillMaxWidth())
            VersusBadge()
            TeamGlassField("away", "客队", away, onAwayChange, Modifier.fillMaxWidth())
        }
    }
}

@Composable
private fun TeamGlassField(side: String, label: String, value: String, onValueChange: (String) -> Unit, modifier: Modifier) {
    val isHome = side == "home"
    val shape = RoundedCornerShape(20.dp)
    val tint = if (isHome) Color(0xFFFFE2E8) else Color(0xFFDBECFF)
    val border = if (isHome) Color(0x42FB7185) else Color(0x4760A5FA)
    val chipInk = if (isHome) Color(0xFF9F1239) else Color(0xFF1E40AF)
    var focused by remember { mutableStateOf(false) }
    Column(
        modifier
            .testTag("team-pane-$side")
            .shadow(8.dp, shape, ambientColor = tint, spotColor = tint)
            .clip(shape)
            .background(Brush.linearGradient(listOf(tint.copy(alpha = .86f), Color.White.copy(alpha = .52f), tint.copy(alpha = .68f))))
            .border(1.dp, if (focused) border.copy(alpha = .72f) else border, shape)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(9.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(Modifier.clip(CircleShape).background(if (isHome) Color(0xE6FFF1F2) else Color(0xE6EFF6FF)).border(1.dp, border, CircleShape).padding(horizontal = 11.dp, vertical = 3.dp)) {
                Text(label, color = chipInk, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = .7.sp)
            }
            Text(if (value.isBlank()) "输入球队名或缩写" else "已写下这场的判断", color = Color(0x9E57534E), fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Color.White.copy(alpha = if (focused) .50f else .34f)).border(1.dp, if (focused) border else Color(0x99FFFFFF), RoundedCornerShape(16.dp)).padding(horizontal = 10.dp, vertical = 14.dp)) {
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.fillMaxWidth().testTag("field-$label").onFocusChanged { focused = it.isFocused },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                textStyle = TextStyle(fontFamily = FontFamily.Serif, fontSize = 34.sp, lineHeight = 41.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center, color = Color(0xFF292524)),
                cursorBrush = SolidColor(chipInk),
                decorationBox = { inner ->
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        if (value.isEmpty()) Text(label, style = MaterialTheme.typography.headlineMedium, fontFamily = FontFamily.Serif, color = Color(0x8A57534E), textAlign = TextAlign.Center, maxLines = 1, modifier = Modifier.fillMaxWidth())
                        inner()
                    }
                },
            )
        }
    }
}

@Composable
private fun VersusBadge() {
    Box(Modifier.size(40.dp).shadow(4.dp, CircleShape).clip(CircleShape).background(Brush.linearGradient(listOf(Color.White.copy(alpha = .94f), Color(0xFFF5F5F4)))).border(1.dp, Color(0x47A8A29E), CircleShape), contentAlignment = Alignment.Center) {
        Text("VS", color = Color(0xFF78716C), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = .5.sp)
    }
}
