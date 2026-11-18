package com.eivra.studio.v2.insights

import androidx.compose.runtime.Composable
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.LanePending

@Composable fun InsightsScreen(env:StudioEnv) = LanePending(env.dest.route.title)
