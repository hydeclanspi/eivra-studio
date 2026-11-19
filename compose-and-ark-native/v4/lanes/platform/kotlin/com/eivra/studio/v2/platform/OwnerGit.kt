package com.eivra.studio.v2.platform

import java.io.ByteArrayOutputStream
import java.net.URL
import javax.net.ssl.HttpsURLConnection
import kotlinx.coroutines.*
import org.json.JSONObject

internal class RemoteFault(val status:Int,message:String):Exception(message)
internal class OwnerTicket(val bearer:String,val expires:Long) // deliberately no printable data-class representation
internal data class PushReceipt(val count:Int,val updatedAt:String)
internal typealias GitCall = suspend (path:String, bearer:String?, body:JSONObject?)->Pair<Int,String>
internal class OwnerGit(private val call:GitCall=::eivraHttps,private val now:()->Long={System.currentTimeMillis()/1000}) {
    private suspend fun request(path:String,session:OwnerTicket?,body:JSONObject?):JSONObject {
        if(path!="unlock" && (session==null || session.expires<=now()))throw RemoteFault(401,"会话已到期，请重新连接")
        val (s,text)=call(path,session?.bearer,body)
        if(s !in 200..299) throw RemoteFault(s,when(s){401,403->"凭证无效或已过期，请重新连接";409->"云端版本冲突，未确认提交；请重新拉取";429->"尝试过于频繁，请稍后再连接";else->"同步未获确认（HTTP $s）；本地未更改"})
        val j=try{withContext(Dispatchers.Default){JSONObject(text)}}catch(e:Exception){throw RemoteFault(s,"云端响应不是有效快照；本地未更改")}
        if(j.opt("ok")!=true)throw RemoteFault(s,"云端拒绝了本次操作；没有成功回执")
        return j
    }
    suspend fun unlock(secret:String):OwnerTicket {require(secret.isNotEmpty());val r=request("unlock",null,JSONObject().put("password",secret));val t=r.getString("token");val exp=r.getLong("expSeconds");require(t.isNotBlank()&&!t.any{it.isWhitespace()}&&exp>now()){"无效会话回执"};return OwnerTicket(t,exp)}
    suspend fun pull(t:OwnerTicket):JSONObject?{val r=request("bundle",t,null);require(r.has("bundle")){"云端响应缺少账本字段"};return if(r.isNull("bundle")) null else r.getJSONObject("bundle")}
    suspend fun push(t:OwnerTicket,b:JSONObject):PushReceipt {val r=request("commit-bundle",t,JSONObject().put("snapshot",b));val n=r.getInt("count");val date=r.getString("updated_at");require(n>=0&&date.isNotBlank()){"云端未返回提交凭据，勿直接重试"};return PushReceipt(n,date)}
}
// One user action, one attempt. No follow redirects, no fallback endpoint and no body/token in logs.
private suspend fun eivraHttps(path:String,bearer:String?,body:JSONObject?):Pair<Int,String> = withContext(Dispatchers.IO){
    require(path in setOf("unlock","bundle","commit-bundle"));val conn=URL("https://eivra.vercel.app/api/$path").openConnection() as HttpsURLConnection
    try{conn.instanceFollowRedirects=false;conn.useCaches=false;conn.connectTimeout=10000;conn.readTimeout=23000;conn.setRequestProperty("Accept","application/json");conn.setRequestProperty("Cache-Control","no-store");if(bearer!=null)conn.setRequestProperty("Authorization","Bearer $bearer")
        if(body!=null){val bytes=body.toString().toByteArray(Charsets.UTF_8);require(bytes.size<=16*1024*1024){"快照超过 16 MiB"};conn.requestMethod="POST";conn.doOutput=true;conn.setFixedLengthStreamingMode(bytes.size);conn.setRequestProperty("Content-Type","application/json; charset=utf-8");conn.outputStream.use{it.write(bytes)}}
        val status=conn.responseCode;if(status !in 200..299)return@withContext status to ""
        val bytes=conn.inputStream.use{stream->val out=ByteArrayOutputStream();val b=ByteArray(8192);while(true){currentCoroutineContext().ensureActive();val n=stream.read(b);if(n<0)break;require(out.size()+n<=16*1024*1024){"云端响应超过 16 MiB"};out.write(b,0,n)};out.toString("UTF-8")};status to bytes
    } catch(e:java.io.IOException){throw RemoteFault(0,if(path=="commit-bundle")"网络中断，服务器是否收到了提交尚不确定。先拉取核对，不自动重发。" else "连接未完成，请检查网络；本地数据未改动")} finally{conn.disconnect()}
}
