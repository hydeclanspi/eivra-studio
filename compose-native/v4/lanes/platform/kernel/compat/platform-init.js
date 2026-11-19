import { installEngineGlobals, nativeSetStorageJSON } from './shims.js'
installEngineGlobals()
// Must happen before displayMode/localData module initialization: its mode is
// evaluated during imports, not only on the first native invoke.
nativeSetStorageJSON(JSON.stringify({
  'eivra.full_session_latch.v1': '1',
  'eivra.genesis_applied.v1': '1',
  'eivra.git_sync_state.v1': JSON.stringify({ enabled: false }),
}))
