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
    private val seeds = mutableMapOf<String,String>() // guarded by lock; never mutated, never a write on read
    private val reads = object : LinkedHashMap<String,String>(20,.75f,true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String,String>?) = size > 16
    }
    private val stable = setOf("params.get", "portfolio.candidates", "quant.home", "quant.archive", "matchResults.getResultsIndex", "quantResearch.getResearchStore", "quantEvidence.getEvidenceStore", "quantForward.getForwardStore", "analytics.getExpectedVsActualRows")
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
    private fun invoke(mode: String, bundle: JSONObject?, op: String, args: JSONArray, write: Boolean = false, notes:JSONObject?=null) = kernel(
        JSONObject().put("mode", mode).put("bundle", bundle ?: JSONObject.NULL).put("op", op).put("args", args).put("write", write).put("notebook",notes ?: JSONObject()).toString()
    )
    private fun book(mode: String): JSONObject {
        val f = file(mode)
        if (f.exists()) return JSONObject(f.readText()).also {
            require(it.getInt("schema") == 1 && it.getString("mode") == mode)
            it.getJSONObject("bundle").getJSONArray("investments"); it.getJSONObject("drafts");it.getJSONObject("receipts");it.getLong("revision")
        }
        // Seed in memory only, never persist as a side effect of reading.
        return JSONObject().put("schema", 1).put("mode", mode).put("revision", 0L)
            .put("bundle", JSONObject(seeds.getOrPut(mode){invoke(mode, null, "workspace.snapshot", JSONArray())}))
            .put("drafts", JSONObject()).put("receipts", JSONObject())
    }
    private fun describe(mode: String, floor: Long, b: JSONObject): WorkspaceState {
        val rows = b.getJSONObject("bundle").getJSONArray("investments")
        return WorkspaceState(mode, maxOf(floor, b.getLong("revision")), (0 until rows.length()).count { rows.getJSONObject(it).optString("status") == "pending" })
    }
    private data class Stamp(val identity:String?,val size:Long,val modified:java.nio.file.attribute.FileTime)
    private data class View(val mode:String,val floor:Long,val stamp:Stamp?,val s:WorkspaceState,val book:JSONObject)
    @Volatile private var view:View?=null // guarded by lock; readers never mutate this tree, writer never receives it
    private fun readView():Pair<WorkspaceState,JSONObject>{
        val ptr=pointer();val mode=ptr.getString("mode");val floor=ptr.getLong("floor");val f=file(mode)
        val a=try{Files.readAttributes(f.toPath(),java.nio.file.attribute.BasicFileAttributes::class.java)}catch(e:java.nio.file.NoSuchFileException){null}
        val stamp=a?.let{Stamp(it.fileKey()?.toString(),it.size(),it.lastModifiedTime())};val prev=view
        if(prev!=null && prev.mode==mode && prev.floor==floor && prev.stamp==stamp)return prev.s to prev.book
        val b=book(mode);val s=describe(mode,floor,b);view=View(mode,floor,stamp,s,b);synchronized(reads){reads.clear()};flow.value=s;return s to b
    }
    private fun active(): Pair<WorkspaceState, JSONObject> {
        val p = pointer(); val mode = p.getString("mode"); val b = book(mode)
        return describe(mode, p.getLong("floor"), b).also { flow.value = it } to b
    }
    private fun inspect(s: WorkspaceState, b: JSONObject, text:String): JSONObject {
        require(text.toByteArray(Charsets.UTF_8).size <= 16*1024*1024) { "文件超过 16 MiB" }
        val candidate=JSONObject(invoke(s.mode,b.getJSONObject("bundle"),"exchange.inspect",JSONArray().put(text).put(s.mode)))
        if(candidate.getBoolean("native")) { val d=JSONObject(text);require(digest(d.getJSONObject("payload")) == d.getString("sha256")) { "备份校验值不一致" } }
        if(candidate.getBoolean("native")) invoke(s.mode,candidate.getJSONObject("bundle"),"quant.validate",JSONArray(),notes=candidate.optJSONObject("notebook"))
        return candidate
    }
    private fun cloud(s:WorkspaceState,b:JSONObject,a:JSONArray):JSONObject {
        require(s.mode=="owner" && a.getLong(2)==s.revision) { "个人工作区已变化，请重新拉取" }
        val text=a.getString(0);val how=a.getString(1);require(how=="merge" || how=="replace")
        val c=inspect(s,b,text);require(!c.getBoolean("native")){"云端只接受 Web 账本快照"};val remote=c.getJSONObject("bundle")
        return if(how=="replace")remote else JSONObject(invoke(s.mode,b.getJSONObject("bundle"),"cloud.merge",JSONArray().put(remote)))
    }
    private fun token(s:WorkspaceState,text:String)=digest(JSONArray().put(s.mode).put(s.revision).put(text))
    suspend fun start() = withContext(Dispatchers.IO) { lock.withLock { readView().first } }
    override suspend fun read(op: String, args: JSONArray): String = withContext(Dispatchers.IO) {
        val (s,b) = lock.withLock { readView() }
        when(op) {
            "cloud.export" -> {require(s.mode=="owner" && args.getLong(0)==s.revision){"仅可同步已确认的个人工作区"};b.getJSONObject("bundle").toString()}
            "cloud.preview" -> {val candidate=cloud(s,b,args);val rows=candidate.getJSONArray("investments");val before=b.getJSONObject("bundle").getJSONArray("investments");val ids=(0 until rows.length()).associateBy{rows.getJSONObject(it).getString("id")};val removed=(0 until before.length()).count{!ids.containsKey(before.getJSONObject(it).getString("id"))}; val changed=(0 until before.length()).count{i->val row=before.getJSONObject(i);ids[row.getString("id")]?.let{canonical(row)!=canonical(rows.getJSONObject(it))}==true};JSONObject().put("before",before.length()).put("after",rows.length()).put("removed",removed).put("changed",changed).put("guard",token(s,args.toString())).toString()}
            "workspace.snapshot" -> b.getJSONObject("bundle").toString()
            "exchange.backup" -> {
                if(args.length()>0) require(args.getString(0)==s.mode && args.getLong(1)==s.revision) { "工作区已变更，请重新导出" }
                val payload=JSONObject().put("mode",s.mode).put("bundle",b.getJSONObject("bundle")).put("drafts",b.getJSONObject("drafts")).put("receipts",b.getJSONObject("receipts")).put("notebook",b.optJSONObject("notebook") ?: JSONObject())
                JSONObject().put("format","eivra-native-backup/1").put("exported_at",java.time.Instant.now().toString()).put("payload",payload).put("sha256",digest(payload)).toString()
            }
            "exchange.preflight" -> {
                val text=args.getString(0);val c=inspect(s,b,text);val rows=c.getJSONObject("bundle").getJSONArray("investments")
                JSONObject().put("before",b.getJSONObject("bundle").getJSONArray("investments").length()).put("after",rows.length()).put("pending",(0 until rows.length()).count{rows.getJSONObject(it).getString("status")=="pending"}).put("replacesDrafts",c.getBoolean("native")).put("mode",s.mode).put("revision",s.revision).put("token",token(s,text)).toString()
            }
            "draft.get" -> b.getJSONObject("drafts").getJSONObject(args.getString(0)).toString()
            else -> {
                val cacheKey=if(op in stable) "${s.mode}:${s.revision}:${java.time.LocalDate.now()}:$op:$args" else null
                val hit=cacheKey?.let { synchronized(reads){if(view?.book===b)reads[it] else null} };hit ?: invoke(s.mode,b.getJSONObject("bundle"),op,args,notes=b.optJSONObject("notebook")).also { value ->
                    if(cacheKey!=null && value.length<=180_000 && state.value==s) synchronized(reads){if(view?.book===b)reads[cacheKey]=value}
                }
            }
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
                    atomic(File(dir,"active.json"),JSONObject().put("mode", target).put("floor", next)); view=null; synchronized(reads){reads.clear()}; flow.value = it
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
                    val c=inspect(s,b,text); b.put("bundle",c.getJSONObject("bundle"));if(c.getBoolean("native")) { b.put("drafts",c.getJSONObject("drafts"));b.put("notebook",c.optJSONObject("notebook") ?: JSONObject()) }
                    val restored=c.getJSONObject("receipts"); restored.keys().forEach { restored.getJSONObject(it).getJSONObject("result").put("revision",next) };b.put("receipts",restored)
                    JSONObject().put("mode",s.mode).put("revision",next)
                }
                "cloud.apply" -> {
                    val req=JSONArray().put(args.getString(0)).put(args.getString(1)).put(args.getLong(2));require(token(s,req.toString())==args.getString(3)){"预检已失效"};val merged=cloud(s,b,req)
                    val before=b.getJSONObject("bundle").getJSONArray("investments");val rows=merged.getJSONArray("investments");val old=(0 until before.length()).associate{before.getJSONObject(it).let{r->r.getString("id") to r}};val unchanged=(0 until rows.length()).map{rows.getJSONObject(it)}.filter{r->old[r.getString("id")]?.let{canonical(it)==canonical(r)}==true}.map{it.getString("id")}.toSet()
                    receipts.keys().asSequence().toList().filter{receipts.getJSONObject(it).getJSONObject("result").getString("id") !in unchanged}.forEach(receipts::remove)
                    b.put("bundle",merged);JSONObject().put("count",rows.length()).put("revision",next)
                }
                "quantResearch.createResearchExperiment", "quantResearch.saveResearchConclusion", "quantForward.createObservationPlan", "quantForward.runForwardTask", "quant.importEvidence", "quant.importResults" -> {
                    val guard=args.getJSONObject(args.length()-1);require(guard.getString("workspace")==s.mode && guard.getLong("revision")==s.revision){"研究工作区已变更，请重读"}
                    val input=JSONArray().apply{for(i in 0 until args.length()-1)put(args.get(i))};val result=JSONObject(invoke(s.mode,b.getJSONObject("bundle"),op,input,true,b.optJSONObject("notebook")))
                    b.put("notebook",result.getJSONObject("notebook"));result.getJSONObject("value")
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
                    require(id.isNotBlank()); val key = "$op:$id"
                    // New assigns a fresh clock on each button tap. Preserve the FIRST stored time;
                    // retry the same pre intent, but reject different odds, stake, opinions, etc.
                    val hash = if(op == "workspace.saveInvestment") digest(JSONArray().put(JSONObject(args.getJSONObject(0).toString()).also { it.remove("created_at") })) else digest(args)
                    receipts.optJSONObject(key)?.let { old ->
                        require(hash == old.getString("hash") || digest(args) == old.getString("hash")) { "Conflicting request for $id" }; return@withLock old.getJSONObject("result").toString()
                    }
                    val result = JSONObject(invoke(s.mode,b.getJSONObject("bundle"),op,args,true)); b.put("bundle",result.getJSONObject("bundle"))
                    result.getJSONObject("value").put("revision",next).also { receipts.put(key, JSONObject().put("hash", hash).put("result", it)) }
                }
                else -> error("Unregistered write: $op")
            }
            b.put("revision", next); val published = describe(s.mode, next, b); val reply = value.toString()
            atomic(file(s.mode), b); view=null; synchronized(reads){reads.clear()}; flow.value = published; reply
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
