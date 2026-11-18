package com.eivra.studio.v2.platform

import android.content.Context
import androidx.compose.runtime.Composable
import app.cash.quickjs.QuickJs
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.PageHeading
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.File

private var instance: LocalPorts? = null
@Synchronized fun openPorts(context: Context): StudioPorts {
    val app = context.applicationContext
    return instance ?: makeLocalPorts({ File(app.noBackupFilesDir, "eivra-v2-workspaces") }) {
        app.assets.open("platform-kernel.js").bufferedReader(Charsets.UTF_8).use { it.readText() }
    }.also { ports ->
        instance = ports
        CoroutineScope(Dispatchers.IO).launch { runCatching { ports.start() } }
    }
}

internal fun makeLocalPorts(root: () -> File, script: () -> String): LocalPorts {
    val source by lazy(script)
    return LocalPorts(root) { request ->
        // One unshared realm per transaction. No host objects, credentials, storage handles or JS from callers.
        QuickJs.create().use { js ->
            js.evaluate(source)
            js.evaluate("eivraPlatform.call(" + JSONObject.quote(request) + ")") as String
        }
    }
}

@Composable fun PlatformScreen(env: StudioEnv) = LocalConsole(env)
