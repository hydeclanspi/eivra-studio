import { fileURLToPath } from 'node:url'
const react = fileURLToPath(new URL('./platform-react.js', import.meta.url))
const cloud = fileURLToPath(new URL('./platform-cloud.js', import.meta.url))
const git = fileURLToPath(new URL('./platform-git.js', import.meta.url))
export function nativePlatformPlugin() {
  return {
    name: 'eivra-native-platform',
    setup(build) {
      build.onResolve({ filter: /^react$/ }, () => ({ path: react }))
      build.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({ path: cloud }))
      build.onResolve({ filter: /gitSync$/ }, () => ({ path: git }))
    }
  }
}
