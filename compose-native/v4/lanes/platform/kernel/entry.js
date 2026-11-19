import 'v1/platform-init'
import {nativeSetStorageJSON} from 'v1/shims'
import {getDemoInvestments,getDemoTeamProfiles,getDemoSystemConfig,getDemoAccessLogs} from 'web/demoData'
import {getInvestments,exportDataBundle,saveInvestment,updateInvestment,bumpTeamSamples} from 'web/localData'
import {parseNaturalInput} from 'web/naturalInputParser'
import {buildForecastSnapshot,isValidDecimalOdds} from 'web/investmentForecast'
import {getMatchSourceIdentity} from 'web/investmentIdentity'
import {newPage,newId,getValidationError,buildSettlementUpdater} from 'web-page-functions'
import {getDashboardSnapshot,getAnalysisSnapshot,getMetricsSnapshot,getTeamsSnapshot,getReservoirState,getPredictionCalibrationContext} from 'web/analytics'
import {weightsFromSlider,jointScoreCells} from 'web/preMatchOpinion'

const check=(ok,msg)=>{if(!ok) throw Error(msg)}
const obj=x=>x!==null && typeof x==='object' && !Array.isArray(x)
const nonempty=x=>typeof x==='string' && x.trim().length>0
const num=x=>(typeof x==='number'||nonempty(x))&&Number.isFinite(Number(x))
const ratio=x=>num(x)&&Number(x)>=0&&Number(x)<=1
const stamp=x=>typeof x==='string' && Number.isFinite(Date.parse(x)) && /T.*(?:Z|[+-]\d\d:\d\d)$/i.test(x)
const snapshot=()=>exportDataBundle()
function hydrate(mode,b) {
  check(mode==='demo'||mode==='owner','Unknown workspace')
  if(b==null) b=mode==='demo'?{investments:getDemoInvestments(),team_profiles:getDemoTeamProfiles(),access_logs:getDemoAccessLogs(),system_config:getDemoSystemConfig()}:{investments:[],team_profiles:[],access_logs:[],system_config:{}}
  check(Array.isArray(b.investments)&&Array.isArray(b.team_profiles)&&Array.isArray(b.access_logs)&&obj(b.system_config),'Invalid workspace; not reseeding')
  const storage={'eivra.full_session_latch.v1':'1','eivra.genesis_applied.v1':'1','eivra.data_patch.v20260205':'1','eivra.data_patch.v20260206':'1','eivra.git_sync_state.v1':JSON.stringify({enabled:false})}
  for(const key of ['investments','team_profiles','system_config','access_logs']) storage['eivra.'+key+'.v1']=JSON.stringify(b[key])
  nativeSetStorageJSON(JSON.stringify(storage))
}
function priced(matches,pre) {
  check(Array.isArray(matches)&&matches.length>0&&matches.length<=5,'Expected 1–5 matches')
  for(const [i,m] of matches.entries()) {
    check(obj(m)&&nonempty(m.home_team)&&nonempty(m.away_team)&&m.home_team.trim()!==m.away_team.trim(),`Match ${i+1}: two different teams required`)
    check(Array.isArray(m.entries)&&m.entries.length>0&&m.entries.every(e=>obj(e)&&nonempty(e.name)&&num(e.odds)&&isValidDecimalOdds(e.odds)),`Match ${i+1}: name and decimal odds >1 required`)
    if(pre||m.conf!=null) check(ratio(m.conf)&&m.conf_confirmed!==false,`Match ${i+1}: explicit confirmed conf in 0..1 required`)
    for(const k of ['fse_home','fse_away']) if(m[k]!==undefined) check(ratio(m[k]),'Invalid '+k)
  }
}
// New's controls use percentage points. At this seam only, convert stored ratios back to UI units.
const toUi=m=>({...m,homeTeam:m.home_team,awayTeam:m.away_team,conf:Number(m.conf)*100,
  fse_home:Number(m.fse_home??0.1)*100,fse_away:Number(m.fse_away??0.1)*100,
  mode:m.mode??'常规',tys_home:m.tys_home??'M',tys_away:m.tys_away??'M',fid:m.fid??'0.4',note:m.note??''})
function forecast(matches,at=new Date().toISOString()) {
  priced(matches,true);check(stamp(at),'Expected ISO timestamp with offset')
  const page=newPage(newId,at), d=page.calculateDraftMetrics(matches.map(toUi))
  const f=buildForecastSnapshot({combinedProfile:d.combinedProfile,generatedAt:at,calibrationMetadata:page.calibrationContext.metadata,legs:matches.map((match,i)=>({match,profile:d.profiles[i]}))})
  check(f,'Invalid forecast distribution');return {...d,poolBalance:page.poolCapital,forecastSnapshot:f}
}
const preFields=['forecast_snapshot','expected_rating','expected_rating_semantics','ticket_hit_probability','ticket_profit_probability','expected_return','suggested_amount']
function save(r,pre) {
  check(obj(r)&&nonempty(r.id)&&num(r.inputs)&&Number(r.inputs)>0,'Stable id and positive inputs required')
  check(!getInvestments().some(v=>String(v.id)===r.id),'Investment ID already in use')
  check(r.status===undefined||r.status==='pending','Only pending records accepted here')
  check(pre ? r.entry_mode==null||r.entry_mode==='pre' : r.entry_mode==null||r.entry_mode==='post','Wrong entry_mode for this operation')
  check(r.created_at===undefined||stamp(r.created_at),'Invalid created_at');priced(r.matches,pre)
  check(r.settled_at==null&&r.outcome_available_at==null&&r.matches.every(m=>m.outcome_available_at==null&&m.is_correct==null&&!m.results),'Settlement evidence belongs to settleInvestment')
  const now=new Date().toISOString();let record
  if(pre) {
    let idx=0
    const id=p=>p==='inv'?r.id:(r.matches[idx++].id||newId('match'))
    const page=newPage(id,now), {payload,validationMessage}=page.buildInvestmentPayloadFromDraft({matches:r.matches.map(toUi),actualInput:r.inputs,comboName:r.combo_name})
    check(payload,validationMessage||'Invalid forecast')
    record={...r,...payload.newInvestment,created_at:r.created_at??now}
    record.matches=record.matches.map((normalized,i)=>{
      const source=r.matches[i];const m={...source,...normalized,entries:normalized.entries.map((e,j)=>({...source.entries[j],...e}))};
      Object.assign(m,getMatchSourceIdentity({...m,source_investment_id:source.source_investment_id??r.id,source_match_id:source.source_match_id??m.id,event_id:source.event_id??''},r.id));
      Object.assign(record.forecast_snapshot.legs[i],getMatchSourceIdentity(m,r.id));return m
    })
  } else {
    check(preFields.every(k=>r[k]==null)&&r.matches.every(m=>m.calibrated_probability==null),'Historical import cannot claim a prediction')
    record={...r,created_at:r.created_at??now,entry_mode:'post',inputs:Number(r.inputs),status:'pending',matches:r.matches.map(m=>({...m,id:m.id||newId('match')}))}
  }
  check(new Set(record.matches.map(m=>m.id)).size===record.matches.length,'Duplicate match id')
  const saved=saveInvestment(record);check(saved?.id===r.id,'Investment not saved');bumpTeamSamples(saved.matches.flatMap(m=>[m.home_team,m.away_team]));return {id:r.id}
}
function settle(id,form) {
  const record=getInvestments().find(r=>String(r.id)===id)
  check(record?.status==='pending','Requested record is missing or not pending')
  check(obj(form)&&Array.isArray(form.matches)&&form.matches.length===record.matches.length,'Expected one outcome per match in original order')
  check(num(form.revenues)&&form.matches.every((m,i)=>obj(m)&&typeof m.isCorrect==='boolean'&&(m.id==null||m.id===record.matches[i].id)&&['matchRating','matchRep'].every(k=>m[k]==null||m[k]===''||num(m[k]))),'Explicit revenues, hit decisions and valid ratings required')
  const msg=getValidationError(form);check(!msg,msg)
  check(updateInvestment(record.id,buildSettlementUpdater({totalInputs:Number(record.inputs)},form))?.id===record.id,'Settlement failed');return {id}
}
import {researchReads,saveParams} from './reviews.js'
import {inspect} from './exchange.js'
const reads={...researchReads,'exchange.inspect':inspect,
 'workspace.snapshot':snapshot,'naturalInputParser.parseNaturalInput':parseNaturalInput,'forecast.buildDraft':forecast,
 'analytics.getDashboardSnapshot':getDashboardSnapshot,'analytics.getAnalysisSnapshot':getAnalysisSnapshot,'analytics.getMetricsSnapshot':getMetricsSnapshot,
 'analytics.getTeamsSnapshot':getTeamsSnapshot,'analytics.getReservoirState':getReservoirState,'analytics.getPredictionCalibrationContext':getPredictionCalibrationContext,
 'preMatchOpinion.weightsFromSlider':weightsFromSlider,'preMatchOpinion.jointScoreCells':jointScoreCells,
}
const writes={'params.save':saveParams,'workspace.saveInvestment':r=>save(r,true),'workspace.importInvestment':r=>save(r,false),'workspace.settleInvestment':settle}
// Runtime input is JSON data. There is no dispatch by JS path, setter, module name or source string.
globalThis.eivraPlatform={call(text){
 const {mode,bundle,op,args,write}=JSON.parse(text), operations=write?writes:reads
 check(Object.prototype.hasOwnProperty.call(operations,op)&&Array.isArray(args),'Unregistered operation: '+op)
 hydrate(mode,bundle);const value=operations[op](...args)
 check(value!==undefined,'Operation returned undefined: '+op)
 return JSON.stringify(write?{value,bundle:snapshot()}:value)
}}
