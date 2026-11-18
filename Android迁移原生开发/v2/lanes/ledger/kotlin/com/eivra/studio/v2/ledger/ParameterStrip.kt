package com.eivra.studio.v2.ledger

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.ui.Moon
import kotlin.math.roundToInt

private val modes=linkedMapOf("常规" to "Directional", "常规-稳" to "Relative-Value", "常规-杠杆" to "Trend", "常规-激进" to "常规-激进", "半彩票半保险" to "Risk-Reversal", "保险产品" to "Tail-Risk", "赌一把" to "High-Conviction")
private val beta=listOf("S","M","L","H")
private val gamma=listOf("0","0.25","0.4","0.6","0.75")
private val alpha=listOf("0.2","0.4","0.5","0.6","0.8")
private val delta=(1..8).map { "0.$it" }
private val picked=Color(0xFF4F46E5)

@Composable private fun Label(s:String){Text(s,fontSize=11.sp,lineHeight=15.sp,color=Moon.Muted)}

/** Each mark owns its full cell, not just the small painted lozenge. Keep a 44x48 target;
 * on a genuinely narrow card the group pans rather than overlapping focus or touch bounds. */
@Composable private fun Marks(label:String,values:List<String>,active:String?,prefix:String,ticks:Boolean=false,choose:(String)->Unit){
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        val w=maxWidth.coerceAtLeast(44.dp*values.size)
        Row(Modifier.horizontalScroll(rememberScrollState()).width(w).selectableGroup()) {
            values.forEach { v -> val on=active==v || (ticks && decimal(v)!=null && decimal(v)==active?.let(::decimal));val shape=RoundedCornerShape(if(ticks) 5.dp else 7.dp)
                Box(Modifier.weight(1f).heightIn(min=48.dp).testTag("$prefix-$v").selectable(selected=on,role=Role.RadioButton,onClick={choose(v)}).semantics { contentDescription="$label $v" }.padding(horizontal=1.5.dp),contentAlignment=Alignment.Center){
                    Box((if(ticks) Modifier else Modifier.fillMaxWidth()).background(if(on) Color(0xFFEEF2FF) else if(ticks) Color(0xFFF3F4F6) else Color(0xFFF9FAFB),shape)
                        .border(.8.dp,if(on) Color(0xFFC7D2FE) else Color(0xFFE8EAED),shape)
                        .heightIn(min=if(ticks) 17.dp else 30.dp).padding(horizontal=if(ticks) 5.dp else 1.dp),contentAlignment=Alignment.Center){
                        Text(v,color=if(on) picked else Moon.Muted,fontWeight=if(on) FontWeight.SemiBold else FontWeight.Normal,fontSize=if(ticks) 9.5.sp else 11.sp,lineHeight=14.sp,maxLines=1)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun Ratio(label:String,value:String,preview:Double,tag:String,ticks:List<String>,prefix:String,
    confirmed:Boolean?,edit:(String)->Unit,choose:(String)->Unit,confirm:(()->Unit)?=null){
    val n=probability(value);val fraction=(n?:preview).toFloat()
    Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){Label(label);Spacer(Modifier.weight(1f));if(confirmed!=null){
        Box(Modifier.heightIn(min=44.dp).testTag(prefix.replace("alpha-","confirm-")).clickable(enabled=n!=null&&!confirmed,role=Role.Button){confirm?.invoke()}.padding(horizontal=6.dp),contentAlignment=Alignment.Center){Label(if(confirmed) "已确认" else if(n==null) "尚未确认" else "确认 Conf")}
    }}
    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(6.dp),verticalAlignment=Alignment.CenterVertically){
        Slider(value=fraction,onValueChange={edit(fmt((it*100).roundToInt()/100.0))},valueRange=0f..1f,steps=99,
            modifier=Modifier.weight(1f).heightIn(min=48.dp).testTag("$tag-track").semantics { contentDescription=label;stateDescription=if(confirmed==false && n==null) "0.50 预览，尚未确认" else value },
            thumb={Box(Modifier.size(16.dp).shadow(2.dp,CircleShape).background(androidx.compose.ui.graphics.Brush.linearGradient(listOf(Color(0xFFFBBF24),Color(0xFFF97316))),CircleShape))},
            track={Spacer(Modifier.fillMaxWidth().height(5.4.dp).clip(CircleShape).background(Color(0xFFE8EAEF)))})
        LedgerInput("$label 数值",value,edit,tag,Modifier.width(48.dp),fmt(preview),numeric=true,compact=true)
    }
    Marks(label,ticks,if(confirmed==false) null else value,prefix,true,choose)
}

@Composable internal fun LegParameters(s:EditSession,i:Int,m:Leg,demo:Boolean){
    var menu by remember {mutableStateOf(false)};var expanded by rememberSaveable {mutableStateOf(true)}
    fun display(k:String)=if(demo) modes[k]?:k else k
    Column(Modifier.fillMaxWidth().testTag("strategy-params-$i")){
        Label("Strategy · 策略类型")
        Box {
            val shape=RoundedCornerShape(12.dp)
            Box(Modifier.fillMaxWidth().heightIn(min=48.dp).testTag("strategy-$i").clickable(role=Role.DropdownList){menu=true},contentAlignment=Alignment.Center){
                Row(Modifier.fillMaxWidth().background(Color.White.copy(alpha=.68f),shape).border(.9.dp,Moon.Rule,shape).heightIn(min=40.dp).padding(horizontal=14.dp),verticalAlignment=Alignment.CenterVertically){Text(display(m.mode),Modifier.weight(1f),fontSize=13.sp,color=Moon.Ink);Label("⌄")}
            }
            DropdownMenu(expanded=menu,onDismissRequest={menu=false}){modes.keys.forEach { k->DropdownMenuItem(text={Text(display(k),color=if(m.mode==k) picked else Moon.Ink)},onClick={menu=false;s.leg(i){it.copy(mode=k)}}) }}
        }
        Ratio("变量 α",m.conf,.50,"conf-$i",alpha,"alpha-$i",m.confirmed,
            edit={v->s.leg(i){it.copy(conf=v,confirmed=false)}},choose={v->s.leg(i){it.copy(conf=v,confirmed=true)}},confirm={s.leg(i){it.copy(confirmed=probability(it.conf)!=null)}})
        Row(Modifier.fillMaxWidth().heightIn(min=48.dp).testTag("calibration-$i").clickable(role=Role.Button){expanded=!expanded}.semantics {stateDescription=if(expanded) "已展开" else "已折叠"},verticalAlignment=Alignment.CenterVertically){
            Text(if(expanded) "⌄   校准参数 (β · γ · δ)" else "›   校准参数 (β · γ · δ)",fontSize=13.sp,color=Moon.Muted)
        }
        if(expanded) Column(Modifier.fillMaxWidth().padding(start=13.dp)){
            val home:@Composable (Modifier)->Unit={mod->Column(mod){Label("变量 β (主)");Marks("主队 β",beta,m.tysH,"beta-home-$i"){v->s.leg(i){it.copy(tysH=v)}}}}
            val away:@Composable (Modifier)->Unit={mod->Column(mod){Label("变量 β (客)");Marks("客队 β",beta,m.tysA,"beta-away-$i"){v->s.leg(i){it.copy(tysA=v)}}}}
            BoxWithConstraints(Modifier.fillMaxWidth()){if(maxWidth>=360.dp) Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){home(Modifier.weight(1f));away(Modifier.weight(1f))}else Column {home(Modifier.fillMaxWidth());away(Modifier.fillMaxWidth())}}
            Label("变量 γ");Marks("变量 γ",gamma,m.fid,"gamma-$i"){v->s.leg(i){it.copy(fid=v)}}
            val setH:(String)->Unit={v->s.leg(i){it.copy(fseH=v)}};val setA:(String)->Unit={v->s.leg(i){it.copy(fseA=v)}}
            Ratio("变量 δ (主)",m.fseH,.10,"fse-home-$i",delta,"delta-home-$i",null,setH,setH)
            Ratio("变量 δ (客)",m.fseA,.10,"fse-away-$i",delta,"delta-away-$i",null,setA,setA)
        }
    }
}
