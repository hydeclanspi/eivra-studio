package com.eivra.studio

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.eivra.studio.ui.*
import org.json.JSONObject

@Composable
fun PortfolioScreen(bundle: JSONObject) {
    PageIntro("PORTFOLIO CONSTRUCTION", "组合配置", "候选判断、资金约束与依赖关系，放在同一张桌面上看。")
    val records = bundle.getJSONArray("investments")
    var pending = 0
    var exposure = 0.0
    for (i in 0 until records.length()) {
        val r = records.getJSONObject(i)
        if (r.optString("status") == "pending") { pending++; exposure += r.optDouble("inputs") }
    }
    GlassCard { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) { Metric("待结算", "$pending 笔"); Metric("在途冻结", "¥ ${"%.0f".format(exposure)}"); Metric("蓄水池", "¥ ${"%.0f".format((bundle.optJSONObject("system_config"))?.optDouble("initialCapital") ?: 0.0)}") } }
    GlassCard { SectionHeading("02", "当前候选", "去 Settle 逐腿记录实际结果，闭合反馈链路"); if (pending == 0) Text("还没有待配置的判断。去 New 写下第一条。", color = LocalEivraSurface.current.muted); InvestmentList(bundle, true) }
    GlassCard { SectionHeading("03", "依赖风险诊断", "不把探索性指数当成已校准的尾部概率"); Text("共享同一场比赛的不同头寸需按原子选项评估依赖；完整 Combo 组合生成、协方差矩阵与 Monte Carlo 尚未完成原生页面迁移，不在此伪造诊断结论。", color = LocalEivraSurface.current.muted) }
}
