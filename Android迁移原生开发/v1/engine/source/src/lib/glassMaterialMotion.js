const SURFACES = '.glow-card, .console-interactive-surface, .motion-v2-surface'
const CONTROLS = 'button, a, input, select, textarea, label'
const EXCLUDED = '.settle-ai-quick-card, .wr-showcase, [role="dialog"]'
const REDUCTIONS = [
  '(prefers-reduced-motion: reduce)',
  '(prefers-reduced-transparency: reduce)',
  '(prefers-contrast: more)',
  '(pointer: coarse)',
  '(hover: none)',
]

// Walk only the event's ancestors. A nested control never gets its own moving
// material, and no event queries or measures the rest of the page's cards.
const outerSurface = (target) => {
  if (!target?.closest) return null
  const scope = target.closest('.app-main-content')
  if (!scope || target.closest(EXCLUDED)) return null
  let surface = null
  for (let node = target; node && node !== scope; node = node.parentElement) {
    if (node.matches(SURFACES) && !node.matches(CONTROLS)) surface = node
  }
  return surface
}

// App mounts this only for full material. The two cheaper budgets install no
// pointer listener. There is no idle animation and no React state per frame.
export const attachGlassMaterialMotion = (host = window, page = document) => {
  const preferences = REDUCTIONS.map((query) => host.matchMedia(query))
  let frame = 0
  let pending = null
  let active = null
  let listening = false
  let disposed = false

  const clearActive = () => {
    if (!active) return
    active.removeAttribute('data-glass-highlight')
    active.style.removeProperty('--glass-highlight-x')
    active.style.removeProperty('--glass-highlight-y')
    active = null
  }
  const reset = () => {
    if (frame) host.cancelAnimationFrame(frame)
    frame = 0
    pending = null
    clearActive()
  }
  const allowed = () => !disposed && !page.hidden && !preferences.some((item) => item.matches)
  const render = () => {
    frame = 0
    if (!allowed() || !pending || !pending.card.isConnected) { reset(); return }
    const { card, x, y } = pending
    pending = null
    const rect = card.getBoundingClientRect()
    if (!rect.width || !rect.height || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      clearActive()
      return
    }
    if (active !== card) clearActive()
    active = card
    const offset = (position, start, size) => Math.max(-6, Math.min(6, ((position - start) / size - 0.5) * 12))
    card.style.setProperty('--glass-highlight-x', `${offset(x, rect.left, rect.width).toFixed(2)}px`)
    card.style.setProperty('--glass-highlight-y', `${offset(y, rect.top, rect.height).toFixed(2)}px`)
    card.setAttribute('data-glass-highlight', 'active')
  }
  const move = (event) => {
    if (!allowed() || event.pointerType === 'touch') { reset(); return }
    const card = outerSurface(event.target)
    if (!card || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) { reset(); return }
    if (active && active !== card) clearActive()
    pending = { card, x: event.clientX, y: event.clientY }
    if (!frame) frame = host.requestAnimationFrame(render)
  }
  const leave = (event) => {
    const next = outerSurface(event.relatedTarget)
    if (!next || (next !== active && next !== pending?.card)) reset()
  }
  const sync = () => {
    reset()
    const enable = allowed()
    if (enable === listening) return
    listening = enable
    if (enable) {
      page.addEventListener('pointermove', move, { passive: true })
      page.addEventListener('pointerout', leave, { passive: true })
    } else {
      page.removeEventListener('pointermove', move)
      page.removeEventListener('pointerout', leave)
    }
  }
  preferences.forEach((item) => item.addEventListener('change', sync))
  page.addEventListener('visibilitychange', sync)
  // Capture scrolls from the app's inner scroller, not just window scrolling.
  page.addEventListener('scroll', reset, { passive: true, capture: true })
  host.addEventListener('blur', reset)
  host.addEventListener('resize', reset, { passive: true })
  sync()
  return () => {
    disposed = true
    sync()
    preferences.forEach((item) => item.removeEventListener('change', sync))
    page.removeEventListener('visibilitychange', sync)
    page.removeEventListener('scroll', reset, true)
    host.removeEventListener('blur', reset)
    host.removeEventListener('resize', reset)
  }
}
