import {getInvestments,getSystemConfig,saveSystemConfig} from 'web/localData'
import {getMatchSourceIdentity} from 'web/investmentIdentity'
import {getCyclePeriods,getWarReport} from 'web/warReport'
import {getDashboardSnapshot,getReservoirState,getPredictionCalibrationContext,getExpectedVsActualRows,getModeKellyRecommendations,buildComboRetrospective} from 'web/analytics'
import {capRecommendedStake} from 'web/investmentForecast'
import {getResultsIndex} from 'web/matchResults'
import {analyzeStrategy,backtestStrategy,walkForwardStrategy,simulateStrategyPortfolio} from 'web/quantStrategy'
import {getResearchStore,getResearchDataCoverage} from 'web/quantResearch'
import {getForwardStore,forwardPlanMetrics} from 'web/quantForward'
import {getEvidenceStore} from 'web/quantEvidence'
import {probabilityReview} from './probability.mjs'
import * as combo from 'web-combo'

function draftMatch(row,investments) {
 const source=investments.find(i=>i.id===row.investmentId)?.matches?.[row.matchIndex]
 if(!source&&!row.researchCandidateId) return null
 const draft={...(source??{}),...getMatchSourceIdentity(source??row,row.investmentId),home_team:row.homeTeam,away_team:row.awayTeam,entries:source?.entries??row.entries,conf:row.conf,conf_confirmed:false}
 if(!source) Object.assign(draft,{research_candidate_id:row.researchCandidateId,mode:row.mode,tys_home:row.tysHome,tys_away:row.tysAway,fid:row.fid,fse_home:row.fseHome,fse_away:row.fseAway,note:row.note})
 for(const k of ['id','results','is_correct','match_rating','match_rep','post_note','actual_score','settled_at','outcome_available_at','calibrated_probability','forecast_snapshot','model_validation']) delete draft[k]
 return draft
}
function portfolio(request) {
 const raw=combo.getTodayMatches(),input=getInvestments(),cfg=getSystemConfig(),cash=getReservoirState().availableCash,cap=capRecommendedStake(Number.MAX_SAFE_INTEGER,cash,cfg.riskCapRatio)
 const ctx=getPredictionCalibrationContext(request?{detail:'full',includeWeightSuggestions:false}:{detail:'lite'})
 const rows=combo.candidateRows(raw,cfg,ctx,cap,cash).map(row=>({...row,draftMatch:draftMatch(row,input)}))
 if(!request) return [...rows,...raw.filter(r=>r.missingLegQuote).map(r=>({...r,inputIssue:r.missingLegQuoteReason,draftMatch:null}))]
 if(!Array.isArray(request.keys)||new Set(request.keys).size!==request.keys.length) throw Error('Expected distinct candidate keys')
 if(!request.keys.length) return {status:'insufficient',reason:'尚未选中可报价的候选'}
 const selected=request.keys.map(key=>{const row=rows.find(r=>r.key===key);if(!row) throw Error('候选不再可报价：'+key);return {...row,roleTag:combo.normalizeRoleTag(request.matchRoleOverrides?.[key]??row.autoRole)}})
 const quality={...combo.DEFAULT_QUALITY_FILTER,...request.qualityFilter};const issue=selected.find(r=>r.inputIssue)?.inputIssue||combo.getPortfolioInputIssue(selected,quality)
 if(issue) return {status:'infeasible',reason:issue}
 const g=combo.generateRecommendations(selected,request.riskPref??50,cap,cfg,ctx,quality,request.comboStrategy??'softPenalty',{...combo.DEFAULT_COMBO_STRUCTURE,...request.comboStructure},{...combo.DEFAULT_ROLE_PREFERENCE,...request.rolePreference},null,buildComboRetrospective(combo.readComboPlanHistory()),request.allocationMode??'balanced',request.solverMode??'heuristic')
 if(!g) return {status:'infeasible',reason:'当前参数下没有可用方案'}
 return {status:'ready',candidateCombos:g.candidateCombos,qualifiedCombos:g.qualifiedCombos,totalInvest:g.totalInvest,recommendations:g.recommendations,riskDeferred:request.deferRisk===true,simulation:request.deferRisk===true?null:combo.runPortfolioMonteCarlo(g.recommendations.slice(0,20),50000)}
}
export const researchReads={
 'warReport.getCyclePeriods':getCyclePeriods,'warReport.getWarReport':getWarReport,
 'insights.getProbabilityReview':period=>probabilityReview(getDashboardSnapshot(period),getInvestments(),getMatchSourceIdentity),
 'portfolio.simulate':pack=>{if(!Array.isArray(pack)||!pack.length||pack.length>20)throw Error('Expected frozen ranked package (1–20 items)');return {simulation:combo.runPortfolioMonteCarlo(pack,50000)}},'portfolio.candidates':()=>portfolio(null),'portfolio.generate':r=>{if(!r)throw Error('Missing portfolio request');return portfolio(r)},
 'matchResults.getResultsIndex':getResultsIndex,'quantStrategy.backtestStrategy':backtestStrategy,'quantStrategy.walkForwardStrategy':walkForwardStrategy,
 'quantStrategy.analyzeStrategy':analyzeStrategy,'quantStrategy.simulateStrategyPortfolio':simulateStrategyPortfolio,
 'quantResearch.getResearchStore':getResearchStore,'quantResearch.getResearchDataCoverage':getResearchDataCoverage,'quantForward.getForwardStore':getForwardStore,'quantForward.forwardPlanMetrics':forwardPlanMetrics,'quantEvidence.getEvidenceStore':getEvidenceStore,
 'params.get':getSystemConfig,'analytics.getExpectedVsActualRows':getExpectedVsActualRows,'analytics.getModeKellyRecommendations':getModeKellyRecommendations,
}
const limits={initialCapital:[0,Infinity],riskCapRatio:[0,1],defaultOdds:[1.01,Infinity],kellyDivisor:[1,Infinity],maxWorstDrawdownAlertPct:[5,95],weightConf:[0,1],weightMode:[0,1],weightTys:[0,1],weightFid:[0,1],weightOdds:[0,1],weightFse:[0,1]}
export function saveParams(patch) {
 if(!patch||!Object.keys(patch).length)throw Error('没有可保存的参数')
 for(const [k,v] of Object.entries(patch)) if(!Object.prototype.hasOwnProperty.call(limits,k)||typeof v!=='number'||!Number.isFinite(v)||v<limits[k][0]||v>limits[k][1])throw Error('参数超出有效范围：'+k)
 return saveSystemConfig(patch)
}
