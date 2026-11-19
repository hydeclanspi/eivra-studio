package com.eivra.studio.v2.ledger

import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.*
import androidx.lifecycle.viewmodel.compose.viewModel
import com.eivra.studio.v2.api.*
import com.eivra.studio.v2.ui.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import java.util.Locale

@Composable fun LedgerScreen(env: StudioEnv) {
    val state by env.ports.state.collectAsState()
    key(env.dest,state.mode) {
        val gateway=remember(env.ports,state.mode) { LedgerGateway(env.ports,state.mode) }
        val session=rememberSaveable { uid() }
        when(env.dest.route) {
            Route.New -> NewSheet(env,gateway,state,viewModel<NewEditorViewModel>(key="new-$session").editor)
            Route.Settle -> SettleSheet(env,gateway,state,viewModel<SettleEditorViewModel>(key="settle-$session").editor)
            else -> Unit
        }
    }
}
internal fun fmt(n: Double, digits: Int=2) = String.format(Locale.ROOT,"%.${digits}f",n)
@Composable internal fun Caption(s: String, color: Color=Moon.Muted){ Text(s,fontSize=12.sp,lineHeight=18.sp,color=color) }
@Composable internal fun Section(s: String,color: Color=Moon.Ink){Text(s,color=color,fontSize=16.sp,lineHeight=22.sp,fontWeight=FontWeight.SemiBold)}
@Composable internal fun SmallButton(s: String, onClick:()->Unit, tag: String="", enabled: Boolean=true, ink: Color=Moon.Accent) {
    TextButton(onClick=onClick,enabled=enabled,modifier=Modifier.heightIn(min=44.dp).then(if(tag.isEmpty()) Modifier else Modifier.testTag(tag)), contentPadding=PaddingValues(horizontal=9.dp,vertical=4.dp)) { Text(s,color=if(enabled) ink else Moon.Muted.copy(alpha=.55f),fontSize=13.sp) }
}
@Composable internal fun Edit(label: String, value: String, change: (String)->Unit, tag: String, modifier: Modifier=Modifier,
                            hint: String="", numeric: Boolean=false, multi: Boolean=false, large: Boolean=false, showLabel: Boolean=true) {
    val source=remember { MutableInteractionSource() }; val focused by source.collectIsFocusedAsState();val focus=LocalFocusManager.current
    val shape=RoundedCornerShape(if(large) 14.dp else 10.dp); val size=if(large) 22.sp else 15.sp
    Column(modifier,verticalArrangement=Arrangement.spacedBy(4.dp)) {
        if(showLabel) Caption(label)
        BasicTextField(value,change,interactionSource=source,modifier=Modifier.fillMaxWidth().testTag(tag).semantics { contentDescription=label },
            singleLine=!multi,minLines=if(multi) 2 else 1,maxLines=if(multi) 5 else 1,
            textStyle=TextStyle(color=Moon.Ink,fontSize=size,lineHeight=if(large) 28.sp else 20.sp,fontWeight=if(large) FontWeight.SemiBold else FontWeight.Normal),
            keyboardOptions=KeyboardOptions(keyboardType=if(numeric) KeyboardType.Decimal else KeyboardType.Text,imeAction=if(multi) ImeAction.Default else ImeAction.Next),
            keyboardActions=KeyboardActions(onNext={if(!focus.moveFocus(FocusDirection.Next)) focus.clearFocus()}),cursorBrush=SolidColor(Moon.Accent),
            decorationBox={ inner -> Box(Modifier.fillMaxWidth().heightIn(min=if(multi) 70.dp else 46.dp).background(Color.White.copy(alpha=.70f),shape)
                .border(if(focused) 1.4.dp else .8.dp,if(focused) Moon.Accent else Moon.Rule,shape).padding(horizontal=11.dp,vertical=9.dp),contentAlignment=if(multi) Alignment.TopStart else Alignment.CenterStart){
                if(value.isEmpty()) Text(hint,fontSize=size,lineHeight=21.sp,color=Moon.Muted.copy(alpha=.72f));inner()
            }})
    }
}
@Composable private fun NewSheet(env: StudioEnv,g: LedgerGateway,state: WorkspaceState,s: EditSession) {
    LaunchedEffect(g,env.dest.key){s.enter(g,env.dest.key)}
    val t=s.ticket; val pre=t.stage==Stage.Pre; val wide=env.widthDp>=1101; val pad=if(wide) ((env.widthDp-1084)/2).coerceAtLeast(24).dp else 14.dp
    val receipt=s.receipt; var forwarded by rememberSaveable { mutableStateOf<String?>(null) }
    if(receipt!=null) {
        LaunchedEffect(receipt){if(forwarded!=receipt){forwarded=receipt;env.go(Dest(Route.Settle,receipt))}}
        Column(Modifier.padding(pad)){GlassPanel { Section("已保存这笔记录");Caption(receipt);StudioAction("进入这笔结算",{env.go(Dest(Route.Settle,receipt))});SmallButton("新建下一笔",{s.another()}) }};return
    }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).testTag("ledger-new-scroll").padding(horizontal=pad,vertical=16.dp),verticalArrangement=Arrangement.spacedBy(if(wide) 20.dp else 12.dp)) {
        val title: @Composable ()->Unit={PageHeading("新建投资",if(pre) "投前研判 · 登记我对这场的观点" else "投后导入 · 登记实际发生的投入，不回填投前预测")}
        val tabs: @Composable ()->Unit={Row(Modifier.background(Color.White.copy(alpha=.42f),RoundedCornerShape(14.dp)).padding(2.dp)) {
            StudioPill("投前研判",pre,{s.edit(t.copy(stage=Stage.Pre))},Modifier.testTag("stage-pre"));StudioPill("投后导入",!pre,{s.edit(t.copy(stage=Stage.Post))},Modifier.testTag("stage-post")) }}
        if(wide) Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){title();tabs()} else {title();tabs()}
        HorizontalDivider(color=Moon.Rule)
        if(!s.ready) {
            if(s.loading) TideWait("正在计算投前预览")
            Caption(s.message.ifBlank { "正在读取草稿…" });if(!s.loading && s.message.isNotEmpty()) SmallButton("重新读取草稿",{s.enter(g,env.dest.key)});return@Column
        }
        QuickInput(s,g)
        val main: @Composable (Modifier)->Unit={mod -> MatchesPanel(s,g,mod,if(wide) 22.dp else 14.dp)}
        val side: @Composable (Modifier)->Unit={mod -> StrategyPanel(s,mod,if(wide) 22.dp else 14.dp,state.mode=="demo")}
        if(wide) Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(24.dp),verticalAlignment=Alignment.Top){
            if(pre){side(Modifier.weight(4f));main(Modifier.weight(6f))}else{main(Modifier.weight(6f));side(Modifier.weight(4f))}
        }else{main(Modifier.fillMaxWidth());side(Modifier.fillMaxWidth())}
        FeedbackAndSave(s,g,state)
        Spacer(Modifier.height(16.dp))
    }
}
@Composable private fun QuickInput(s: EditSession,g: LedgerGateway){
    var open by rememberSaveable { mutableStateOf(true) };val t=s.ticket
    StudioSurface(Modifier.fillMaxWidth().testTag("quick-panel"),kind=GlassKind.QuickInput,padding=0.dp){
        Column(Modifier.fillMaxWidth()){
        QuickHeading(open){open=!open}
        if(open){HorizontalDivider(thickness=.55.dp,color=Color(0x1CB99D6D));Column(Modifier.fillMaxWidth().padding(start=16.2.dp,end=16.2.dp,top=9.dp,bottom=14.4.dp),verticalArrangement=Arrangement.spacedBy(7.2.dp)){
            QuickField(t.quick){s.edit(t.copy(quick=it))}
            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(9.dp)){
                SmallButton(if(s.parsing) "解析中…" else "解析并填入",{s.parse(g)},"parse",enabled=t.quick.isNotBlank()&&!s.parsing&&!s.writing);Text("在本机解析",color=Color(0xFF9A815B),fontSize=10.sp)
            }
            s.parsed?.let { p -> HorizontalDivider(color=Moon.Rule);Caption("解析到 ${p.ticket.legs.size} 场："+p.ticket.legs.joinToString("；") { "${it.home} / ${it.away}" });if(p.diagnostics.isNotBlank()) Caption(p.diagnostics);Caption("填入会替换当前场次，Conf 仍由你确认。");Row { SmallButton("填入此草稿",s::acceptParsed,"apply-parse");SmallButton("保留原稿",s::dismissParsed) } }
            if(s.message.startsWith("未能解析")) Caption(s.message,Moon.Rose)
        }}
        }
    }
}
@Composable private fun FeedbackAndSave(s: EditSession,g: LedgerGateway,state: WorkspaceState) {
    val t=s.ticket; val pre=t.stage==Stage.Pre;val problem=t.issue(false)
    var retry by remember { mutableIntStateOf(0) }
    var preview by remember(g,t.legs,t.stage,state.revision,retry) { mutableStateOf<Preview?>(null) }
    var fault by remember(g,t.legs,t.stage,state.revision,retry) { mutableStateOf("") }
    LaunchedEffect(g,t.legs,t.stage,state.revision,retry){if(pre && problem==null){delay(320);try{preview=g.predict(t)}catch(e: CancellationException){throw e}catch(e: Exception){fault=e.message ?: "预测不可用"}}}
    val p=preview;val writable=canWrite(state.mode);val focus=LocalFocusManager.current
    val err=t.issue(true)
    // Surface the same decision that gates the write. Error states must not look like perpetual loading.
    val gateText = when {
        !writable -> "工作区还未可写"
        s.writing -> "正在保存"
        err != null -> err
        pre && fault.isNotBlank() -> "模型没有生成可冻结的预测：$fault"
        pre && p == null -> "正在计算本次判断"
        else -> "可保存"
    }
    GlassPanel(Modifier.fillMaxWidth().testTag("ledger-actions").semantics { stateDescription=gateText },padding=18.dp){
        val feedback:@Composable (Modifier)->Unit={mod -> Column(mod){
            if(pre){
                Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp)){
                    listOf("综合 Odds" to (p?.let { fmt(it.odds) } ?: "—"),"Expected Rating" to (p?.let { fmt(it.mean) } ?: "—"),"Recom. Invest" to (p?.let { "¥ ${fmt(it.suggested)}" } ?: "—")).forEachIndexed { ix,(label,v)->
                        if(ix>0) VerticalDivider(Modifier.height(35.dp),color=Moon.Rule)
                        Column(Modifier.weight(1f)){Text(label,fontSize=11.sp,lineHeight=15.sp,color=Moon.Muted);Text(v,color=if(ix==2) Moon.Accent else Moon.Ink,fontSize=18.sp,lineHeight=23.sp,fontWeight=FontWeight.SemiBold)}
                    }
                }
                Caption(if(p==null) problem ?: fault.ifBlank { "正在计算本次判断…" } else "Rating 为单场均值 · 整票命中概率 ${fmt(p.hit*100,1)}%")
                if(fault.isNotBlank()) SmallButton("重算模型",{retry++})
            }else Caption("投后导入只登记实际投入，不回填投前快照。")
        }}
        val actions:@Composable ()->Unit={Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)){
            Column(Modifier.widthIn(max=106.dp)){Caption("Inputs 实际投资");LedgerInput("实际投资",t.amount,{s.edit(t.copy(amount=it))},"stake",Modifier.fillMaxWidth(),"金额",numeric=true)}
            Column(horizontalAlignment=Alignment.CenterHorizontally){
                StudioAction(if(s.writing) "正在写入…" else if(pre) "确认投资" else "保存投后记录",{focus.clearFocus();s.submit(g)},Modifier.testTag("save"),enabled=writable && !s.writing && err==null && (!pre || p!=null))
                SmallButton("存草稿",{focus.clearFocus();s.submit(g,true)},"checkpoint",writable && !s.writing)
            }
        }}
        BoxWithConstraints(Modifier.fillMaxWidth()){
            if(maxWidth>=680.dp) Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(22.dp),verticalAlignment=Alignment.CenterVertically){feedback(Modifier.weight(1f));actions()}
            else Column(verticalArrangement=Arrangement.spacedBy(10.dp)){feedback(Modifier.fillMaxWidth());actions()}
        }
        if(!writable) Caption("当前工作区不可写；可以继续编辑，不能落账。",Moon.Rose)
        if(err!=null && (!pre || err!=problem)) Caption(err)
        if(s.message.isNotBlank() && !s.message.startsWith("未能解析")) Caption(s.message,if(s.message.startsWith("草稿已保存")) Moon.Accent else Moon.Rose)
    }
}
