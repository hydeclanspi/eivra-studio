# APK 安装与真机验收（发布候选阶段使用）

当前 APK 尚未通过构建与设备验收，此文件是后续操作约定，不是已完成声明。

1. 在 Actions 对应通过的运行中下载 `eivra-native-debug-apk`。
2. 将 APK 发送到荣耀手机或 Android 平板，选择允许本次安装；不修改系统全局安全设置。
3. 首次启动应是原 Eivra demo；新建一笔小额测试记录，确认 New → Portfolio → Settle 的状态与时间。
4. 关闭并彻底结束 App 后重开，记录不能丢失、不能重复结算。
5. 在 Console 先导出备份，再导入网页 JSON；观察校验、合并和撤销恢复。
6. 手机与平板分别检查 New、Dashboard、Analysis、Metrics、Quants、History、Teams、Console。
7. 记录系统版本、设备型号、窗口大小、任何视觉或交互问题；不能只说“能用”。

性能验收需要帧时与内存数据，不通过主观截图替代。发布候选前再做干净安装、覆盖安装、备份恢复与已知限制确认。
