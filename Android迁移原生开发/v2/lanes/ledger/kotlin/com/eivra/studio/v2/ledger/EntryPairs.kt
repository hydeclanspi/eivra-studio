package com.eivra.studio.v2.ledger

import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.*
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.*
import com.eivra.studio.v2.ui.Moon

// Decoration is inside the editor's hit rectangle; it never owns a second focus target.
@Composable internal fun LedgerInput(label: String, raw: String, change: (String)->Unit, tag: String,
    modifier: Modifier, hint: String, numeric: Boolean=false, team: Boolean=false, compact: Boolean=false) {
    val interaction=remember { MutableInteractionSource() }; val focused by interaction.collectIsFocusedAsState()
    val focus=LocalFocusManager.current; val shape=RoundedCornerShape(if(team) 14.dp else if(compact) 8.dp else 12.5.dp)
    val style=TextStyle(color=Moon.Ink, fontFamily=if(team) FontFamily.Serif else FontFamily.SansSerif,
        fontSize=if(team) 30.sp else if(compact) 12.sp else 14.5.sp, lineHeight=if(team) 38.sp else 20.sp,
        fontWeight=if(team) FontWeight.SemiBold else FontWeight.Normal,textAlign=TextAlign.Center,
        fontFeatureSettings=if(numeric) "tnum" else null)
    BasicTextField(raw,change,modifier=modifier.heightIn(min=48.dp).testTag(tag).semantics { contentDescription=label },
        textStyle=style, singleLine=true,interactionSource=interaction,cursorBrush=SolidColor(Moon.Accent),
        keyboardOptions=KeyboardOptions(keyboardType=if(numeric) KeyboardType.Decimal else KeyboardType.Text,imeAction=ImeAction.Next),
        keyboardActions=KeyboardActions(onNext={if(!focus.moveFocus(FocusDirection.Next)) focus.clearFocus()}),
        decorationBox={inner -> Box(contentAlignment=Alignment.Center){
            Box(Modifier.fillMaxWidth().heightIn(min=if(team) 63.dp else if(compact) 26.dp else 46.dp)
                .background(Color.White.copy(alpha=if(team) .34f else if(compact) .48f else .92f),shape)
                .border(if(focused) 1.4.dp else .9.dp,if(focused) Moon.Accent else if(team) Color.White.copy(alpha=.60f) else Color(0xBCD6D3D1),shape)
                .padding(horizontal=if(compact) 3.dp else 8.dp,vertical=3.dp),contentAlignment=Alignment.Center){
                if(raw.isEmpty()) Text(hint,style=style,color=Moon.Muted.copy(alpha=.78f),maxLines=1); Box(Modifier.fillMaxWidth()){inner()}
            }
        }})
}

@Composable internal fun EntryPairs(i: Int, leg: Leg, pre: Boolean, add: ()->Unit, update: (List<Entry>)->Unit){
    Column(Modifier.fillMaxWidth().testTag("entries-$i")) {
        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){
            Text(if(pre) "Entries · 结果一条 · 比分一条（odds 都可空）" else "Entries 预测结果",Modifier.weight(1f),fontSize=11.sp,lineHeight=15.sp,color=Moon.Muted)
            SmallButton("＋ 添加 Entry",add,"add-entry-$i",leg.rows.size<5)
        }
        BoxWithConstraints(Modifier.fillMaxWidth()) {
            // Web basis 220px at zoom .9, horizontal group gap 16px. Post mode is a row list.
            val columns=if(pre) ((maxWidth+14.dp)/(198.dp+14.dp)).toInt().coerceIn(1,leg.rows.size.coerceAtLeast(1)) else 1
            Column(verticalArrangement=Arrangement.spacedBy(9.dp)) {
                leg.rows.indices.chunked(columns).forEach { group ->
                    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(14.dp,Alignment.CenterHorizontally)) {
                        group.forEach { j -> val e=leg.rows[j]; key(e.key) {
                            BoxWithConstraints(Modifier.weight(1f),contentAlignment=Alignment.Center){
                                val w=maxWidth.coerceAtMost(378.dp);val remove=if(pre) j>=2 else leg.rows.size>1
                                val usable=(w-if(remove) 55.dp else 0.dp).coerceAtLeast(0.dp)
                                Row(Modifier.width(w),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(7.dp)) {
                                    LedgerInput("第 ${j+1} 条 Entry",e.name,{v->update(leg.rows.at(j){it.copy(name=v)})},"entry-$i-$j",Modifier.width((usable*.52f).coerceAtMost(171.dp)),when(j){0->"w/d/l";1->"2-1";else->"更多"})
                                    LedgerInput("第 ${j+1} 条 Entry 的赔率",e.odds,{v->update(leg.rows.at(j){it.copy(odds=v)})},"odds-$i-$j",Modifier.width((usable*.36f).coerceAtMost(106.dp)),"odds",numeric=true)
                                    if(remove) Box(Modifier.size(48.dp).testTag("remove-entry-$i-$j").clickable(role=Role.Button){update(leg.rows.filterNot { it.key==e.key })}.semantics { contentDescription="移除第 ${j+1} 条 Entry" },contentAlignment=Alignment.Center){
                                        Box(Modifier.size(22.dp).background(Color(0xE6FAFAF9),RoundedCornerShape(7.dp)).border(.9.dp,Color(0xE6E7E5E4),RoundedCornerShape(7.dp)),contentAlignment=Alignment.Center){Text("×",fontSize=14.sp,lineHeight=16.sp,color=Moon.Muted)}
                                    }
                                }
                            }
                        } }
                    }
                }
            }
        }
    }
}
