// Test-only ESM entry. Build aliases @web=repo/eivra-studio/src/lib, @core=prepare_core.py output.
import assert from 'node:assert/strict'
import { bindWebCore } from '@core'
import { portfolioReads } from '../kernel/portfolio-ports.mjs'
import { getMatchSourceIdentity } from '@web/investmentIdentity'
import { buildAtomicMatchProfile,combineAtomicMatchProfiles,estimateEntryAnchorOdds } from '@web/atomicParlay'
import { predictMatchProbability } from '@web/matchPrediction'
import { capRecommendedStake } from '@web/investmentForecast'
import { walkForwardStrategy,backtestStrategy,analyzeStrategy } from '@web/quantStrategy'
import { evaluateParameterValidation } from '@web/quantValidation'
import { forwardPlanMetrics, emptyForwardStore } from '@web/quantForward'

const events=[0,1].map(i=>({id:`s${i}`,home_team:`Home ${i}`,away_team:`Away ${i}`,event_id:`synthetic-${i}`,
  entries:[{name:'win',odds:3.6,extra:{side:'h'}},{name:'draw',odds:5.8,extra:{side:'d'}}],
  odds:2.8,conf:.75,mode:'常规',tys_home:'M',tys_away:'M',fid:.4,fse_home:.5,fse_away:.5,note:`note ${i}`,read_notes:null,results:'discard',is_correct:true}))
let records=[{id:'p',status:'pending',created_at:'2026-01-03T10:00:00Z',matches:events}]
const cfg={initialCapital:1000,riskCapRatio:.12,defaultOdds:2.5,kellyDivisor:4,weightConf:.45,weightMode:.16,weightTys:.12,weightFid:.14,weightOdds:.06,weightFse:.07}
const api={getInvestments:()=>records,getActiveQuantCandidateRows:()=>[],brandLocalStorage:{getItem:()=>null},getMatchSourceIdentity,
  predictMatchProbability,buildAtomicMatchProfile,combineAtomicMatchProfiles,estimateEntryAnchorOdds,portfolioCandidateIssue:()=>null,
  getSystemConfig:()=>cfg,getReservoirState:()=>({availableCash:1000}),capRecommendedStake,getPredictionCalibrationContext:()=>({}),buildComboRetrospective:()=>null}
const core=bindWebCore(api), reads=portfolioReads(core,api)
const request={keys:['p-0','p-1'],riskPref:50,qualityFilter:{antiOverlapPercent:60,minWinRate:5,maxCorr:.85,minCoveragePercent:55,minCoverageEnabled:true},comboStrategy:'softPenalty',comboStructure:{minLegs:2,parlayBeta:.12,mmrLambda:.55,coverageEta:.15},allocationMode:'balanced',solverMode:'heuristic'}
const output=reads['portfolio.generate'](request)
assert.equal(output.status,'ready'); const top=output.recommendations[0]
assert.deepEqual(top.subset.map(x=>x.draftMatch.entries),events.map(x=>x.entries));assert.ok(top.subset.every((r,i)=>r.draftMatch.source_match_id===events[i].id&&!('results' in r.draftMatch)&&!r.draftMatch.conf_confirmed))
const priced=core.candidateRows(core.getTodayMatches(),cfg,{},120,1000).map(r=>({...r,roleTag:core.normalizeRoleTag(r.autoRole)}))
const ref=core.generateRecommendations(priced,50,120,cfg,{},request.qualityFilter,'softPenalty',request.comboStructure,null,null,null,'balanced','heuristic')
assert.deepEqual(top.ev,ref.recommendations[0].ev);assert.equal(top.combinedOdds,ref.recommendations[0].combinedOdds)
assert.deepEqual(output.simulation,core.runPortfolioMonteCarlo(ref.recommendations,50000));assert.equal(output.simulation.iterations,50000)
assert.equal(reads['portfolio.generate']({...request,comboStrategy:'thresholdStrict',qualityFilter:{...request.qualityFilter,minWinRate:100}}).status,'infeasible')
assert.equal(reads['portfolio.generate']({...request,keys:[]}).status,'insufficient');assert.throws(()=>reads['portfolio.generate']({...request,keys:['removed']}))
records=[{...records[0],matches:[{...events[0],odds:null}]}];assert.ok(reads['portfolio.candidates']()[0].inputIssue);assert.equal(reads['portfolio.generate']({...request,keys:['p-0']}).status,'insufficient')
const spec={market:'score',score:{for:1,against:1},venue:'any',oddsMode:'manual',manualOdds:6.5,probMode:'custom',customProb:.12,stakePerMatch:20,matchesPlanned:6}
const index={matches:Array.from({length:24},(_,i)=>({date:`2026-01-${String(i+1).padStart(2,'0')}`,home:`Home ${i}`,away:`Away ${i}`,homeGoals:i%3,awayGoals:1,source:'synthetic'}))}
const back=backtestStrategy(spec,index,6.5),wf=walkForwardStrategy(spec,index,{trainRatio:.7,assumedOdds:6.5});assert.equal(back.n,24);assert.equal(back.hits,8);assert.deepEqual([wf.train.n,wf.test.n],[16,8]);assert.equal(walkForwardStrategy(spec,{matches:[]}).test.hitRate,null)
const rolling=evaluateParameterValidation({spec,resultsIndex:index,trainDays:7,testDays:4,minTrainingSamples:2});assert.ok(rolling.folds.length>1);assert.ok(rolling.folds.every(f=>f.trainingRange.endExclusive===f.testingRange.start));assert.equal(rolling.summary.n,17)
const sim=analyzeStrategy(spec,[],{kellyDivisor:4,now:'2026-01-01T00:00:00Z'});assert.equal(sim.legs.length,6);assert.ok(sim.legs.every(l=>l.estimated));assert.ok(sim.monteCarlo.iterations>0)
const store=emptyForwardStore();store.plans.push({id:'shadow',minSettled:30,maxDrawdown:80,driftWindow:10,reviewAt:'2026-04-01T00:00:00Z'});const fm=forwardPlanMetrics(store,'shadow',{now:'2026-05-01T00:00:00Z'});assert.equal(fm.roi,null);assert.equal(fm.assessment,'insufficient_sample')
console.log(JSON.stringify({source:'synthetic, original Web functions',plans:output.recommendations.length,legs:top.legs,entries:top.subset.map(l=>l.entries.length),combinedOdds:top.combinedOdds,iterations:output.simulation.iterations,backtestN:back.n,walkForward:[wf.train.n,wf.test.n],rollingFolds:rolling.folds.length,heldOut:rolling.summary.n,simulationLegs:sim.legs.length,forward:fm.assessment}))
