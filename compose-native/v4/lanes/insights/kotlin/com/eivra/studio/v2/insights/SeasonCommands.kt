package com.eivra.studio.v2.insights

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.*
import org.json.*
import java.util.Locale

@Composable internal fun SeasonRail(b:Block.Choices,choose:(String)->Unit,create:()->Unit){
 Row(Modifier.fillMaxWidth().testTag("season.rail"),horizontalArrangement=Arrangement.spacedBy(10.dp),verticalAlignment=Alignment.CenterVertically){
    val state=rememberLazyListState();LaunchedEffect(b.active,b.options){val at=b.options.indexOfFirst{it.first==b.active};if(at>=0)state.scrollToItem(at)}
    LazyRow(Modifier.weight(1f),state=state,horizontalArrangement=Arrangement.spacedBy(4.dp)){items(b.options,key={it.first}){(id,title)->StudioPill(title,b.active==id,{choose(id)})}}
    TextButton(onClick=create,modifier=Modifier.testTag("season.new").heightIn(min=46.dp).semantics{contentDescription="新建赛季"},contentPadding=PaddingValues(horizontal=10.dp,vertical=4.dp)){Text("＋  新建",color=Moon.Accent,fontSize=13.sp)}
 }
}
@Composable internal fun NewSeasonDialog(env:StudioEnv,openingId:String,onDismiss:()->Unit,onCreated:(String)->Unit){
 val scope=rememberCoroutineScope();val now by env.ports.state.collectAsState();val anchorMode=rememberSaveable{env.ports.state.value.mode};val anchorRevision=rememberSaveable{env.ports.state.value.revision}
 var draft by rememberSaveable{mutableStateOf("")};var amount by rememberSaveable{mutableStateOf("")};var preview by remember{mutableStateOf<JSONObject?>(null)};var error by remember{mutableStateOf("")};var sending by remember{mutableStateOf(false)}
 val stale=now.mode!=anchorMode||now.revision!=anchorRevision
 LaunchedEffect(openingId){try{val p=withContext(Dispatchers.IO){JSONObject(env.ports.read("seasons.preview"))};check(p.getString("from")==openingId){"赛季已变化，请关闭后重新打开"};preview=p}catch(c:CancellationException){throw c}catch(e:Exception){error=e.message?:"读取失败"}}
 val money=amount.trim().ifEmpty{"0"};val valid=money.matches(Regex("[0-9]{1,10}(?:\\.[0-9]{1,2})?")) && draft.length<=24 && draft.none{it.code<32 || it.code==127};val p=preview
 AlertDialog(onDismissRequest={if(!sending)onDismiss()},title={Text("新建赛季",fontSize=21.sp,color=Moon.Ink)},text={Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(10.dp)){
    if(p!=null){Text("结束 ${p.getString("fromName")}，开始 S${p.getInt("nextOrdinal")}。以前的比赛仍在原赛季，待结算记录不会被结算或删除。",fontSize=13.sp,color=Moon.Ink);Text("本期余额 ¥${String.format(Locale.ROOT,"%.2f",p.getDouble("poolBefore"))}   ·   已实现盈亏 ¥${String.format(Locale.ROOT,"%.2f",p.getDouble("realizedProfit"))}",fontSize=12.sp,color=Moon.Muted)}else if(error.isBlank())TideWait("正在读取当前赛季")
    OutlinedTextField(draft,{draft=it.take(24)},modifier=Modifier.fillMaxWidth().testTag("season.title"),label={Text("新赛季标题（可选）")},placeholder={Text("例如 27–28")},singleLine=true,enabled=!sending)
    OutlinedTextField(amount,{amount=it.take(14)},modifier=Modifier.fillMaxWidth().testTag("season.capital"),label={Text("新赛季启动资金（元）")},placeholder={Text("0.00")},singleLine=true,enabled=!sending,keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Decimal))
    Text("新赛季不自动继承旧余额。留空或填 0 即以 ¥0 开始；填写正金额会记一笔新赛季划拨，并计入累计本金。",fontSize=12.sp,lineHeight=18.sp,color=Moon.Muted)
    if(!valid) Text("请输入非负金额，最多两位小数。",color=Moon.Rose);if(error.isNotBlank()||stale&&!sending)Text(if(stale)"账本已更新，请取消后重新预览" else error,color=Moon.Rose,fontSize=13.sp)
 }},dismissButton={TextButton({if(!sending)onDismiss()},enabled=!sending){Text("取消")}},confirmButton={TextButton(onClick={if(!sending&&p!=null&&!stale){sending=true;error="";val spec=JSONObject().put("from",p.getString("from")).put("title",draft.trim()).put("allocation",money).put("confirmClose",true);val g=JSONObject().put("mode",anchorMode).put("revision",anchorRevision);scope.launch{try{val id=JSONObject(env.ports.write("seasons.create",JSONArray().put(spec).put(g))).getString("id");onCreated(id)}catch(c:CancellationException){throw c}catch(e:Exception){error=e.message?:"未确认创建，请重新查看赛季列表"}finally{sending=false}}}},enabled=valid&&!sending&&p!=null&&!stale,modifier=Modifier.testTag("season.confirm")){Text(if(sending)"正在创建…" else "结束当前并创建")}})
}
