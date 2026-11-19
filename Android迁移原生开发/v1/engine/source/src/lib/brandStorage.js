import { LEGACY_BRAND } from '../../shared/brandCompatibility.js'

const legacyKeyFor = (key) => {
  const value = String(key)
  return /^eivra[.:]/.test(value)
    ? `${LEGACY_BRAND.storagePrefix}${value.slice('eivra'.length)}`
    : null
}

// Lazy migration also covers rarely opened pages, drafts and session tokens.
// Existing Eivra values always win. Copy failures (e.g. quota exhaustion) must
// not hide the readable legacy value. No storage is touched at module import.
export const createBrandStorage = (getStorage) => ({
  getItem(key) {
    const storage = getStorage()
    const current = storage.getItem(key)
    if (current !== null) return current
    const legacyKey = legacyKeyFor(key)
    if (!legacyKey) return null
    const legacy = storage.getItem(legacyKey)
    if (legacy === null) return null
    try { storage.setItem(key, legacy) } catch { /* Read remains available. */ }
    return legacy
  },
  setItem(key, value) {
    // Keep the old value as a migration-era recovery copy. A failed canonical
    // write must propagate to the caller rather than pretending it was saved.
    getStorage().setItem(key, value)
  },
  removeItem(key) {
    const storage = getStorage()
    const legacyKey = legacyKeyFor(key)
    // Explicit clearing (e.g. relock or submitted draft) clears both aliases;
    // otherwise a later read would resurrect the old token or draft.
    if (legacyKey) storage.removeItem(legacyKey)
    storage.removeItem(key)
  },
})

export const brandLocalStorage = createBrandStorage(() => window.localStorage)
export const brandSessionStorage = createBrandStorage(() => window.sessionStorage)
