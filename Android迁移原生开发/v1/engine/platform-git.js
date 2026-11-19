// Native FULL is offline-only. Never schedule a Git commit or network timer.
// Local writes still go through the original localData module.
export const scheduleGitCommit = () => undefined
export const commitBundleNow = async () => ({ ok: false, reason: 'native_offline' })
export const pullGitBundle = async () => ({ ok: false, reason: 'native_offline', bundle: null })
export const getGitSyncState = () => ({ enabled: false, pendingChanges: 0, lastError: null })
export const setGitSyncEnabled = () => undefined
export const saveGitSyncState = () => undefined
