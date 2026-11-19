// Run with Node 20+, no npm packages. Only storage/display mode and wall clock are fixtures.
// node tools/web-oracle.mjs [optional output file for instrumentation assets]
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {fileURLToPath,pathToFileURL} from 'node:url'
import assert from 'node:assert/strict'
import {probabilityReview} from '../kernel/probability.mjs'
const lane=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const lib=path.resolve(lane,'../../../../eivra-studio/src/lib')
const scratch=fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(),'review-oracle-'))
const imported=new Set()
function copy(name) {
 if(imported.has(name))return; imported.add(name)
 let s
 if(name==='displayMode') s='export const isPreviewMode=()=>false'
 else if(name==='localData') s=`export const getSystemConfig=()=>structuredClone(globalThis.fixture.system_config), getTeamProfiles=()=>structuredClone(globalThis.fixture.team_profiles), getInvestments=()=>structuredClone(globalThis.fixture.investments),getCycleTitles=()=>[], findTeamProfile=(q,ps)=>ps.find(p=>[p.teamName,...p.abbreviations].includes(q)), saveSystemConfig=()=>{throw Error('write attempted')}`
 else s=fs.readFileSync(path.join(lib,name+'.js'),'utf8').replace(/(from\s+|import\s*)(['"])\.\/([\w-]+)(?:\.js)?\2/g,(_,prefix,mark,dependency)=>{copy(dependency);return `${prefix}'./${dependency}.mjs'`})
 fs.writeFileSync(path.join(scratch,name+'.mjs'),s)
}
try {
 for(const n of ['analytics','warReport','teamHistory','investmentIdentity']) copy(n)
 const load=n=>import(pathToFileURL(path.join(scratch,n+'.mjs')).href)
 const clock=Date.parse('2026-11-18T12:00:00Z'), RealDate=Date
 globalThis.Date=class extends RealDate {constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}}
 globalThis.window=new EventTarget()
 const {getMatchSourceIdentity}=await load('investmentIdentity')
 const {getDashboardSnapshot:dash,getAnalysisSnapshot:analysis,getMetricsSnapshot:metrics,getTeamsSnapshot:teams}=await load('analytics')
 const {getCyclePeriods:cycles,getWarReport:report}=await load('warReport')
 const {buildTeamHistory,findTeamHistory}=await load('teamHistory')
 const day='2026-10-01T09:00:00Z', settled='2026-10-03T17:30:00Z'
 const leg=(id,home,away,correct,score)=>({id,home_team:home,away_team:away,entries:[{name:'1-0',odds:2}],entry_text:'1-0',mode:'常规',conf:.7,match_rating:.4,odds:2,results:score,is_correct:correct,note:'看好主队小胜',post_note:'记录原赛果'})
 const paired=[leg('L1','North','East',true,'2-1'),leg('L2','West','Vale',false,'0-0')]; paired[0].entries=[{name:'win',odds:2},{name:'1-0',odds:8}]; paired[0].entry_text='win / 1-0'; paired[0].actual_score={home:2,away:1}
 const target={id:'0007',created_at:day,settled_at:settled,status:'lose',inputs:20,revenues:0,profit:-20,parlay_size:2,expected_rating:.65,expected_rating_semantics:'mean_calibrated_leg_probability',matches:paired}
 target.forecast_snapshot={schema_version:1,model_status:'exact',generated_at:day,ticket_hit_probability:.42,legs:paired.map((m,i)=>({...getMatchSourceIdentity(m,target.id),calibrated_probability:[.7,.6][i]})).reverse()}
 const solo={id:'7',created_at:'2026-10-02T09:00:00Z',settled_at:'2026-10-03T11:00:00Z',status:'win',inputs:10,revenues:30,profit:20,matches:[leg('solo','East','Lake',true,'1-0')]}
 const pending={id:'unsettled',created_at:'2026-10-04T09:00:00Z',status:'pending',inputs:500,matches:[{id:'open-leg',home_team:'East',away_team:'North',entries:[{name:'2-0',odds:3}],conf:.5,odds:3}]}
 const archived={...structuredClone(solo),id:'archived',is_archived:true,profit:9999}
 globalThis.fixture={version:1,system_config:{initialCapital:1000,capitalInjections:[],poolSettlements:[]},team_profiles:[{teamName:'North',abbreviations:['NTH']}],investments:[pending,solo,target,archived]}
 const select=(o,ks)=>Object.fromEntries(ks.split(' ').map(k=>[k,o[k]]))
 const cases={};let checks=0
 const eq=(a,b)=>{assert.deepEqual(a,b);checks++}
 function sample(phase,period) {
   const d=dash(period), m=metrics(period), a=analysis(period), ts=teams('',period), ci=cycles(), rep=report(ci.currentId)
   const cal=probabilityReview(d,fixture.investments,getMatchSourceIdentity)
   const res={archive:structuredClone(fixture),dashboard:select(d,'periodInvestments settledPeriod pendingPeriod poolBalance roiPeriod hitRatePeriod ratingFit ratingRows recent periodInvestmentRoiSeries confCalibration'),analysis:a,metrics:{headline:m.headline,matchRows:m.matchRows},teams:ts,cycles:ci,report:rep,probability:cal}
   cases[phase+'/'+period]=res; return res
 }
 const full=sample('before','all'), empty=sample('before','1w')
 eq([full.dashboard.periodInvestments,full.dashboard.settledPeriod,full.dashboard.pendingPeriod],[3,2,1]);eq([full.dashboard.hitRatePeriod,full.dashboard.roiPeriod],[50,0]);eq([full.metrics.headline.totalInputs,full.metrics.headline.totalProfit],[30,0]);eq(full.metrics.headline.hitRate,2/3*100)
 eq(full.analysis.strategyData.map(x=>[x.samples,x.hitRate]),[[1,100],[1,0]]);eq(full.teams.find(t=>t.name==='North').totalSamples,1); eq(teams('NTH','all').length,1)
 eq([empty.dashboard.periodInvestments,empty.metrics.headline.totalInvestments,empty.probability.points.length],[0,0,0]);eq(empty.probability.frozen.bins.every(b=>b.observed===null),true)
 eq([full.report.kpi.settledCount,full.report.kpi.pendingCount,full.report.kpi.totalInputs],[2,1,30]);eq(full.report.entries.find(x=>x.id==='0007').matches.map(l=>[l.results,l.isCorrect]),[['2-1',true],['0-0',false]])
 const hm=buildTeamHistory(fixture.investments); const nh=findTeamHistory(hm,'North'); eq(nh.some(l=>l.actualScore?.home===2 && l.actualScore?.away===1),true)
 eq(full.probability.frozen.samples,2);eq(full.probability.frozen.excluded,1);eq(full.probability.frozen.bins[3].observed,.5);eq(Number(full.probability.frozen.bins[3].meanPrediction.toFixed(2)),.65)
 const bad=structuredClone(fixture.investments);const copyTarget=bad.find(t=>t.id==='0007');copyTarget.forecast_snapshot.generated_at=settled;eq(probabilityReview(dash('all'),bad,getMatchSourceIdentity).frozen.samples,0)
 copyTarget.forecast_snapshot.generated_at=day;copyTarget.forecast_snapshot.legs[0].selection_key='different';eq(probabilityReview(dash('all'),bad,getMatchSourceIdentity).frozen.samples,1)
 const rollingRows=Array.from({length:6},(_,i)=>({conf:.75,status:i%2?'lose':'win',date:`2026-10-0${i+1}`,match:'North vs East',dateLabel:`10-0${i+1}`})); const rolling=probabilityReview({periodMatchRows:rollingRows,periodInvestmentRoiSeries:[]},[],getMatchSourceIdentity); eq(rolling.points.length,1);eq([rolling.points[0].brier,rolling.points[0].logLoss],[.3125,.837]);eq(probabilityReview({periodMatchRows:[...rollingRows,{conf:null,status:'win'}],periodInvestmentRoiSeries:[]},[],getMatchSourceIdentity).eligible,6)
 // External ledger mutation (test setup only). Same reference and query, new revision.
 Object.assign(pending,{status:'win',settled_at:'2026-11-18T11:55:00Z',revenues:600,profit:100});Object.assign(pending.matches[0],{results:'2-0',actual_score:{home:2,away:0},is_correct:true,post_note:'反击得分'});window.dispatchEvent(new Event('eivra:data-changed'))
 const after=sample('after','all');eq([after.dashboard.settledPeriod,after.dashboard.pendingPeriod,after.dashboard.hitRatePeriod],[3,0,66.7]);eq(after.metrics.headline.hitRate,75);eq(after.report.kpi.profit,100);eq(after.teams.find(t=>t.name==='North').totalSamples,2);eq(dash('1w').settledPeriod,0)
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(cases))
 console.log(JSON.stringify({checks,all:{settled:2,pending:1,ticketHit:full.dashboard.hitRatePeriod,legHit:full.metrics.headline.hitRate,stake:30,profit:0},week:{total:0},after:{ticketHit:after.dashboard.hitRatePeriod,legHit:after.metrics.headline.hitRate,lastId:pending.id,score:pending.matches[0].results},rolling:rolling.points[0],frozen:full.probability.frozen},null,2))
} finally { fs.rmSync(scratch,{recursive:true,force:true}) }
