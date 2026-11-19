import { build } from 'esbuild'
import { nativePlatformPlugin } from './native-platform.mjs'
import { mkdirSync, copyFileSync } from 'node:fs'
await build({
  entryPoints: ['entry.js'], plugins: [nativePlatformPlugin()], define: { 'import.meta.env': '{}' }, bundle: true, format: 'iife', platform: 'neutral',
  target: ['es2020'], outfile: '../app/src/main/assets/eivra-engine.js',
  legalComments: 'inline', charset: 'utf8', logLevel: 'info',
})
mkdirSync('../app/src/test/resources', { recursive: true })
copyFileSync('shims.js', '../app/src/test/resources/engine-shims.js')
