package com.eivra.studio.ui

import androidx.compose.foundation.background
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.draw.shadow
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.platform.testTag

@Composable
fun GlassCard(modifier: Modifier = Modifier, padding: Dp = 22.dp, content: @Composable ColumnScope.() -> Unit) {
    val surface = LocalEivraSurface.current
    val shape = RoundedCornerShape(topStart = 7.dp, topEnd = surface.radius.dp, bottomEnd = 7.dp, bottomStart = 7.dp)
    Column(modifier.shadow(9.dp, shape, ambientColor = surface.ink.copy(alpha = .08f), spotColor = surface.ink.copy(alpha = .07f))
        .clip(shape)
        .background(Brush.linearGradient(listOf(surface.card, surface.well.copy(alpha = .72f), surface.card)))
        .border(0.5.dp, surface.rim, shape)
        .padding(padding), verticalArrangement = Arrangement.spacedBy(14.dp), content = content)
}

@Composable
fun Eyebrow(text: String, modifier: Modifier = Modifier) {
    Text(text.uppercase(), modifier = modifier, style = MaterialTheme.typography.labelMedium, color = LocalEivraSurface.current.muted, letterSpacing = 1.4.sp)
}

@Composable
fun EivraButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, icon: ImageVector? = null, subtle: Boolean = false, enabled: Boolean = true) {
    Button(onClick = onClick, modifier = modifier.heightIn(min = 44.dp), enabled = enabled,
        colors = ButtonDefaults.buttonColors(containerColor = if (subtle) Eivra.Mint else LocalEivraSurface.current.accent, contentColor = if (subtle) Eivra.Ink else Color.White),
        shape = RoundedCornerShape(13.dp), contentPadding = PaddingValues(horizontal = 17.dp, vertical = 10.dp)) {
        if (icon != null) { Icon(icon, null, modifier = Modifier.size(16.dp)); Spacer(Modifier.width(7.dp)) }
        Text(text, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun Metric(label: String, value: String, note: String? = null, modifier: Modifier = Modifier, accent: Color = Eivra.Ink) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Eyebrow(label)
        Text(value, style = MaterialTheme.typography.titleLarge, color = accent)
        if (note != null) Text(note, style = MaterialTheme.typography.bodyMedium, color = LocalEivraSurface.current.muted)
    }
}

@Composable
fun LabeledField(label: String, value: String, onValueChange: (String) -> Unit, hint: String = "", modifier: Modifier = Modifier, numeric: Boolean = false) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(7.dp)) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = LocalEivraSurface.current.muted)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(hint) },
            singleLine = true,
            textStyle = MaterialTheme.typography.bodyLarge,
            shape = RoundedCornerShape(7.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedContainerColor = Color.White.copy(alpha = .7f),
                focusedContainerColor = Color.White,
                unfocusedBorderColor = Eivra.Rule,
                focusedBorderColor = LocalEivraSurface.current.accent
            ),
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("field-$label")
        )
    }
}

@Composable
fun ChoiceRow(options: List<String>, selected: String, onSelect: (String) -> Unit, modifier: Modifier = Modifier) {
    Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(7.dp)) {
        options.forEach { item ->
            val active = item == selected
            Box(Modifier.weight(1f).heightIn(min = 38.dp).clip(RoundedCornerShape(10.dp)).background(if (active) Eivra.Mint else Color.Transparent).border(1.dp, if (active) LocalEivraSurface.current.accent.copy(alpha = .35f) else Eivra.Rule, RoundedCornerShape(10.dp)).clickable { onSelect(item) }.padding(horizontal = 5.dp, vertical = 9.dp), contentAlignment = Alignment.Center) {
                Text(item, style = MaterialTheme.typography.bodyMedium, color = if (active) LocalEivraSurface.current.accent else Eivra.Secondary, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
fun SectionHeading(index: String, title: String, subtitle: String? = null) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(28.dp).clip(RoundedCornerShape(9.dp)).background(Eivra.Mint), contentAlignment = Alignment.Center) { Text(index, color = LocalEivraSurface.current.accent, style = MaterialTheme.typography.bodyMedium) }
        Column { Text(title, style = MaterialTheme.typography.titleMedium); if (subtitle != null) Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = LocalEivraSurface.current.muted) }
    }
}

@Composable
fun PageIntro(eyebrow: String, title: String, description: String) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Eyebrow(eyebrow)
        Text(title, style = MaterialTheme.typography.displaySmall, color = LocalEivraSurface.current.ink, modifier = Modifier.testTag("page-title"))
        Text(description, style = MaterialTheme.typography.bodyMedium, color = LocalEivraSurface.current.muted)
    }
}
