package com.eivra.studio.v2.platform

import com.eivra.studio.v2.api.StudioPorts
import com.eivra.studio.v2.api.WorkspaceState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.nio.file.Files
import java.nio.file.StandardCopyOption.*
import java.security.MessageDigest
import java.util.UUID

// A file is a committed workspace: bundle + drafts + idempotency receipts + revision.
// The process has a single writer. No cached mutable JSONObject is ever published to a reader.
internal class LocalPorts(root: () -> File, private val kernel: (String) -> String) : StudioPorts {
    private val dir by lazy(root)
    private val flow = MutableStateFlow(WorkspaceState())
    override val state = flow.asStateFlow()
    private val lock = Mutex()
    private fun file(mode: String): File {
        require(mode == "demo" || mode == "owner")
        return File(dir, "$mode.json")
    }
    private fun atomic(target: File, obj: JSONObject) {
        Files.createDirectories(dir.toPath())
        val tmp = File.createTempFile("pending-", ".tmp", dir)
        try {
            FileOutputStream(tmp).use { out -> out.write(obj.toString().toByteArray(Charsets.UTF_8)); out.fd.sync() }
            Files.move(tmp.toPath(), target.toPath(), ATOMIC_MOVE, REPLACE_EXISTING)
        } finally { tmp.delete() }
    }
    private fun pointer(): JSONObject {
        val f = File(dir, "active.json")
        return if (f.exists()) JSONObject(f.readText()) else JSONObject().put("mode", "demo").put("floor", 0L)
    }
    private fun invoke(mode: String, bundle: JSONObject?, op: String, args: JSONArray, write: Boolean = false) = kernel(
        JSONObject().put("mode", mode).put("bundle", bundle ?: JSONObject.NULL).put("op", op).put("args", args).put("write", write).toString()
    )
    private fun book(mode: String): JSONObject {
        val f = file(mode)
        if (f.exists()) return JSONObject(f.readText()).also {
            require(it.getInt("schema") == 1 && it.getString("mode") == mode)
            it.getJSONObject("bundle").getJSONArray("investments"); it.getJSONObject("drafts");it.getJSONObject("receipts");it.getLong("revision")
        }
        // Seed in memory only, never persist as a side effect of reading.
        return JSONObject().put("schema", 1).put("mode", mode).put("revision", 0L)
            .put("bundle", JSONObject(invoke(mode, null, "workspace.snapshot", JSONArray())))
            .put("drafts", JSONObject()).put("receipts", JSONObject())
    }
    private fun describe(mode: String, floor: Long, b: JSONObject): WorkspaceState {
        val rows = b.getJSONObject("bundle").getJSONArray("investments")
        return WorkspaceState(mode, maxOf(floor, b.getLong("revision")), (0 until rows.length()).count { rows.getJSONObject(it).optString("status") == "pending" })
    }
    private fun active(): Pair<WorkspaceState, JSONObject> {
        val p = pointer(); val mode = p.getString("mode"); val b = book(mode)
        return describe(mode, p.getLong("floor"), b).also { flow.value = it } to b
    }
    private fun inspect(s: WorkspaceState, b: JSONObject, text:String): JSONObject {
        require(text.toByteArray(Charsets.UTF_8).size <= 16*1024*1024) { "文件超过 16 MiB" }
        val candidate=JSONObject(invoke(s.mode,b.getJSONObject("bundle"),"exchange.inspect",JSONArray().put(text).put(s.mode)))
        if(candidate.getBoolean("native")) { val d=JSONObject(text);require(digest(d.getJSONObject("payload")) == d.getString("sha256")) { "备份校验值不一致" } }
        return candidate
    }
    private fun token(s:WorkspaceState,text:String)=digest(JSONArray().put(s.mode).put(s.revision).put(text))
    suspend fun start() = withContext(Dispatchers.IO) { lock.withLock { active().first } }
    override suspend fun read(op: String, args: JSONArray): String = withContext(Dispatchers.IO) {
        val (s,b) = lock.withLock { active() }
        when(op) {
            "exchange.backup" -> {
                if(args.length()>0) require(args.getString(0)==s.mode && args.getLong(1)==s.revision) { "工作区已变更，请重新导出" }
                val payload=JSONObject().put("mode",s.mode).put("bundle",b.getJSONObject("bundle")).put("drafts",b.getJSONObject("drafts")).put("receipts",b.getJSONObject("receipts"))
                JSONObject().put("format","eivra-native-backup/1").put("exported_at",java.time.Instant.now().toString()).put("payload",payload).put("sha256",digest(payload)).toString()
            }
            "exchange.preflight" -> {
                val text=args.getString(0);val c=inspect(s,b,text);val rows=c.getJSONObject("bundle").getJSONArray("investments")
                JSONObject().put("before",b.getJSONObject("bundle").getJSONArray("investments").length()).put("after",rows.length()).put("pending",(0 until rows.length()).count{rows.getJSONObject(it).getString("status")=="pending"}).put("replacesDrafts",c.getBoolean("native")).put("mode",s.mode).put("revision",s.revision).put("token",token(s,text)).toString()
            }
            "draft.get" -> b.getJSONObject("drafts").getJSONObject(args.getString(0)).toString()
            else -> invoke(s.mode, b.getJSONObject("bundle"), op, args)
        }
    }
    override suspend fun write(op: String, args: JSONArray): String {
        val observedMode = state.value.mode // a queued write must not follow a later workspace switch
        return withContext(Dispatchers.IO) { lock.withLock {
            val (s,b) = active(); require(observedMode == "unavailable" || observedMode == s.mode) { "Workspace changed; reopen form" }
            val next = Math.addExact(s.revision, 1L)
            if (op == "workspace.switch") {
                val target = args.getString(0); val targetBook = if(target == s.mode) b else book(target)
                val switched = if(target == s.mode) s else describe(target, next, targetBook).also {
                    atomic(File(dir,"active.json"),JSONObject().put("mode", target).put("floor", next)); flow.value = it
                }
                return@withLock JSONObject().put("mode", switched.mode).put("revision", switched.revision).toString()
            }
            val drafts = b.getJSONObject("drafts"); val receipts = b.getJSONObject("receipts")
            val value = when (op) {
                "draft.put" -> {
                    val d = JSONObject(args.getJSONObject(0).toString()); require(d.optJSONArray("matches") != null && !d.has("investments")) { "Expected New draft, not workspace" }
                    val id = if(d.has("id")) d.getString("id").also { require(it.isNotBlank()) } else "draft_${UUID.randomUUID()}"
                    val same = drafts.optJSONObject(id)?.let { canonical(it) == canonical(d) } == true
                    if(same) return@withLock JSONObject().put("id", id).toString()
                    drafts.put(id, d); JSONObject().put("id", id)
                }
                "exchange.restore" -> {
                    val text=args.getString(0); require(args.getString(1)==token(s,text)) { "文件或工作区已变更，请重新预检" }
                    val c=inspect(s,b,text); b.put("bundle",c.getJSONObject("bundle"));if(c.getBoolean("native")) b.put("drafts",c.getJSONObject("drafts"))
                    val restored=c.getJSONObject("receipts"); restored.keys().forEach { restored.getJSONObject(it).getJSONObject("result").put("revision",next) };b.put("receipts",restored)
                    JSONObject().put("mode",s.mode).put("revision",next)
                }
                "params.save" -> {
                    if (args.length() > 1) require(args.getLong(1) == s.revision) { "参数已变更，请重新载入" }
                    val result = JSONObject(invoke(s.mode,b.getJSONObject("bundle"),op,args,true))
                    val config = result.getJSONObject("value")
                    if(canonical(config) == canonical(b.getJSONObject("bundle").getJSONObject("system_config"))) return@withLock JSONObject().put("revision",s.revision).toString()
                    b.put("bundle",result.getJSONObject("bundle")); JSONObject().put("revision",next)
                }
                "workspace.saveInvestment", "workspace.importInvestment", "workspace.settleInvestment" -> {
                    val id = if(op.endsWith("settleInvestment")) args.getString(0) else args.getJSONObject(0).getString("id")
                    require(id.isNotBlank()); val key = "$op:$id"; val hash = digest(args)
                    receipts.optJSONObject(key)?.let { old ->
                        require(hash == old.getString("hash")) { "Conflicting request for $id" }; return@withLock old.getJSONObject("result").toString()
                    }
                    val result = JSONObject(invoke(s.mode,b.getJSONObject("bundle"),op,args,true)); b.put("bundle",result.getJSONObject("bundle"))
                    result.getJSONObject("value").put("revision",next).also { receipts.put(key, JSONObject().put("hash", hash).put("result", it)) }
                }
                else -> error("Unregistered write: $op")
            }
            b.put("revision", next); val published = describe(s.mode, next, b); val reply = value.toString()
            atomic(file(s.mode), b); flow.value = published; reply
        } }
    }
}
internal fun canonical(x: Any?): String = when (x) {
    is JSONObject -> x.keys().asSequence().toList().sorted().joinToString(",", "{", "}") { JSONObject.quote(it) + ":" + canonical(x.get(it)) }
    is JSONArray -> (0 until x.length()).joinToString(",", "[", "]") { canonical(x.get(it)) }
    is String -> JSONObject.quote(x)
    is Number -> JSONObject.numberToString(x)
    else -> x.toString()
}
internal fun digest(x: Any): String = MessageDigest.getInstance("SHA-256").digest(canonical(x).toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it) }
