package com.eivra.studio.v2

import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.*
import androidx.compose.ui.semantics.*
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import com.eivra.studio.v2.insights.InsightsScreen
import com.eivra.studio.v2.ledger.LedgerScreen
import com.eivra.studio.v2.platform.PlatformScreen
import com.eivra.studio.v2.platform.openPorts
import com.eivra.studio.v2.strategy.StrategyScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Always draw dark system glyphs on the light Inspiration field, even in OS dark mode.
        val bars = SystemBarStyle.light(android.graphics.Color.TRANSPARENT, android.graphics.Color.DKGRAY)
        enableEdgeToEdge(statusBarStyle = bars, navigationBarStyle = bars)
        val ports = openPorts(applicationContext)
        setContent { StudioTheme { StudioHost(ports) } }
    }
}

private fun Dest.token() = route.name + "|" + key.orEmpty().let(Uri::encode)
private fun decode(token: String) = Dest(Route.valueOf(token.substringBefore('|')), token.substringAfter('|', "").takeIf { it.isNotEmpty() }?.let(Uri::decode))

@Composable fun StudioHost(ports: StudioPorts) {
    var stack by rememberSaveable { mutableStateOf(arrayListOf(Dest(Route.New).token())) }
    val saved = rememberSaveableStateHolder()
    val current = stack.last(); val dest = remember(current) { decode(current) }
    val focus = LocalFocusManager.current; val keyboard = LocalSoftwareKeyboardController.current
    val go: (Dest) -> Unit = { next ->
        val token = next.token()
        if (current != token) {
            focus.clearFocus(force = true); keyboard?.hide()
            val before = stack; val after = ArrayList((before + token).takeLast(24)); stack = after
            before.filterNot { it in after }.distinct().forEach(saved::removeState)
        }
    }
    BackHandler(stack.size > 1) {
        focus.clearFocus(force = true); stack = ArrayList(stack.dropLast(1)); if (current !in stack) saved.removeState(current)
    }
    val state by ports.state.collectAsStateWithLifecycle()
    Box(Modifier.fillMaxSize()) {
        MoonScene(Modifier.matchParentSize())
        BoxWithConstraints(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing.union(WindowInsets.ime))) {
            val width = maxWidth.value.toInt()
            Column(Modifier.fillMaxSize()) {
                StudioChrome(dest, width, state, go)
                Box(Modifier.weight(1f).fillMaxWidth().testTag("workspace-${dest.route.name}").semantics { paneTitle = dest.route.title }) {
                    saved.SaveableStateProvider(current) {
                        val env = StudioEnv(dest, width, ports, go)
                        WorkspaceEdition(dest.route) {
                            when (dest.route) {
                                Route.New, Route.Settle -> LedgerScreen(env)
                                Route.Portfolio, Route.Quants -> StrategyScreen(env)
                                Route.Console -> PlatformScreen(env)
                                else -> InsightsScreen(env)
                            }
                        }
                    }
                }
            }
        }
    }
}
