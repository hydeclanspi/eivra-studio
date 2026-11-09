package com.eivra.studio

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.eivra.studio.ui.*
import kotlinx.coroutines.launch
import org.json.JSONObject

@Composable
fun ConsoleScreen(bundle: JSONObject, repository: WorkspaceRepository, onChanged: (JSONObject?) -> Unit) {
    PageIntro("CONSOLE · 控制面", "参数与数据", "完整保留原配置；每次导入先校验、预览与备份，支持合并、替换与撤销。")
    val scope = rememberCoroutineScope()
    val config = bundle.optJSONObject("system_config") ?: JSONObject()
    var configText by remember(bundle) { mutableStateOf(config.toString(2)) }
    var importText by rememberSaveable { mutableStateOf("") }
    var merge by rememberSaveable { mutableStateOf(true) }
    var message by remember { mutableStateOf("") }
    var confirmImport by remember { mutableStateOf(false) }
    var fileName by remember { mutableStateOf("") }
    val openLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) runCatching {
            repository.context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { importText = it.readText() }
            fileName = uri.lastPathSegment ?: "已选择 JSON 文件"
        }.onFailure { message = "无法读取文件：${it.message}" }
    }
    val exportLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        if (uri != null) runCatching {
            repository.context.contentResolver.openOutputStream(uri)?.bufferedWriter()?.use { it.write(repository.export()) }
            message = "备份已写入所选位置"
        }.onFailure { message = "导出失败：${it.message}" }
    }
    GlassCard {
        SectionHeading("01", "资金、模型与显示参数", "编辑原 system_config；保存前校验 JSON，不丢嵌套配置")
        OutlinedTextField(configText, { configText = it }, modifier = Modifier.fillMaxWidth().heightIn(min = 300.dp), shape = RoundedCornerShape(13.dp))
        EivraButton("保存完整参数", {
            runCatching {
                val next = JSONObject(configText)
                if (next.optDouble("initialCapital", -1.0) < 0 || next.optDouble("riskCapRatio", -1.0) !in 0.0..1.0) throw IllegalArgumentException("资金须非负，风险比例须在 0–1 之间")
                scope.launch { onChanged(repository.saveSystemConfig(next)); message = "参数已保存；原 forecast snapshot 不会被改写" }
            }.onFailure { message = it.message ?: "参数格式有误" }
        }, Modifier.fillMaxWidth())
    }
    GlassCard {
        SectionHeading("02", "网页工作区导入", "文件或 JSON 文本 · 不自动上传")
        EivraButton("选择网页导出的 JSON 文件", { openLauncher.launch(arrayOf("application/json", "text/plain")) }, Modifier.fillMaxWidth(), subtle = true)
        if (fileName.isNotBlank()) Text(fileName, color = Eivra.Secondary)
        OutlinedTextField(importText, { importText = it; confirmImport = false }, placeholder = { Text("也可粘贴网页端导出的 bundle") }, modifier = Modifier.fillMaxWidth().heightIn(min = 150.dp), shape = RoundedCornerShape(13.dp))
        ChoiceRow(listOf("merge", "replace"), if (merge) "merge" else "replace") { merge = it == "merge"; confirmImport = false }
        val preview = remember(importText) { repository.previewImport(importText, merge) }
        if (preview.valid) {
            Text("可导入 ${preview.investmentCount} 笔记录；${if (merge) "同 id 以来源覆盖，其余保留" else "替换整个工作区"}。", color = Eivra.Secondary)
            Text(preview.summary, color = Eivra.Secondary)
            if (!confirmImport) EivraButton("确认预览并备份当前数据", { confirmImport = true }, Modifier.fillMaxWidth(), subtle = true)
            else EivraButton("执行${if (merge) "合并" else "替换"}导入", {
                val result = repository.importWebBundle(importText, merge)
                if (result.valid) { onChanged(null); message = "导入完成；原工作区已备份，可撤销"; confirmImport = false }
                else message = result.errors.joinToString("；")
            }, Modifier.fillMaxWidth())
        } else if (importText.isNotBlank()) Text(preview.errors.joinToString("；"), color = MaterialTheme.colorScheme.error)
        EivraButton("撤销上次导入或重置", { if (repository.restoreBackup()) { onChanged(null); message = "已恢复变更前备份" } else message = "没有可恢复的备份" }, Modifier.fillMaxWidth(), subtle = true)
    }
    GlassCard {
        SectionHeading("03", "备份与演示区", "导出原 bundle；恢复演示不覆盖未备份数据")
        EivraButton("导出当前工作区 JSON", { exportLauncher.launch("eivra-workspace-${System.currentTimeMillis()}.json") }, Modifier.fillMaxWidth(), subtle = true)
        var confirmReset by remember { mutableStateOf(false) }
        if (!confirmReset) EivraButton("检查恢复演示区选项", { confirmReset = true }, Modifier.fillMaxWidth(), subtle = true)
        else {
            Text("当前记录会先备份；演示投资不会混入主人工作区的真实样本。")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                EivraButton("取消", { confirmReset = false }, Modifier.weight(1f), subtle = true)
                EivraButton("备份并恢复演示", { repository.resetDemo(); onChanged(null); confirmReset = false }, Modifier.weight(1f), subtle = true)
            }
        }
    }
    if (message.isNotBlank()) GlassCard { Text(message, color = Eivra.Secondary) }
    GlassCard {
        SectionHeading("04", "原生边界", "Compose 原生页面 · QuickJS 独立计算 · 无 WebView")
        Text("当前为离线 FULL 本地工作区；原 Git 同步禁用，QuickJS 内 fetch 不可用。Supabase 与服务端 AI 尚未接入，不将离线计算标作云端能力。", color = Eivra.Secondary)
    }
}
