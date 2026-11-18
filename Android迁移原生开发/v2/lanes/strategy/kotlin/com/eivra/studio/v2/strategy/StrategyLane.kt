package com.eivra.studio.v2.strategy

import androidx.compose.runtime.Composable
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.LanePending

@Composable fun StrategyScreen(env:StudioEnv) = LanePending(env.dest.route.title)
