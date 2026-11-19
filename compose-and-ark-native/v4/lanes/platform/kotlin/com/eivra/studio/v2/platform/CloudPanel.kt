package com.eivra.studio.v2.platform

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.*
import androidx.compose.ui.unit.*
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.window.SecureFlagPolicy
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.*
import org.json.*

internal class CloudMemory { var ticket by mutableStateOf<OwnerTicket?>(null);var status by mutableStateOf("") }
private class Preview(val raw:String,val how:String,val revision:Long,val counts:JSONObject)
@OptIn(ExperimentalLayoutApi::class)
@Composable internal fun CloudPanel(env:StudioEnv,ws:WorkspaceState,mem:CloudMemory){
 val git=remember{OwnerGit()};val scope=rememberCoroutineScope();var busy by remember{mutableStateOf(false)};var dialog by remember(ws){mutableStateOf("")};var secret by remember(dialog){mutableStateOf("")};var preview by remember(ws){mutableStateOf<Preview?>(null)};val connected=mem.ticket!=null
 fun start(f:suspend ()->Unit){if(busy || ws.mode!="owner")return;busy=true;scope.launch{try{check(env.ports.state.value==ws){"工作区已变化"};f()}catch(c:CancellationException){throw c}catch(e:Exception){if(e is RemoteFault && e.status in setOf(401,403))mem.ticket=null;mem.status=e.message?:"同步未获确认"}finally{busy=false}}}
 fun fetch(how:String){preview=null;val t=mem.ticket?:return;start {val b=git.pull(t);if(b==null){mem.status="云端没有快照；本机保留原状";return@start};val (raw,x)=withContext(Dispatchers.Default){val raw=b.toString();raw to JSONObject(env.ports.read("cloud.preview",JSONArray().put(raw).put(how).put(ws.revision)))};check(env.ports.state.value==ws){"本地版本已变，请重新拉取"};preview=Preview(raw,how,ws.revision,x);mem.status="预检完成，尚未改动本机"}}
 GlassPanel(Modifier.fillMaxWidth().testTag("cloud.panel"),18.dp){Text("WORKSPACE    /    GIT",color=Moon.Accent,fontSize=11.sp,letterSpacing=1.sp);Text("云端同步（Git）",color=Moon.Ink,fontSize=19.sp);Text(if(ws.mode!="owner")"演示账本不会联网。切到个人工作区后，可连接官网账本。" else "与官网共用加密的 Git 快照。仅同步账本，不含草稿、研究档案或登录凭据；不会自动上传。",color=Moon.Muted,fontSize=13.sp)
 if(ws.mode=="owner"){
     if(!connected)ConsoleAction("连接官网个人工作区",{dialog="login"},enabled=!busy)
     else {FlowRow(horizontalArrangement=Arrangement.spacedBy(8.dp)){ConsoleAction("合并拉取",{fetch("merge")},enabled=!busy);ConsoleAction("覆盖拉取",{fetch("replace")},enabled=!busy);ConsoleAction("推送本地快照",{dialog="push"},enabled=!busy);ConsoleAction("断开连接",{mem.ticket=null;preview=null;mem.status="已断开；本地账本保留"},enabled=!busy)}}
     preview?.let{p->val v=p.counts;Text("${if(p.how=="merge")"合并" else "覆盖"}预检：本机 ${v.getInt("before")} → ${v.getInt("after")} 笔；更新 ${v.getInt("changed")}，移除 ${v.getInt("removed")}。草稿与研究档案保留。",color=Moon.Ink,fontSize=13.sp);Row{ConsoleAction("确认应用",{start{env.ports.write("cloud.apply",JSONArray().put(p.raw).put(p.how).put(p.revision).put(v.getString("guard")));preview=null;mem.status="已应用到本机；未向云端写入"}},enabled=!busy&&connected,danger=p.how=="replace");TextButton({preview=null},enabled=!busy){Text("放弃")}}}
     if(busy)TideWait("正在与官网同步");if(mem.status.isNotBlank())Text(mem.status,color=Moon.Muted,fontSize=13.sp)
 }
 Text("Time Machine 是单独的历史快照服务，此版未接入。",fontSize=11.sp,color=Moon.Muted)
 }
 if(dialog=="login")AlertDialog(onDismissRequest={dialog=""},properties=DialogProperties(securePolicy=SecureFlagPolicy.SecureOn),title={Text("连接官网账户")},text={Column{Text("口令只发往 eivra.vercel.app。会话只在本次 Console 内存中保存，登录不会拉取或推送。",fontSize=13.sp);OutlinedTextField(secret,{secret=it},label={Text("官网口令")},singleLine=true,visualTransformation=PasswordVisualTransformation(),keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Password))}},confirmButton={TextButton({val s=secret;secret="";dialog="";start {val t=git.unlock(s);check(env.ports.state.value==ws){"工作区已变更"};mem.ticket=t;mem.status="已连接，尚未同步"}},enabled=secret.isNotBlank()){Text("连接")}},dismissButton={TextButton({dialog=""}){Text("取消")}})
 if(dialog=="push")AlertDialog(onDismissRequest={dialog=""},title={Text("推送个人快照？")},text={Text("这会将当前个人账本发送给官网，并按服务器的 Git 合并规则写入云端。其他设备下次拉取可见。")},confirmButton={TextButton({dialog="";val t=mem.ticket;if(t!=null)start {val b=withContext(Dispatchers.IO){JSONObject(env.ports.read("cloud.export",JSONArray().put(ws.revision)))};check(env.ports.state.value==ws){"工作区已变化"};val r=git.push(t,b);mem.status="服务器确认 ${r.count} 笔 · ${r.updatedAt}"}}){Text("确认推送")}},dismissButton={TextButton({dialog=""}){Text("取消")}})
}
