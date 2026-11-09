import { installEngineGlobals, nativeSetStorageJSON, nativeGetStorageJSON, nativeResetStorage } from './shims.js'
installEngineGlobals()
import * as localData from './source/src/lib/localData.js'
import * as analytics from './source/src/lib/analytics.js'
import * as atomicParlay from './source/src/lib/atomicParlay.js'
import * as naturalInputParser from './source/src/lib/naturalInputParser.js'
import * as quantStrategy from './source/src/lib/quantStrategy.js'
import * as quantResearch from './source/src/lib/quantResearch.js'
import * as quantForward from './source/src/lib/quantForward.js'

const modules = { localData, analytics, atomicParlay, naturalInputParser, quantStrategy, quantResearch, quantForward }
const allowed = {
  'localData.getInvestments': localData.getInvestments,
  'localData.getSystemConfig': localData.getSystemConfig,
  'localData.exportDataBundle': localData.exportDataBundle,
  'localData.importDataBundle': localData.importDataBundle,
  'localData.saveInvestment': localData.saveInvestment,
  'localData.updateInvestment': localData.updateInvestment,
  'analytics.getDashboardSnapshot': analytics.getDashboardSnapshot,
  'analytics.getAnalysisSnapshot': analytics.getAnalysisSnapshot,
  'analytics.getMetricsSnapshot': analytics.getMetricsSnapshot,
  'analytics.getReservoirState': analytics.getReservoirState,
  'analytics.getPredictionCalibrationContext': analytics.getPredictionCalibrationContext,
  'naturalInputParser.parseNaturalInput': naturalInputParser.parseNaturalInput,
  'quantResearch.getResearchStore': quantResearch.getResearchStore,
  'quantForward.getForwardStore': quantForward.getForwardStore,
}
globalThis.nativeSetStorageJSON = nativeSetStorageJSON
globalThis.nativeGetStorageJSON = nativeGetStorageJSON
globalThis.nativeResetStorage = nativeResetStorage
globalThis.eivraEngine = {
  version: 'native-contract-1',
  modules: Object.keys(modules),
  invoke(name, args = []) {
    if (!Object.prototype.hasOwnProperty.call(allowed, name)) throw new Error('Unregistered native engine operation: ' + name)
    return allowed[name](...args)
  },
  invokeJSON(name, argsJSON = '[]') { return JSON.stringify(this.invoke(name, JSON.parse(argsJSON)) ?? null) },
}
