import { installEngineGlobals, nativeSetStorageJSON } from './shims.js'
installEngineGlobals()
// Must happen before displayMode/localData module initialization: its mode is
// evaluated during imports, not only on the first native invoke.
nativeSetStorageJSON(JSON.stringify({
  'eivra.full_session_latch.v1': '1',
  'eivra.genesis_applied.v1': '1',
  'eivra.git_sync_state.v1': JSON.stringify({ enabled: false }),
}))

if(!Array.prototype.at)Object.defineProperty(Array.prototype,'at',{configurable:true,writable:true,value:function(n){const len=this.length;let i=Math.trunc(Number(n)||0);if(i<0)i+=len;return i<0||i>=len?undefined:this[i]}})
