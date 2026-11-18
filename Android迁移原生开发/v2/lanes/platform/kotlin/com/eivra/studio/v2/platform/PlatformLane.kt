package com.eivra.studio.v2.platform

import androidx.compose.runtime.Composable
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.LanePending
import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import org.json.JSONArray

/** No demo responses: an uninstalled kernel fails explicitly. Replace only inside this lane. */
fun openPorts(context: Context): StudioPorts = object : StudioPorts {
    override val state = MutableStateFlow(WorkspaceState())
    override suspend fun read(op:String,args:JSONArray):String = throw UnsupportedOperationException("Kernel not connected: $op")
    override suspend fun write(op:String,args:JSONArray):String = throw UnsupportedOperationException("Kernel not connected: $op")
}

@Composable fun PlatformScreen(env:StudioEnv) = LanePending(env.dest.route.title)
