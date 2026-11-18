package com.eivra.studio.v2.ledger

import androidx.compose.runtime.Composable
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.LanePending

@Composable fun LedgerScreen(env:StudioEnv) = LanePending(env.dest.route.title)
