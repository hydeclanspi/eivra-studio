# Insights · 只读接口

调用均为 `StudioPorts.read(op, JSONArray)`；返回原始 JSON，不套 `data`。公共基线 2e6ee10 的 openPorts 会抛异常，并没有实现下列读取。不要把异常转换成空账本。本 lane 不打开引擎、不订阅云端，也不写共享状态。

| op / 位置参数 | Web 调用（`eivra-studio/src/`） | 返回中本 lane 使用的字段 |
|---|---|---|
| `workspace.snapshot`, `[]` | `localData.exportDataBundle()`；HistoryPage 的来源是 `getInvestments()` | `{investments:[{id,created_at,settled_at,status,profit,inputs,revenues,expected_rating,forecast_snapshot,matches}],team_profiles:[{teamName,abbreviations}]}`。数字或字符串 id 转字符串但不做模糊下钻。 |
| `analytics.getDashboardSnapshot`, `[period]` | DashboardPage:299，默认页面显式传 `all`（函数缺参默认 `2w`） | `{periodInvestments,settledPeriod,pendingPeriod,poolBalance,roiPeriod,hitRatePeriod,ratingFit,ratingRows,recent,periodInvestmentRoiSeries,confCalibration}` |
| `analytics.getAnalysisSnapshot`, `[period]` | AnalysisPage:781 | `{strategyData,modeData,confData,entryTypeData}`；strategy 按票；另三类按 `splitInvestmentToMatches` 归因。行含 `samples,roi,hitRate`。 |
| `analytics.getMetricsSnapshot`, `[period]` | MetricsPage:270 | `{headline:{totalInvestments,totalInputs,totalProfit,roi,hitRate},matchRows}`；headline.hitRate 的分母仅为拆分后 `typeof is_correct === 'boolean'` 的腿；`matchRows.isCorrect` 抹平了 null，不能通过它数分母。 |
| `analytics.getTeamsSnapshot`, `[query,period]` | TeamsPage:233,251 | `[{name,abbr,totalSamples,totalInputs,roi,roiHistory:[{label,value}]}]`。聚合只计当前窗口未归档、已结算拆分腿；球队档案中出现的待结算记录另标，不加进 ROI。 |
| `warReport.getCyclePeriods`, `[]` | WarReportPage:1145 | `{currentId,periods:[{id,name,startAt,endAt,isOpen,settledCount,pendingCount}]}`，最新在前。 |
| `warReport.getWarReport`, `[periodId]` | WarReportPage:1153 | `{period,kpi:{totalInputs,profit,roi,hitRate,settledCount,pendingCount,grade},curve:[{label,balance}],entries:[{id,fullDateLabel,matches,settled,profit}]}`。按资金池结算划分 `(上一刀,本刀]`，不是自然年。 |

时间键为 `all,1w,2w,1m`；原 analytics 用**创建时间**、本地自然日，开始于今日减 7/14/30 天的 00:00，结束于今日 23:59:59.999，两端包含；不是恰好 168/336/720 小时。ROI 是盈亏/本金，不是单笔 ROI 的算术平均。分母空时引擎某些字段为 0，展示层应给出「—」和原因。`confCalibration.actual` 是归一化 AJR，不能当真实命中率。预览模式的 History 隐去 `__demo_seed_pending`；按球队看时固定标注主客顺序，不把客队视角的比分反写进账本。

**概率误差桥接**：`insights.getProbabilityReview`, `[period]`。固定操作：把同一版本 `analytics.getDashboardSnapshot(period)` 的 `periodMatchRows` 交给本 lane `kernel/probability.mjs` 的 `probabilityReview`，不可接受脚本文本。原 DashboardPage:446–469、495–517 用逐腿 Conf、胜/负标签，按创建时间排序、动态窗口、p 裁至 .02–.98；原函数在 React 页内，不是 analytics 的导出。返回 `{eligible,windowSize,minWindow,points:[{label,match,n,brier,logLoss}]}`。这是 Conf 的样内描述，不叫冻结模型样本外表现，不从 Expected Rating 造整票概率。

例（合成，仅示形）：`workspace.snapshot []` 的某腿 `{home_team:"North",away_team:"East",entries:[{name:"1-0"}],actual_score:{home:2,away:1},results:"2-1",is_correct:false}`。展示「当时 1-0」「实际 2-1」「未命中」；没有 `actual_score` 时只认 `results` 可解析的比分；无明确布尔值不从整票状态推断。`Dest(History,"0007")` 不等于 `Dest(History,"7")`。明细以当前版本查整库，不受近期 8 条、搜索或日期窗口裁剪。

桥接的完整签名为 `probabilityReview(dashboard, investments, getMatchSourceIdentity)`，后两项取自同版 `localData.getInvestments()` 与原 `investmentIdentity` 导出。除保留 Web 的历史 Conf 滚动误差（原先的 status 在缺腿结果时可继承票状态）外，另返回 `frozen:{samples,excluded,bins:[{label,samples,meanPrediction,observed}]}`：新增的冻结概率可靠性表，绝不使用历史 Conf 曲线作为真实模型验证。仅取窗口内已结算 ID；必须是 schema 1，generated_at 早于已知结果时间、非 approximate、同票内 source_investment_id/source_match_id/selection_key 唯一命中且 `is_correct` 为布尔。无支持的身份/时间不猜、不按腿序号硬连；空桶均值和命中率返回 null。此表是已登记腿的描述，不声称独立事件或样本外评估。`insights` lane 不修改 platform allow-list，需集成时注册上述固定函数。
