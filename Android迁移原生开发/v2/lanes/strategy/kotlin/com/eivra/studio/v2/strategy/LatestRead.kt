package com.eivra.studio.v2.strategy

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

internal sealed interface ReadState<out T> {
    data object Idle : ReadState<Nothing>
    data object Loading : ReadState<Nothing>
    data class Value<T>(val data: T) : ReadState<T>
    data class Failed(val message: String) : ReadState<Nothing>
}

/** One slot per screen resource. Never wait for a non-cooperative JS call on the UI thread. */
internal class LatestRead<T>(private val scope: CoroutineScope, private val worker: CoroutineDispatcher=Dispatchers.Default) {
    private var epoch = 0L
    private var job: Job? = null
    private val result = MutableStateFlow<ReadState<T>>(ReadState.Idle)
    val state = result.asStateFlow()

    @Synchronized fun invalidate() {
        epoch++
        job?.cancel()
        result.value = ReadState.Idle
    }
    @Synchronized fun start(debounceMs: Long=0L, block: suspend () -> T) {
        invalidate()
        val serial = epoch
        result.value = ReadState.Loading
        job = scope.launch {
            try {
                if(debounceMs>0) delay(debounceMs)
                val value = withContext(worker) { block() }
                publish(serial, ReadState.Value(value))
            } catch(cancel: CancellationException) { throw cancel }
            catch(e: Exception) { publish(serial,ReadState.Failed(e.message ?: "读取失败")) }
        }
    }
    @Synchronized private fun publish(serial: Long, next: ReadState<T>) { if(serial==epoch) result.value=next }
}
