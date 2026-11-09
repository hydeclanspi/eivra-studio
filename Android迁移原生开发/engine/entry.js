import './platform-init.js'
import { installEngineGlobals, nativeSetStorageJSON, nativeGetStorageJSON, nativeResetStorage } from './shims.js'
installEngineGlobals()
import { getDemoInvestments, getDemoSystemConfig, getDemoTeamProfiles, getDemoAccessLogs } from './source/src/lib/demoData.js'
import * as localData from './source/src/lib/localData.js'
import * as analytics from './source/src/lib/analytics.js'
import * as atomicParlay from './source/src/lib/atomicParlay.js'
import * as naturalInputParser from './source/src/lib/naturalInputParser.js'
import * as quantStrategy from './source/src/lib/quantStrategy.js'
import * as quantResearch from './source/src/lib/quantResearch.js'
import * as quantForward from './source/src/lib/quantForward.js'
import { buildForecastSnapshot, capRecommendedStake } from './source/src/lib/investmentForecast.js'
import { predictMatchProbability } from './source/src/lib/matchPrediction.js'

const modules = { localData, analytics, atomicParlay, naturalInputParser, quantStrategy, quantResearch, quantForward }
const clone = (value) => JSON.parse(JSON.stringify(value))
function hydrateStorage(stores = {}) {
  const investmentsKey = 'eivra.investments.v1'
  const configKey = 'eivra.system_config.v1'
  const teamsKey = 'eivra.team_profiles.v1'
  const logsKey = 'eivra.access_logs.v1'
  const input = stores[investmentsKey] || stores['eivra.workspace.native']
  const ownerEmpty = stores.emptyOwner === true
  if (ownerEmpty) {
    nativeSetStorageJSON(JSON.stringify({
      [investmentsKey]: "[]",
      [configKey]: JSON.stringify(getDemoSystemConfig()),
      [teamsKey]: "[]", [logsKey]: "[]",
      "eivra.full_session_latch.v1": "1", "eivra.git_sync_state.v1": JSON.stringify({ enabled: false }),
    }))
    return
  }
  let bundle = input
  if (typeof bundle === 'string') { try { bundle = JSON.parse(bundle) } catch { bundle = null } }
  if (!bundle || (typeof bundle === 'object' && Object.keys(bundle).length === 0)) bundle = {
    investments: getDemoInvestments(), system_config: getDemoSystemConfig(),
    team_profiles: getDemoTeamProfiles(), access_logs: getDemoAccessLogs(),
  }
  if (!input || (typeof input === 'string' && input.trim() === '{}')) {
    localData.importDataBundle({ investments: getDemoInvestments(), system_config: getDemoSystemConfig(), team_profiles: getDemoTeamProfiles(), access_logs: getDemoAccessLogs() }, 'replace')
    return
  }
  const records = bundle.investments || []
  const config = bundle.system_config || bundle.systemConfig || {}
  const teams = bundle.team_profiles || []
  const logs = bundle.access_logs || []
  nativeSetStorageJSON(JSON.stringify({
    [investmentsKey]: JSON.stringify(records), [configKey]: JSON.stringify(config),
    [teamsKey]: JSON.stringify(teams), [logsKey]: JSON.stringify(logs),
    'eivra.full_session_latch.v1': '1',
  }))
}
const allowed = {
  'localData.getInvestments': localData.getInvestments,
  'localData.getSystemConfig': localData.getSystemConfig,
  'localData.saveSystemConfig': localData.saveSystemConfig,
  'localData.getTeamProfiles': localData.getTeamProfiles,
  'localData.exportDataBundle': localData.exportDataBundle,
  'localData.importDataBundle': localData.importDataBundle,
  'localData.saveInvestment': localData.saveInvestment,
  'localData.updateInvestment': localData.updateInvestment,
  'localData.updateInvestments': localData.updateInvestments,
  'localData.settleFromForm': (id, form) => localData.updateInvestment(id, previous => {
    const inputs = Number(previous.inputs || 0)
    const revenues = Number(form.revenues)
    const ratings = (form.matches || []).map(match => match.matchRating).filter(value => value !== null && value !== undefined && value !== '').map(Number)
    const reps = (form.matches || []).map(match => match.matchRep).filter(value => value !== null && value !== undefined && value !== '').map(Number)
    return {
      ...previous,
      status: (form.matches || []).every(match => match.isCorrect === true) ? 'win' : 'lose',
      revenues,
      profit: Number((revenues - inputs).toFixed(2)),
      actual_rating: ratings.length ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2)) : null,
      rep: reps.length ? Number((reps.reduce((sum, value) => sum + value, 0) / reps.length).toFixed(2)) : null,
      remarks: (form.matches || []).map((match, index) => match.postNote?.trim() ? `M${index + 1}: ${match.postNote.trim()}` : '').filter(Boolean).join('；'),
      matches: (previous.matches || []).map((match, index) => ({
        ...match,
        results: String(form.matches?.[index]?.results || '').trim(),
        is_correct: form.matches?.[index]?.isCorrect ?? null,
        match_rating: form.matches?.[index]?.matchRating === '' || form.matches?.[index]?.matchRating == null ? null : Number(form.matches[index].matchRating),
        match_rep: form.matches?.[index]?.matchRep === '' || form.matches?.[index]?.matchRep == null ? null : Number(form.matches[index].matchRep),
        post_note: String(form.matches?.[index]?.postNote || '').trim(),
      })),
    }
  }),
  'analytics.getDashboardSnapshot': analytics.getDashboardSnapshot,
  'analytics.getAnalysisSnapshot': analytics.getAnalysisSnapshot,
  'analytics.getMetricsSnapshot': analytics.getMetricsSnapshot,
  'analytics.getReservoirState': analytics.getReservoirState,
  'analytics.getPredictionCalibrationContext': analytics.getPredictionCalibrationContext,
  'analytics.getTeamsSnapshot': analytics.getTeamsSnapshot,
  'analytics.getModelValidationSnapshot': analytics.getModelValidationSnapshot,
  'forecast.buildDraft': (matches, generatedAt) => globalThis.eivraEngine.forecast.buildDraft(matches, generatedAt),
  'naturalInputParser.parseNaturalInput': naturalInputParser.parseNaturalInput,
  'quantResearch.getResearchStore': quantResearch.getResearchStore,
  'quantForward.getForwardStore': quantForward.getForwardStore,
}
globalThis.eivraEngine = {
  version: 'native-contract-1', modules: Object.keys(modules),
  hydrate(storageJSON = '{}') {
    const raw = JSON.parse(storageJSON)
    const values = typeof raw === 'string' ? JSON.parse(raw) : raw
    hydrateStorage(values)
    return this.exportWorkspace()
  },
  forecast: {
    buildDraft(matches, generatedAt = new Date().toISOString()) {
      const config = localData.getSystemConfig()
      const calibrationContext = analytics.getPredictionCalibrationContext()
      if (!Array.isArray(matches) || matches.length === 0) throw new Error("At least one match is required")
      if (matches.some(match => match.conf == null || match.conf === "" || !Number.isFinite(Number(match.conf)) || Number(match.conf) < 0 || Number(match.conf) > 1)) throw new Error("Each match requires an explicit conf in 0..1; unrated is not 0.5")
      const profiles = (matches || []).map(match => {
        const unionProbability = predictMatchProbability({
          ...match,
          conf: Number(match.conf) > 1 ? Number(match.conf) / 100 : Number(match.conf),
          fse_home: Number(match.fse_home) > 1 ? Number(match.fse_home) / 100 : Number(match.fse_home),
          fse_away: Number(match.fse_away) > 1 ? Number(match.fse_away) / 100 : Number(match.fse_away),
        }, config, calibrationContext)
        return {
          ...atomicParlay.buildAtomicMatchProfile({ entries: match.entries || [], unionProbability, fallbackOdds: config.defaultOdds }),
          unionProbability,
        }
      })
      const combinedProfile = atomicParlay.combineAtomicMatchProfiles(profiles)
      const poolBalance = analytics.getReservoirState().poolBalance || 0
      const kellyFraction = atomicParlay.solveKellyFractionByAtomicDistribution(combinedProfile.states)
      const recommendedInvest = capRecommendedStake(poolBalance * kellyFraction / Math.max(1, config.kellyDivisor), poolBalance, config.riskCapRatio)
      const expectedRating = profiles.length ? profiles.reduce((sum, row) => sum + row.hitProbability, 0) / profiles.length : null
      const conditionalOdds = Number(combinedProfile.conditionalOdds)
      const combinedOdds = Number.isFinite(conditionalOdds) && conditionalOdds > 0
        ? conditionalOdds : (matches || []).reduce((product, match) => product * atomicParlay.calcAtomicEquivalentOdds(match.entries || [], config.defaultOdds), 1)
      return {
        profiles, combinedProfile, expectedRating, combinedOdds, recommendedInvest, kellyFraction, poolBalance,
        forecastSnapshot: buildForecastSnapshot({
          combinedProfile, generatedAt, calibrationMetadata: calibrationContext.metadata,
          legs: (matches || []).map((match, index) => ({ match, profile: profiles[index] })),
        }),
      }
    },
  },
  invoke(name, args = []) {
    if (!Object.prototype.hasOwnProperty.call(allowed, name)) throw new Error('Unregistered native engine operation: ' + name)
    return allowed[name](...args)
  },
  invokeJSON(name, argsJSON = '[]') { return JSON.stringify(this.invoke(name, JSON.parse(argsJSON)) ?? null) },
  exportWorkspace() {
    const storage = JSON.parse(nativeGetStorageJSON())
    const key = 'eivra.investments.v1'
    const configKey = 'eivra.system_config.v1'
    if (!storage[key]) {
      const demo = getDemoInvestments()
      const config = getDemoSystemConfig()
      const teams = getDemoTeamProfiles()
      const logs = getDemoAccessLogs()
      nativeSetStorageJSON(JSON.stringify({ ...storage, [key]: JSON.stringify(demo), [configKey]: JSON.stringify(config), 'eivra.team_profiles.v1': JSON.stringify(teams), 'eivra.access_logs.v1': JSON.stringify(logs) }))
    }
    return { version: 1, system_config: localData.getSystemConfig(), team_profiles: localData.getTeamProfiles(), investments: localData.getInvestments(), access_logs: localData.getAccessLogs() }
  },
  exportWorkspaceJSON() { return JSON.stringify(this.exportWorkspace()) },
  nativeGetStorageJSON,
}
