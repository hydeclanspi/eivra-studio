/* global document, window, MutationObserver */
import assert from 'node:assert/strict'
import { ENTRY_DELAY_MS, TRACKS, trackDuration } from '../src/lib/tour/tourScript.js'

// Use an already installed Playwright runtime; no product dependency is added.
// TOUR_BASE_URL=http://localhost:3000 TOUR_TRACK=full node scripts/check-demo-tour.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const track = process.env.TOUR_TRACK || 'full'
assert.ok(track in TRACKS, 'TOUR_TRACK must be full or short')
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: Number(process.env.TOUR_WIDTH || 1440), height: 1000 } })
  const errors = [], seen = new Set()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('dialog', async (dialog) => { errors.push(`Unexpected dialog: ${dialog.message()}`); await dialog.dismiss() })
  const url = new URL('/', process.env.TOUR_BASE_URL || 'http://localhost:3000')
  url.searchParams.set('tour', track === 'short' ? 'short' : '1')
  await page.addInitScript(() => {
    window.tourPhases = []
    let previous = ''
    new MutationObserver(() => {
      const stage = document.querySelector('.tour-stage')
      if (!stage) return
      const key = `${stage.dataset.step}:${stage.dataset.phase}`
      if (key === previous) return
      previous = key
      window.tourPhases.push({ step: stage.dataset.step, phase: stage.dataset.phase, at: performance.now(), dimmed: Boolean(document.querySelector('.tour-veil')) })
    }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-step', 'data-phase'] })
  })
  await page.goto(url.href)
  const begin = Date.now()
  let previous = '', generated = false, completed = false
  while (Date.now() - begin < ENTRY_DELAY_MS + trackDuration(track) + 60000) {
    const state = await page.evaluate(() => {
      const stage = document.querySelector('.tour-stage')
      return {
        status: stage?.dataset.status, step: stage?.dataset.step, phase: stage?.dataset.phase,
        caption: document.querySelector('.tour-caption')?.textContent,
        tag: document.querySelector('[data-tour="combo.package"]')?.dataset.tourTag,
      }
    })
    const key = [state.status, state.step, state.phase].join(':')
    if (key !== previous) { console.log(`${Date.now() - begin}ms ${key}`); previous = key }
    if (state.phase === 'dwelling') {
      seen.add(state.step)
      assert.ok(!state.caption?.includes('暂不可用'), `Unavailable step: ${state.step}`)
      if (state.step === 'combo.generate') {
        assert.match(state.tag || '', /[1-9][0-9]* PLANS · MONTE CARLO [1-9]/)
        generated = true
      }
    }
    if (state.status === 'finale') { completed = true; break }
    await page.waitForTimeout(100)
  }
  assert.ok(completed, 'Tour must reach its finale')
  assert.deepEqual([...seen], TRACKS[track])
  assert.ok(generated, 'Tour must produce a real portfolio result')
  assert.deepEqual(errors, [])
  const phases = await page.evaluate(() => window.tourPhases)
  for (const overview of phases.filter((event) => event.phase === 'settling')) {
    const focused = phases.find((event) => event.step === overview.step && event.phase === 'anchoring' && event.at > overview.at)
    assert.ok(focused && focused.at - overview.at >= 4900, `Five-second overview interrupted: ${overview.step}`)
    assert.equal(overview.dimmed, false, 'Page overview must be unobscured')
  }
  const overviewCount = phases.filter((event) => event.phase === 'settling').length
  const { STEPS } = await import('../src/lib/tour/tourScript.js')
  const routeChanges = TRACKS[track].filter((id, i, ids) => i > 0 && STEPS[id].route !== STEPS[ids[i - 1]].route).length
  assert.equal(overviewCount, routeChanges, 'Every new route needs its overview')
  const persistence = await page.evaluate(() => Object.fromEntries(
    ['eivra.new_investment_draft.v1', 'eivra.combo.plan_history.v1', 'eivra.investments.v1'].map((key) => [key, localStorage.getItem(key)]),
  ))
  assert.ok(Object.values(persistence).every((value) => value == null), 'A fresh tour must not persist business data')
  await page.getByRole('button', { name: '自己逛逛', exact: true }).click()
  await page.waitForSelector('.tour-stage', { state: 'detached' })
  await page.evaluate(() => document.querySelector('[data-tour="nav.new"]').click())
  await page.waitForSelector('[data-tour="new.quickInput"]')
  assert.ok(await page.locator('input').evaluateAll((inputs) => inputs.every((input) => !['阿森纳', '利物浦'].includes(input.value))), 'Completion must clear the demo form')
  await page.evaluate(() => document.querySelector('[data-tour="nav.combo"]').click())
  await page.waitForSelector('[data-tour="combo.package"]')
  assert.match(await page.locator('[data-tour="combo.package"]').getAttribute('data-tour-tag'), /→ 0 PLANS/, 'Completion must clear the portfolio result')
  console.log(JSON.stringify({ result: 'PASS', browser: browser.version(), track, steps: seen.size, elapsedMs: Date.now() - begin, errors, persistence }))
} finally { await browser.close() }
