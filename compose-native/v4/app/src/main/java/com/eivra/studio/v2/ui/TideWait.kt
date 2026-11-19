package com.eivra.studio.v2.ui

import android.animation.ValueAnimator
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.*
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.currentStateAsState
import kotlinx.coroutines.delay
import kotlin.math.cos
import kotlin.math.PI

/** A little incident light crossing the same four facets as the masthead. Drawing reads the clock;
 * text and layout do not recompose on each frame. No fabricated percentage; fast reads never flash. */
@Composable fun TideWait(label:String="正在读取工作区",modifier:Modifier=Modifier) {
    var show by remember { mutableStateOf(false) };LaunchedEffect(Unit){delay(180);show=true}
    Row(modifier.fillMaxWidth().heightIn(min=30.dp).semantics(mergeDescendants=true){if(show) progressBarRangeInfo=ProgressBarRangeInfo.Indeterminate},verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)) {
        if(!show)return@Row
        val life by LocalLifecycleOwner.current.lifecycle.currentStateAsState()
        val phase=if(life.isAtLeast(Lifecycle.State.STARTED)&&ValueAnimator.areAnimatorsEnabled()) rememberInfiniteTransition(label="refracted light").animateFloat(0f,1f,infiniteRepeatable(tween(3600,easing=LinearEasing)),label="tide") else remember { mutableFloatStateOf(.24f) }
        Canvas(Modifier.size(32.dp,22.dp)) {
            val w=size.width;val h=size.height;val c=center;val vertices=listOf(Offset(c.x,h*.08f),Offset(w*.88f,c.y),Offset(c.x,h*.92f),Offset(w*.12f,c.y));val pigment=listOf(Color(0xFF738FA4),Color(0xFF94A8BA),Color(0xFF8299AC),Color(0xFF8791AE))
            for(i in 0..3){val a=vertices[i];val b=vertices[(i+1)%4];val lit=(.5+.5*cos(2*PI*(phase.value-i*.25))).toFloat();val p=Path().apply{moveTo(a.x,a.y);lineTo(b.x,b.y);lineTo(c.x,c.y);close()};drawPath(p,pigment[i].copy(alpha=.20f+.39f*lit));drawLine(Color.White.copy(alpha=.8f),a,b,1.dp.toPx())}
        }; Text(label,color=Moon.Muted,fontSize=12.sp,lineHeight=18.sp)
    }
}
