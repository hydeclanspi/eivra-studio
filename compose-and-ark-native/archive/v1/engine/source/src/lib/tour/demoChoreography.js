import { useSyncExternalStore } from 'react'
import { brandSessionStorage } from '../brandStorage'

let onStage = false
const listeners = new Set()
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener) }
export const isTourOnStage = () => onStage
export const setTourOnStage = (next) => { if (next === onStage) return; onStage = next; listeners.forEach((fn) => fn()) }
export const useDemoFlourish = () => !useSyncExternalStore(subscribe, isTourOnStage, () => false)
export function spendDemoFlourishes() {
  for (const key of ['eivra.quick_input_intro_seen.v2', 'eivra.demo_bubble_shown.v1', 'eivra.combo_expand_hint.v1', 'eivra.adaptive_loop_coach.v1']) {
    try { brandSessionStorage.setItem(key, '1') } catch { /* optional persistence */ }
  }
}
