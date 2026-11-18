// Build-only adapter. Select lexical functions rather than importing a React screen or reimplementing Kelly.
const fs = require('fs'), path = require('path'), crypto = require('crypto')
const {rollup} = require('rollup')
const here = __dirname, lane = path.resolve(here, '..'), v2 = path.resolve(lane, '../..')
const src = path.resolve(v2, '../../eivra-studio/src'), old = path.resolve(v2, '../v1/engine')
const text = p => fs.readFileSync(p, 'utf8')
function page(name, sha) {
  const s = text(path.join(src,'pages',name+'.jsx')).replace(/\r\n/g,'\n')
  if (crypto.createHash('sha256').update(s).digest('hex') !== sha) throw Error(name+' changed; review Web adapter and golden before rebuilding')
  const ls=s.split('\n'); return (a,b)=>ls.slice(a-1,b).join('\n')
}
function pageFunctions() {
  const n=page('NewInvestmentPage','755d82e375aebc79da3260f7b1922054fd144ce6e9ddf1584215a3a317991778')
  const s=page('SettlePage','3d9c49223b914d4ff826557d37c4cb8c6ad8a0fcb5f0184c28fa423e4bd8926b')
  return `import { predictMatchProbability } from 'web/matchPrediction';
import { normalizeEntryRecord, getPrimaryEntryMarket } from 'web/entryParsing';
import { findTeamProfile, getTeamProfiles, getSystemConfig } from 'web/localData';
import { getPredictionCalibrationContext, getModeKellyRecommendations, getReservoirState } from 'web/analytics';
import { buildForecastSnapshot, capRecommendedStake, isValidDecimalOdds, MEAN_LEG_RATING_SEMANTICS } from 'web/investmentForecast';
import { buildAtomicMatchProfile, combineAtomicMatchProfiles, calcAtomicEquivalentOdds, solveKellyFractionByAtomicDistribution } from 'web/atomicParlay';
import { getMatchSourceIdentity } from 'web/investmentIdentity';
${n(53,61)}\n${n(101,105)}\n${n(109,114).replace('const buildId', 'export const newId')}
export function newPage(buildId, freezeAt) {
const systemConfig=getSystemConfig(), teamProfiles=getTeamProfiles(), calibrationContext=getPredictionCalibrationContext({detail:'lite'}), poolCapital=getReservoirState().availableCash;
const modeKellyMap = new Map(getModeKellyRecommendations().filter(r=>r.samples>=3).map(r=>[r.mode,r.kellyDivisor]));
${n(561,564)}\n${n(814,822)}\n${n(843,846)}\n${n(853,855)}\n${n(969,974)}\n${n(1088,1117)}\n${n(1128,1170)}
${n(1172,1246).replace('const generatedAt = new Date().toISOString()', 'const generatedAt = freezeAt')}
return {calculateDraftMetrics,buildInvestmentPayloadFromDraft,calibrationContext,poolCapital}; }
${s(90,111)}\n${s(687,704)}\n${s(706,741)}\nexport {getValidationError, buildSettlementUpdater};`
}
function resolver() { return {name:'offline-web-graph',
  resolveId(id, parent) {
    if (id==='web-page-functions' || id.endsWith('genesisBundle.json')) return '\0'+(id==='web-page-functions'?id:'no-genesis')
    if (id==='react') return path.join(old,'platform-react.js')
    if (id==='@supabase/supabase-js') return path.join(old,'platform-cloud.js')
    if (/\/gitSync(?:\.js)?$/.test(id)) return path.join(old,'platform-git.js')
    if (id.startsWith('v1/')) return path.join(old,id.slice(3)+'.js')
    if (id.startsWith('web/')) return path.join(src,'lib',id.slice(4)+'.js')
    if (id.startsWith('.') && parent) { const p=path.resolve(path.dirname(parent),id); return fs.existsSync(p)?p:p+'.js' }
    if (path.isAbsolute(id)) return id
    throw Error('Unexpected dependency: '+id+' in '+parent)
  },load(id) {if (id==='\0web-page-functions') return pageFunctions(); if(id==='\0no-genesis') return 'export default {}';},
  transform(code,id) { if(code.includes('import.meta.env')) return code.replace(/import\.meta\.env/g,'({})'); }
}}
async function bundle(entry, dest) {
 const b=await rollup({input:entry,plugins:[resolver()],onwarn(w,warn){ if(w.code!=='CIRCULAR_DEPENDENCY') warn(w) }})
 await b.write({file:dest,format:'iife',inlineDynamicImports:true}); await b.close()
}
module.exports={bundle,pageFunctions,lane,src}
if(require.main===module) bundle(path.join(here,'entry.js'),path.join(lane,'assets/platform-kernel.js')).catch(e=>{console.error(e); process.exitCode=1})
