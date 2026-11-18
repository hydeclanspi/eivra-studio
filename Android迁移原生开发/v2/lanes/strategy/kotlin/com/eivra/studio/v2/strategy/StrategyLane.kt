package com.eivra.studio.v2.strategy

import androidx.compose.runtime.*
import com.eivra.studio.v2.api.*

@Composable fun StrategyScreen(env: StudioEnv) {
    val ws by env.ports.state.collectAsState()
    key(env.ports, ws.mode, env.dest.route) {
        when(env.dest.route) {
            Route.Portfolio -> PortfolioDesk(env,ws)
            Route.Quants -> QuantsDesk(env,ws)
            else -> Unit
        }
    }
}
