package com.eivra.studio.v2.strategy

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp

/** Size against the safe viewport, then cap by actual host space. Never add a second page gutter. */
@Composable internal fun StrategyFrame(viewport: Int, portfolio: Boolean, content: @Composable () -> Unit) {
    BoxWithConstraints(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        val shell = minOf(viewport.toFloat(), 1188f)
        val inset = when {
            viewport < 640 -> 10.8f
            viewport < 1024 -> 21.6f
            else -> (viewport * .027f).coerceIn(21.6f, 43.2f)
        }
        val width = minOf(maxWidth, (shell - 2 * inset).coerceAtLeast(1f).dp)
        Box(Modifier.width(width).fillMaxHeight().padding(top = if (viewport < 640) 21.6.dp else 28.8.dp)
            .testTag(if (portfolio) "portfolio.frame" else "quants.frame")) { content() }
    }
}
