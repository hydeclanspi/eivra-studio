package com.eivra.studio.v2.strategy

import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import java.io.File
import java.util.concurrent.TimeUnit

class I02PinnedDemoTest {
    /** Integration-only on this feature's runner; do not fetch branch dependencies in a user's offline build. */
    @Test fun publicDemoCrossLaneDraft() {
        assumeTrue(System.getenv("EIVRA_I02_DEMO_TEST")=="1" || (System.getenv("GITHUB_ACTIONS")=="true" && System.getenv("GITHUB_REF")=="refs/heads/android-v2/strategy"))
        val script=generateSequence(File(".").canonicalFile){it.parentFile}.map{File(it,"lanes/strategy/checks/i02-demo.sh")}.first{it.isFile}
        val log=File.createTempFile("eivra-demo-probe-",".log")
        try {
            val proc=ProcessBuilder("bash",script.path,File(JSONObject::class.java.protectionDomain.codeSource.location.toURI()).path).redirectErrorStream(true).redirectOutput(log).start()
            if(!proc.waitFor(240,TimeUnit.SECONDS)){proc.destroyForcibly();fail("Temporary integration check timed out")}
            val result=log.readText();assertEquals(result.takeLast(5000),0,proc.exitValue());val receipt=result.lineSequence().single{it.startsWith("I02_REAL_DEMO ")};println(receipt)
        } finally {log.delete()}
    }
}
