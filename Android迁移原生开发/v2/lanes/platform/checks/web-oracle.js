// Test-only V8 oracle: direct Web lib imports; no platform entry, page extractor or dispatch.
import 'v1/platform-init'
import {nativeSetStorageJSON} from 'v1/shims'
import {getSystemConfig} from 'web/localData'
import {parseNaturalInput} from 'web/naturalInputParser'
import {getPredictionCalibrationContext,getReservoirState,getModeKellyRecommendations} from 'web/analytics'
import {predictMatchProbability} from 'web/matchPrediction'
import {buildAtomicMatchProfile,combineAtomicMatchProfiles,solveKellyFractionByAtomicDistribution} from 'web/atomicParlay'
import {buildForecastSnapshot,capRecommendedStake} from 'web/investmentForecast'

globalThis.oracle=(bundle,text,matches,time)=>{
  const stores={'eivra.full_session_latch.v1':'1','eivra.genesis_applied.v1':'1','eivra.data_patch.v20260205':'1','eivra.data_patch.v20260206':'1'}
  for(const k of ['investments','system_config','team_profiles','access_logs']) stores['eivra.'+k+'.v1']=JSON.stringify(bundle[k]);nativeSetStorageJSON(JSON.stringify(stores))
  const parsed=parseNaturalInput(text), config=getSystemConfig(), ctx=getPredictionCalibrationContext({detail:'lite'}), pool=getReservoirState().availableCash
  const profiles=matches.map(match=>{const unionProbability=predictMatchProbability(match,config,ctx);return {...buildAtomicMatchProfile({entries:match.entries,unionProbability,fallbackOdds:config.defaultOdds}),unionProbability}})
  const combinedProfile=combineAtomicMatchProfiles(profiles), modeRows=getModeKellyRecommendations()
  // Both fixture legs intentionally use the New page's regular-leveraged mode (default 4.5).
  const divisor=ctx.walkForwardFeedback?.ready && Number.isFinite(ctx.walkForwardFeedback.adjustments?.kellyDivisor)?ctx.walkForwardFeedback.adjustments.kellyDivisor:(modeRows.find(r=>r.mode==='常规-杠杆'&&r.samples>=3)?.kellyDivisor??4.5)
  const k=combinedProfile.valid===false||combinedProfile.modelStatus==='approximate'?0:solveKellyFractionByAtomicDistribution(combinedProfile.states,0.95)
  const forecast={profiles,combinedProfile,combinedOdds:combinedProfile.conditionalOdds,expectedRating:profiles.reduce((s,p)=>s+p.hitProbability,0)/profiles.length,recommendedInvest:capRecommendedStake(pool*k/Math.max(1,divisor),pool,config.riskCapRatio),poolBalance:pool,forecastSnapshot:buildForecastSnapshot({combinedProfile,generatedAt:time,calibrationMetadata:ctx.metadata,legs:matches.map((match,i)=>({match,profile:profiles[i]}))})}
  return JSON.stringify({parsed,forecast})
}
