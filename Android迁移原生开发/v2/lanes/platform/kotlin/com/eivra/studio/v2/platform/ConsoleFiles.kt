package com.eivra.studio.v2.platform

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.*
import org.json.*
import java.io.ByteArrayOutputStream

private class ReadLocal:ActivityResultContracts.OpenDocument(){
    override fun createIntent(context:Context,input:Array<String>)=super.createIntent(context,input).putExtra(Intent.EXTRA_LOCAL_ONLY,true)
}
private class WriteLocal:ActivityResultContracts.CreateDocument("application/json"){
    override fun createIntent(context:Context,input:String)=super.createIntent(context,input).putExtra(Intent.EXTRA_LOCAL_ONLY,true)
}
private fun readText(context:Context,uri:Uri):String = requireNotNull(context.contentResolver.openInputStream(uri)).use { input ->
    val out=ByteArrayOutputStream();val buf=ByteArray(8192)
    while(true){val n=input.read(buf);if(n<0)break;require(out.size()+n<=16*1024*1024){"文件超过 16 MiB"};out.write(buf,0,n)}
    Charsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(out.toByteArray())).toString()
}
@Composable internal fun ConsoleFiles(env:StudioEnv,state:WorkspaceState,modifier:Modifier=Modifier) {
    val ctx=LocalContext.current;val scope=rememberCoroutineScope();var busy by remember { mutableStateOf(false) }
    var notice by remember(state.mode) { mutableStateOf("") };var contents by remember(state.mode,state.revision){mutableStateOf<String?>(null)}
    var preview by remember(state.mode,state.revision){mutableStateOf<JSONObject?>(null)}
    var modeAtPicker by rememberSaveable { mutableStateOf("") };var revAtPicker by rememberSaveable { mutableLongStateOf(-1L) }
    fun run(action:suspend ()->Unit){if(busy)return;busy=true;scope.launch { try{action()}catch(e:CancellationException){throw e}catch(e:Exception){notice=e.message?:"文件操作失败"}finally{busy=false} } }
    val save=rememberLauncherForActivityResult(WriteLocal()){uri -> if(uri!=null)run {
        withContext(Dispatchers.IO){val bytes=env.ports.read("exchange.backup",JSONArray().put(modeAtPicker).put(revAtPicker)).toByteArray(Charsets.UTF_8);requireNotNull(ctx.contentResolver.openOutputStream(uri,"wt")).use{it.write(bytes)}};notice="本地备份已写入所选文件。"
    } }
    val open=rememberLauncherForActivityResult(ReadLocal()){uri -> if(uri!=null)run {
        val body=withContext(Dispatchers.IO){readText(ctx,uri)};val result=JSONObject(env.ports.read("exchange.preflight",JSONArray().put(body)));require(result.getString("mode")==modeAtPicker&&result.getLong("revision")==revAtPicker){"工作区已变更，请重新选择文件"};contents=body;preview=result;notice="已预检，尚未改账。"
    } }
    GlassPanel(modifier){Text("数据交换",color=Moon.Ink);Text("备份仅包含当前工作区。JSON 未加密，请保存在你选择的本地位置。",color=Moon.Muted)
        StudioAction("导出本地备份",{modeAtPicker=state.mode;revAtPicker=state.revision;save.launch("eivra-${state.mode}-r${state.revision}.json")},enabled=!busy)
        StudioAction("选择文件并预检",{contents=null;preview=null;notice="";modeAtPicker=state.mode;revAtPicker=state.revision;open.launch(arrayOf("application/json","text/plain","application/octet-stream"))},enabled=!busy)
        preview?.let{p->Text("${p.getString("mode")}：${p.getInt("before")} 笔 → ${p.getInt("after")} 笔，含 ${p.getInt("pending")} 笔待结算。${if(p.getBoolean("replacesDrafts")) "草稿也将替换。" else "保留现有草稿。"}",color=Moon.Ink)
            StudioAction("确认替换此工作区",{val raw=contents?:return@StudioAction;run {env.ports.write("exchange.restore",JSONArray().put(raw).put(p.getString("token")));contents=null;preview=null;notice="恢复完成。"}},enabled=!busy)
            StudioPill("取消恢复",false,{preview=null;contents=null;notice="已取消；账本未更改。"}) }
        if(busy||notice.isNotEmpty())Text(if(busy) "正在处理文件…" else notice,color=Moon.Muted)
    }
}
