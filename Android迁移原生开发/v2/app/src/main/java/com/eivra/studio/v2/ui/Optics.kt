package com.eivra.studio.v2.ui

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalDensity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import kotlin.math.*
import com.eivra.studio.v2.api.Route

// The site's backdrop is a known stationary optical field: sample the field, not text, UI or screenshots.
// Two small shared atlases per viewport. A scrolling card moves its sampling rectangle, not a blur kernel.
private data class Atlas(val width:Int,val height:Int,val body:Bitmap,val soft:Bitmap)
private data class Key(val field:Field,val w:Int,val h:Int,val density:Float)
private val LocalAtlas=compositionLocalOf<Atlas?> { null }
private fun blurAxis(a:IntArray,b:IntArray,w:Int,h:Int,r:Int,horizontal:Boolean){
    val n=if(horizontal) w else h;val lines=if(horizontal) h else w;val stride=if(horizontal) 1 else w;val div=2*r+1
    for(line in 0 until lines){val first=if(horizontal) line*w else line;var red=0;var green=0;var blue=0
        for(j in -r..r){val c=a[first+j.coerceIn(0,n-1)*stride];red+=(c ushr 16) and 255;green+=(c ushr 8) and 255;blue+=c and 255}
        for(i in 0 until n){b[first+i*stride]=(255 shl 24) or ((red/div) shl 16) or ((green/div) shl 8) or (blue/div);val x=a[first+(i-r).coerceIn(0,n-1)*stride];val y=a[first+(i+r+1).coerceIn(0,n-1)*stride];red+=((y ushr 16) and 255)-((x ushr 16) and 255);green+=((y ushr 8) and 255)-((x ushr 8) and 255);blue+=(y and 255)-(x and 255)}
    }
}
private suspend fun renderAtlas(k:Key):Atlas=withContext(Dispatchers.Default){
    val scale=min(.25f,360f/max(k.w,k.h));val w=max(1,(k.w*scale).roundToInt());val h=max(1,(k.h*scale).roundToInt())
    val raw=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);val c=Canvas(raw);c.scale(w.toFloat()/k.w,h.toFloat()/k.h);fieldPainter(k.field,k.w.toFloat(),k.h.toFloat(),k.density)(c)
    val pix=IntArray(w*h);raw.getPixels(pix,0,w,0,0,w,h);raw.recycle()
    fun filtered(cssRadius:Float):Bitmap {val a=pix.clone();val b=IntArray(a.size);val rad=(cssRadius*.9f*k.density*scale).roundToInt().coerceIn(1,35);repeat(3){blurAxis(a,b,w,h,rad,true);blurAxis(b,a,w,h,rad,false)};return Bitmap.createBitmap(a,w,h,Bitmap.Config.ARGB_8888)}
    ensureActive();val body=filtered(4f);ensureActive();val soft=filtered(30f);Atlas(k.w,k.h,body,soft)
}
@Composable internal fun OpticalRoot(route:Route,content:@Composable ()->Unit){
    val pool=remember { android.util.LruCache<Key,Atlas>(3) };val field=fieldFor(route)
    BoxWithConstraints(Modifier.fillMaxSize()){
        val k=Key(field,constraints.maxWidth.coerceAtLeast(1),constraints.maxHeight.coerceAtLeast(1),LocalDensity.current.density)
        val atlas=key(k){produceState<Atlas?>(pool.get(k),k){if(value==null){val a=renderAtlas(k);pool.put(k,a);value=a}}}
        SceneField(field,Modifier.matchParentSize());CompositionLocalProvider(LocalAtlas provides atlas.value,content=content)
    }
}
/** Caller clips to the actual rounded surface BEFORE sampling. A nested material preserves its parent's composite. */
private val InsideLens=compositionLocalOf{false}
@Composable internal fun LensChildren(content:@Composable ()->Unit)=CompositionLocalProvider(InsideLens provides true,content=content)
@Composable internal fun Modifier.sampleField(soft:Boolean):Modifier {
    val atlas=LocalAtlas.current;val nested=InsideLens.current
    if(atlas==null || nested) return this
    val origin=remember { mutableStateOf(Offset.Zero) }
    return this.onGloballyPositioned {p->if(p.isAttached) origin.value=p.positionInRoot()}.drawWithCache {
        val dest=RectF();val paint=Paint(Paint.FILTER_BITMAP_FLAG or Paint.DITHER_FLAG);val bmp=if(soft) atlas.soft else atlas.body
        onDrawBehind {val o=origin.value;dest.set(-o.x,-o.y,atlas.width-o.x,atlas.height-o.y);drawIntoCanvas{it.nativeCanvas.drawBitmap(bmp,null,dest,paint)}}
    }
}
