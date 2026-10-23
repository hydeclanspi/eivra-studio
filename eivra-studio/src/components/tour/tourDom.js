import { delay } from '../../lib/tour/tourBus'

export const findAnchor = (name) => [...document.querySelectorAll(`[data-tour="${name}"]`)].find((el) => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0)
export const rectOf = (el) => {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height, radius: parseFloat(getComputedStyle(el).borderRadius) || 18 }
}
export const centerOf = (el) => { const r = rectOf(el); return r ? [r.left + r.width / 2, r.top + r.height / 2] : [window.innerWidth - 220, window.innerHeight - 100] }
export async function waitForAnchor(name, signal, timeout = 4000) {
  const start = performance.now()
  while (performance.now() - start < timeout) {
    if (signal.aborted) await delay(0, signal)
    const el = findAnchor(name)
    if (el) return el
    await delay(50, signal)
  }
  return null
}
export function scrollToAnchor(el, reduced) {
  const container = el?.closest('.app-main-scroll')
  if (!container) return
  const r = rectOf(el), c = rectOf(container)
  // Reserve the mobile host's bottom dock and keep tall panels' title visible.
  const available = c.height - (window.innerWidth < 768 ? 175 : 100)
  const offset = Math.max(42, (available - Math.min(r.height, available)) / 2)
  container.scrollTo({ top: Math.max(0, container.scrollTop + (r.top - c.top - offset) / (Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1)), behavior: reduced ? 'instant' : 'smooth' })
}
export function visibleCards() {
  const all = [...document.querySelectorAll('.app-main-scroll .glow-card, .app-main-scroll .pre-board, .app-main-scroll .wr-banner, .app-main-scroll .wr-panel')]
  return all.filter((el) => !all.some((other) => other !== el && other.contains(el))).map(rectOf).filter((r) => r.width > 30 && r.height > 30 && r.bottom > 70 && r.top < window.innerHeight)
}
