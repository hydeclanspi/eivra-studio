import './platform-init.js'
import { installEngineGlobals, nativeSetStorageJSON, nativeGetStorageJSON, nativeResetStorage } from './shims.js'
installEngineGlobals()
nativeSetStorageJSON(JSON.stringify({
  'eivra.full_session_latch.v1': '1', 'eivra.genesis_applied.v1': '1', 'eivra.git_sync_state.v1': JSON.stringify({ enabled: false }),
  'eivra.investments.v1': JSON.stringify(getDemoInvestments()),
  'eivra.system_config.v1': JSON.stringify(getDemoSystemConfig()),
  'eivra.team_profiles.v1': JSON.stringify(getDemoTeamProfiles()),
  'eivra.access_logs.v1': JSON.stringify(getDemoAccessLogs()),
}))
import { getDemoInvestments, getDemoSystemConfig, getDemoTeamProfiles, getDemoAccessLogs } from './source/src/lib/demoData.js'
import * as localData from './source/src/lib/localData.js'
import * as analytics from './source/src/lib/analytics.js'
import * as atomicParlay from './source/src/lib/atomicParlay.js'
import * as naturalInputParser from './source/src/lib/naturalInputParser.js'
import * as quantStrategy from './source/src/lib/quantStrategy.js'
import * as quantResearch from './source/src/lib/quantResearch.js'
import * as quantForward from './source/src/lib/quantForward.js'

const modules = { localData, analytics, atomicParlay, naturalInputParser, quantStrategy, quantResearch, quantForward }
const clone = (value) => JSON.parse(JSON.stringify(value))
function hydrateStorage(stores = {}) {
  const investmentsKey = 'eivra.investments.v1'
  const configKey = 'eivra.system_config.v1'
  const teamsKey = 'eivra.team_profiles.v1'
  const logsKey = 'eivra.access_logs.v1'
  const input = stores[investmentsKey] || stores['eivra.workspace.native']
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
  'analytics.getDashboardSnapshot': analytics.getDashboardSnapshot,
  'analytics.getAnalysisSnapshot': analytics.getAnalysisSnapshot,
  'analytics.getMetricsSnapshot': analytics.getMetricsSnapshot,
  'analytics.getReservoirState': analytics.getReservoirState,
  'analytics.getPredictionCalibrationContext': analytics.getPredictionCalibrationContext,
  'analytics.getTeamsSnapshot': analytics.getTeamsSnapshot,
  'analytics.getModelValidationSnapshot': analytics.getModelValidationSnapshot,
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
