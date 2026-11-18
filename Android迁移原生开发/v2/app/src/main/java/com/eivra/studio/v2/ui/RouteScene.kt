package com.eivra.studio.v2.ui

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import androidx.compose.foundation.layout.Spacer
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.unit.dp
import com.eivra.studio.v2.api.Route
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin

/** The backdrop is per route, not per card edition. Colors and percentages: themeSession.js / liquidGlassThemes.css. */
internal enum class Field { Moon, Sand, Daylight, Hongguo }
internal fun fieldFor(r: Route): Field = when (r) {
    Route.Portfolio -> Field.Sand
    Route.Settle, Route.Console -> Field.Hongguo
    Route.History -> Field.Daylight
    else -> Field.Moon
}
private fun colors(vararg values:String) = values.map { hex -> (if (hex.length==6) "FF$hex" else hex).toLong(16).toInt() }.toIntArray()
private val moon = colors("F5F7FB","E4E9EF","CFD9E5","ACBCD0","DCE0E8","F2F5F8")
private val sand = colors("FAF8F1","EEEBE5","DED6C9","C7BBA9","E9D9C5","FFF8EB")
private val day = colors("F5F9F6","E7ECE9","D1DEDA","ACC4C0","EEE3D5","FAF7EF")
private fun line(r:RectF, deg:Double, stops:FloatArray, rgb:IntArray): Paint {
    val a=Math.toRadians(deg); val x=sin(a).toFloat();val y=-cos(a).toFloat()
    val d=(abs(x)*r.width()+abs(y)*r.height())*.5f
    return Paint(Paint.ANTI_ALIAS_FLAG or Paint.DITHER_FLAG).apply{shader=LinearGradient(r.centerX()-x*d,r.centerY()-y*d,r.centerX()+x*d,r.centerY()+y*d,rgb,stops,Shader.TileMode.CLAMP)}
}
private fun plane(r:RectF, corners:FloatArray):Path {
    val k = 1f / maxOf(1f,corners[0]+corners[1],corners[1]+corners[2],corners[2]+corners[3],corners[3]+corners[0]);val radii=FloatArray(8){i -> corners[i/2]*k*if(i%2==0) r.width() else r.height()}
    return Path().apply{addRoundRect(r,radii,Path.Direction.CW)}
}
private inline fun Canvas.rotated(angle:Float, r:RectF, draw:Canvas.()->Unit) {val saved=save();rotate(angle,r.centerX(),r.centerY());draw();restoreToCount(saved)}

@Composable internal fun RouteScene(route: Route, modifier: Modifier=Modifier) = SceneField(fieldFor(route),modifier)
@Composable internal fun SceneField(field:Field,modifier:Modifier) {
    Spacer(modifier.drawWithCache {
        val w=size.width;val h=size.height;val small=w<=640.dp.toPx();val hong=field==Field.Hongguo
        val p=when(field){Field.Sand->sand;Field.Daylight->day;else->moon}; val bounds=RectF(0f,0f,w,h)
        fun rect(x:Float,y:Float,ww:Float,hh:Float)=RectF(x*w,y*h,(x+ww)*w,(y+hh)*h)
        val top=if(hong){if(small) rect(-.78f,-1.04f,2.80f,1.66f) else rect(.03f,-1.11f,1.58f,1.66f)}else{if(small) rect(-.35f,-1.15f,2.25f,1.72f) else rect(.04f,-1.15f,1.56f,1.72f)}
        val bottom=if(hong){if(small) rect(-.92f,.67f,2.4f,1.26f) else rect(-.4f,.66f,1.68f,1.26f)} else rect(-.54f,.74f,1.60f,1.40f)
        val flat=floatArrayOf(.48f,.48f,.48f,.48f);val topCorners=if(hong) floatArrayOf(.48f,.52f,.46f,.54f) else flat
        val up=plane(top,topCorners); val down=plane(bottom,if(hong) floatArrayOf(.48f,.52f,.50f,.50f) else flat)
        val base=if(hong) line(bounds,128.0,floatArrayOf(.12f,.47f,.82f),colors("D7EEE0","EFE7CF","CAE9DA")) else line(bounds,120.0,floatArrayOf(0f,.67f),intArrayOf(p[0],p[1]))
        val upper=if(hong) line(top,162.0,floatArrayOf(.4f,.58f,.7f,.82f,1f),colors("EDF9EF","D9F6EA","A0E9D1","6ADAB9","8DDFC5")) else line(top,166.0,floatArrayOf(.43f,.68f,.93f),intArrayOf(p[0],p[2],p[3]))
        val lower=if(hong) line(bottom,112.0,floatArrayOf(.08f,.35f,.6f,.83f,1f),colors("F8D8A6","F0B47C","DEDAB0","A0DFC2","6ADAB9")) else line(bottom,30.0,floatArrayOf(.42f,.92f),intArrayOf(p[4],p[5]))
        val sheen=if(hong) line(bounds,108.0,floatArrayOf(0f,.45f),colors("0AFFFFFF","00FFFFFF")) else line(bounds,108.0,floatArrayOf(0f,.46f,1f),colors("36FFFFFF","00FFFFFF","12FFFFFF"))
        val sun=if(hong) Paint(Paint.ANTI_ALIAS_FLAG or Paint.DITHER_FLAG).apply {
            val m=Matrix().apply{setScale(top.width()*.38f,top.height()*.24f);postTranslate(top.left+.18f*top.width(),top.top+.70f*top.height())}
            shader=RadialGradient(0f,0f,1f,colors("FFF5CC96","8CF5D6A3","00F5D6A3"),floatArrayOf(.04f,.4f,.78f),Shader.TileMode.CLAMP).also{it.setLocalMatrix(m)}
        } else null
        val inset=RectF(top).apply{inset(top.width()*.02f,top.height()*.02f)}; val contour=if(hong) plane(inset,topCorners) else null
        val rim=Paint(Paint.ANTI_ALIAS_FLAG).apply{color=if(hong) 0x70FFFFFF else 0x45FFFFFF;style=Paint.Style.STROKE;strokeWidth=1.dp.toPx()}
        val a=if(hong && small) -12f else if(hong) -22f else -24f;val b=if(hong && small) 14f else if(hong) 12f else -21f
        onDrawBehind {drawIntoCanvas{wrapper-> val c=wrapper.nativeCanvas;c.drawRect(bounds,base);c.rotated(a,top){drawPath(up,upper);if(sun!=null) drawPath(up,sun);drawPath(up,rim);if(contour!=null)drawPath(contour,rim)};c.rotated(b,bottom){drawPath(down,lower);drawPath(down,rim)};c.drawRect(bounds,sheen)}}
    })
}
