package com.eivra.studio.v2

import android.os.Build
import android.os.Process
import android.util.Log
import androidx.test.platform.app.InstrumentationRegistry
import com.eivra.studio.v2.platform.openPorts
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import java.io.File
import java.security.MessageDigest

class ColdLedgerRead {
    /** Separate instrumentation after `am force-stop`; never seed or write the target record here. */
    @Test fun settledRecordAndFrozenPredictionAreLoadedInNewProcess() = runBlocking {
        val args=InstrumentationRegistry.getArguments();val c=InstrumentationRegistry.getInstrumentation().targetContext
        assumeTrue(args.getString("eivraDisposableDemo")=="true" && (Build.HARDWARE in setOf("ranchu","goldfish") || Build.FINGERPRINT.contains("generic")))
        require(c.packageName=="com.eivra.studio.v2.i03"); val view=requireNotNull(args.getString("studioViewport"));require(view in setOf("390x844","1280x800"))
        val receipt=JSONObject(File(c.cacheDir,"i03-receipt-$view.json").readText());val id=receipt.getString("id")
        assertNotEquals(receipt.getInt("pid"),Process.myPid());val p=openPorts(c);val state=withTimeout(45_000) { p.state.first { it.mode!="unavailable" } };assertEquals("demo",state.mode)
        val all=JSONObject(p.read("workspace.snapshot")).getJSONArray("investments");assertEquals(receipt.getInt("count"),all.length())
        val row=(0 until all.length()).map(all::getJSONObject).single { it.getString("id")==id };val leg=row.getJSONArray("matches").getJSONObject(0)
        assertEquals("win",row.getString("status"));assertEquals("2-1",leg.getString("results"));assertTrue(leg.getBoolean("is_correct"));assertEquals(20.0,row.getDouble("revenues"),0.00001)
        val sha=MessageDigest.getInstance("SHA-256").digest(row.getJSONObject("forecast_snapshot").toString().toByteArray()).joinToString(""){"%02x".format(it)};assertEquals(receipt.getString("frozen"),sha)
        Log.i("EivraCold","viewport=$view new-process=true same-id=$id verified-count=${all.length()} frozen=true score=2-1 revenue=20");Unit
    }
}
