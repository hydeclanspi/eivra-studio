// Browser storage is replaced by a native host adapter. No DOM or WebView.
const values = new Map()
const listeners = new Map()
export function nativeSetStorageJSON(text) {
  values.clear()
  const incoming = JSON.parse(text || '{}')
  Object.entries(incoming).forEach(([k, v]) => values.set(k, String(v)))
}
export function nativeGetStorageJSON() { return JSON.stringify(Object.fromEntries(values)) }
export function nativeResetStorage() { values.clear() }
export const nativeStore = {
  getItem(key) { return values.has(key) ? values.get(key) : null },
  setItem(key, value) { values.set(key, String(value)) },
  removeItem(key) { values.delete(key) },
}
export const nativeWindow = {
  get localStorage() { return nativeStore },
  get sessionStorage() { return nativeStore },
  location: { pathname: '/native', search: '', hash: '', href: 'native://eivra' },
  addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback) },
  removeEventListener(type, callback) { listeners.get(type)?.delete(callback) },
  dispatchEvent(event) { listeners.get(event.type)?.forEach(fn => fn(event)); return true },
  matchMedia() { return { matches: false, addEventListener() {}, removeEventListener() {} } },
  setTimeout(callback, delay, ...args) { return globalThis.setTimeout(callback, delay, ...args) },
  clearTimeout(id) { globalThis.clearTimeout(id) },
  setInterval(callback, delay, ...args) { return globalThis.setInterval(callback, delay, ...args) },
  clearInterval(id) { globalThis.clearInterval(id) },
}
export class NativeCustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail } }
export function installEngineGlobals() {
  globalThis.window = nativeWindow
  globalThis.localStorage = nativeStore
  globalThis.sessionStorage = nativeStore
  globalThis.CustomEvent = NativeCustomEvent
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true, writable: true })
  globalThis.document = { hidden: false, visibilityState: 'visible', addEventListener() {}, removeEventListener() {} }
  globalThis.fetch = async () => { throw new Error('Network is disabled in the native offline engine') }
}
export function structuredCloneNative(value) {
  if (typeof globalThis.structuredClone === 'function') return globalThis.structuredClone(value)
  return value == null ? value : JSON.parse(JSON.stringify(value))
}
