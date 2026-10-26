import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getDisplayMode, useDisplayMode } from '../../lib/displayMode'
import { isDesignPreview } from '../../design/labEditions'
import { ACTS, DEMO_SENTENCE, ENTRY_DELAY_MS, overviewDuration, ROUTE_LEAD_MS, STEPS, navAnchor } from '../../lib/tour/tourScript'
import { initialTourState, stepId, tourReducer } from '../../lib/tour/tourMachine'
import { readTourSession, rememberTour, saveTourSession, shouldAutoOffer, tourEligible } from '../../lib/tour/tourGate'
import { delay, tourBus, tourCache } from '../../lib/tour/tourBus'
import { setTourOnStage, spendDemoFlourishes } from '../../lib/tour/demoChoreography'
import { beamRoute, computeLanes } from '../../lib/tour/laneRouting'
import { centerOf, findAnchor, rectOf, settleAnchor, visibleCards, waitForAnchor } from './tourDom'
import { TourContext } from './TourContext'
import TourStage from './TourStage'
import TourLauncher from './TourLauncher'
import { waitForInitialPage, waitForOverviewPaint } from './tourReady'
import '../../design/tour.css'

const defaultTrack = () => window.innerWidth < 768 ? 'short' : 'full'
export default function TourProvider({ children }) {
  const location = useLocation(), navigate = useNavigate(), mode = useDisplayMode()
  const param = new URLSearchParams(location.search).get('tour')
  const eligible = tourEligible({ pathname: window.location.pathname, mode, design: isDesignPreview(), param })
  const [state, dispatch] = useReducer(tourReducer, initialTourState)
  const [anchor, setAnchor] = useState(null)
  const [notice, setNotice] = useState('')
  const [pointer, setPointer] = useState(null)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const light = useRef(null), controller = useRef(null), guideController = useRef(null), expectedPath = useRef(null)
  const stateRef = useRef(state), locationRef = useRef(location), bootstrapped = useRef(false)
  const bootController = useRef(null), overviewUntil = useRef(0)
  stateRef.current = state; locationRef.current = location
  const step = STEPS[stepId(state)]
  const onStage = eligible && ['offered', 'running', 'paused', 'finale'].includes(state.status)
  const stopEffects = useCallback(() => {
    controller.current?.abort(); light.current?.clear(); setPointer(null); setAnchor(null)
    document.querySelectorAll('[data-tour-arrival]').forEach((el) => { el.removeAttribute('data-tour-arrival'); el.style.removeProperty('--tour-arrival') })
  }, [])
  const start = useCallback((track = defaultTrack()) => {
    if (!eligible) return
    bootController.current?.abort(); bootstrapped.current = true
    stopEffects(); guideController.current?.abort(); tourBus.reset(); overviewUntil.current = 0
    dispatch({ type: 'START', track })
  }, [eligible, stopEffects])
  const pause = useCallback(() => { stopEffects(); dispatch({ type: 'PAUSE' }) }, [stopEffects])
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), [])
  const exit = useCallback(() => {
    stopEffects(); guideController.current?.abort(); tourBus.reset()
    const status = stateRef.current.status === 'finale' ? 'completed' : 'dismissed'
    rememberTour(status); saveTourSession({ status }); dispatch({ type: 'EXIT' })
  }, [stopEffects])
  const beginSeek = useCallback(() => { stopEffects(); dispatch({ type: 'PHASE', phase: 'scrubbing' }) }, [stopEffects])
  const seek = useCallback((index) => { stopEffects(); overviewUntil.current = 0; dispatch({ type: 'SEEK', index }) }, [stopEffects])
  const jump = useCallback((type) => { stopEffects(); dispatch({ type }) }, [stopEffects])

  useLayoutEffect(() => { setTourOnStage(onStage || (eligible && !bootstrapped.current)) }, [onStage, eligible])
  useEffect(() => () => { setTourOnStage(false); controller.current?.abort(); guideController.current?.abort() }, [])
  useEffect(() => {
    if (!eligible) {
      bootController.current?.abort(); stopEffects(); guideController.current?.abort(); tourCache.clear()
      if (['running', 'paused'].includes(stateRef.current.status)) saveTourSession({ status: 'dismissed' })
      dispatch({ type: 'DISABLE' }); setTourOnStage(false)
      return undefined
    }
    // A visit is a router entry, not a playback status change. Exiting this
    // welcome does not re-arm it; returning home does. Tour navigation never
    // interrupts running/paused playback, including a rewind back to New.
    if (['offered', 'running', 'paused', 'finale'].includes(stateRef.current.status)) return undefined
    const homeVisit = shouldAutoOffer(location.pathname, stateRef.current.status)
    const explicitStart = !bootstrapped.current && ['1', 'short', 'dev'].includes(param)
    const saved = !bootstrapped.current && !homeVisit ? readTourSession() : null
    if (!homeVisit && !explicitStart && !['running', 'paused'].includes(saved?.status)) {
      bootstrapped.current = true; setTourOnStage(false)
      return undefined
    }
    const ctl = new AbortController(); bootController.current = ctl
    setTourOnStage(true)
    waitForInitialPage(ctl.signal, ENTRY_DELAY_MS).then(() => {
      if (ctl.signal.aborted) return
      bootstrapped.current = true
      if (explicitStart) start(param === 'short' ? 'short' : defaultTrack())
      else if (homeVisit) dispatch({ type: 'OFFER', track: defaultTrack() })
      else dispatch({ type: 'RESTORE', record: saved })
    }).catch(() => { /* Navigation or a manual start cancelled the welcome. */ })
    return () => ctl.abort()
  }, [eligible, location.key, location.pathname, param, start, stopEffects])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (!onStage) return undefined
    const keyboard = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); exit(); return }
      if (event.target.closest('input, textarea, select, [contenteditable="true"]') || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.code === 'Space' && !event.target.closest('button, a')) { event.preventDefault(); stateRef.current.status === 'paused' ? resume() : pause() }
      if (event.key === 'ArrowRight') { event.preventDefault(); jump('NEXT') }
      if (event.key === 'ArrowLeft') { event.preventDefault(); jump('PREV') }
    }
    const visibility = () => { if (document.hidden) pause() }
    window.addEventListener('keydown', keyboard); document.addEventListener('visibilitychange', visibility)
    return () => { window.removeEventListener('keydown', keyboard); document.removeEventListener('visibilitychange', visibility) }
  }, [onStage, exit, jump, pause, resume])
  const previousPath = useRef(location.pathname)
  useEffect(() => {
    if (previousPath.current !== location.pathname && stateRef.current.status === 'running' && location.pathname !== expectedPath.current) pause()
    previousPath.current = location.pathname
  }, [location.pathname, pause])

  useEffect(() => {
    if (!eligible || state.status !== 'running') return undefined
    const ctl = new AbortController(); controller.current = ctl
    const renderer = light.current
    const signal = ctl.signal, current = STEPS[stepId(state)]
    const play = (fx) => { if (!reduced && !signal.aborted) light.current?.play(fx) }
    const focus = async (name, scroll = true) => {
      const element = scroll ? await settleAnchor(name, signal, reduced) : await waitForAnchor(name, signal)
      if (!element) { setAnchor(null); return null }
      setAnchor(name)
      const rect = rectOf(element), cards = visibleCards()
      const source = centerOf(document.querySelector('.tour-host-avatar'))
      play({ kind: 'beam', points: beamRoute(source, rect, computeLanes(cards), cards, window.innerWidth < 768), duration: 620 })
      play({ kind: 'scan', rect, duration: 640 })
      return element
    }
    const click = async (name) => {
      const target = await settleAnchor(name, signal, reduced)
      if (!target || reduced) return
      const from = centerOf(document.querySelector('.tour-host-avatar')), to = centerOf(target)
      setPointer({ from, to, token: performance.now() }); target.setAttribute('data-tour-arrival', '')
      try {
        const t0 = performance.now()
        while (performance.now() - t0 < 680) {
          const p = (performance.now() - t0) / 680
          target.style.setProperty('--tour-arrival', String(.75 * Math.sin(Math.PI * Math.max(0, Math.min(1, (p - .7) / .3)))))
          await delay(24, signal)
        }
        await delay(120, signal)
      } finally {
        target.removeAttribute('data-tour-arrival'); target.style.removeProperty('--tour-arrival'); setPointer(null)
      }
    }
    const run = async () => {
      setNotice(''); setAnchor(null)
      if (current.reset) tourBus.reset()
      const sameRoute = locationRef.current.pathname === current.route || (current.route === '/new' && locationRef.current.pathname === '/')
      if (!sameRoute) {
        dispatch({ type: 'PHASE', phase: 'routing' })
        const nav = findAnchor(navAnchor(current.route))
        if (nav) play({ kind: 'beam', points: [centerOf(document.querySelector('.tour-host-avatar')), centerOf(nav)], duration: 420 })
        await delay(reduced ? 0 : ROUTE_LEAD_MS, signal)
        play({ kind: 'sweep', duration: 950 })
        expectedPath.current = current.route
        navigate({ pathname: current.route, search: locationRef.current.search })
        const routingStart = performance.now()
        while (locationRef.current.pathname !== current.route && performance.now() - routingStart < 4000) await delay(30, signal)
        document.querySelector('.app-main-scroll')?.scrollTo({ top: 0, behavior: 'instant' })
        overviewUntil.current = performance.now() + overviewDuration(current.route)
      }
      if (overviewUntil.current > performance.now()) {
        dispatch({ type: 'PHASE', phase: 'settling' })
        await waitForOverviewPaint(signal)
        // Count the overview from the unobscured page's actual paint.
        // Heavy route rendering must not consume the visitor's reading time.
        if (!sameRoute) overviewUntil.current = performance.now() + overviewDuration(current.route)
        await delay(Math.max(0, overviewUntil.current - performance.now()), signal)
      }
      const contentBegin = performance.now()
      dispatch({ type: 'PHASE', phase: 'anchoring' })
      if (current.route === '/combo' && current.prepare && current.prepare !== 'combo.ensureGenerated') await tourBus.run('combo.ensureGenerated', {}, { signal })
      if (current.prepare) await tourBus.run(current.prepare, { text: DEMO_SENTENCE, reduced: true, instant: true }, { signal })
      let target = await focus(current.preAnchor || current.anchor)
      if (current.action) {
        dispatch({ type: 'PHASE', phase: 'acting' })
        if (current.action === 'combo.ensureGenerated') {
          await click('combo.generateBtn')
          let lanes = computeLanes(visibleCards())
          if (window.innerWidth < 768) lanes = lanes.filter((l) => l.axis === 'H')
          play({ kind: 'lasers', lanes, duration: 3000 })
          setNotice('正在求解…')
        }
        if (current.action === 'new.showPostImport') await click('new.postImport')
        if (['combo.ensureGenerated', 'console.scanPage'].includes(current.action)) setAnchor(null)
        // Yield before the synchronous solver so the host and laser layer paint first.
        await delay(40, signal)
        const outcome = await tourBus.run(current.action, { text: DEMO_SENTENCE, reduced, focus, gesture: click, beforeParse: () => click('new.parse') }, { signal })
        if (!outcome?.ok) console.warn('[Tour] Action unavailable', current.action, outcome?.reason)
        setNotice(outcome?.ok ? '' : '本段结果暂不可用，可继续探索。')
        target = await focus(outcome?.ok ? current.anchor : (current.preAnchor || current.anchor), current.action !== 'console.scanPage')
      }
      if (!target) setNotice('此区域暂不可用，继续为你介绍。')
      const elapsed = performance.now() - contentBegin
      dispatch({ type: 'PHASE', phase: 'dwelling', remaining: state.remaining ?? Math.max(1600, current.duration - elapsed) })
    }
    run().catch((error) => {
      if (!signal.aborted) { setNotice('此区域暂不可用，继续为你介绍。'); dispatch({ type: 'PHASE', phase: 'dwelling', remaining: 2500 }); console.warn('[Tour] Step unavailable', error.name) }
    })
    return () => { ctl.abort(); renderer?.clear(); setPointer(null) }
    // One cancellable driver per step/resume. Router navigate changes identity
    // on navigation; depending on it would cancel the page overview.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, state.status, state.index, state.epoch, state.track, reduced])

  useEffect(() => {
    if (state.status !== 'running' || state.phase !== 'dwelling') return undefined
    let last = performance.now()
    const timer = setInterval(() => { const now = performance.now(); dispatch({ type: 'TICK', delta: now - last }); last = now }, 100)
    return () => clearInterval(timer)
  }, [state.status, state.phase])
  useEffect(() => { if (state.status === 'running' && state.phase === 'dwelling' && state.remaining <= 0) dispatch({ type: 'NEXT' }) }, [state.status, state.phase, state.remaining])
  useEffect(() => {
    if (state.status === 'finale') {
      stopEffects(); tourBus.reset(); spendDemoFlourishes()
      rememberTour('completed'); saveTourSession({ status: 'completed' })
    }
  }, [state.status, stopEffects])
  useEffect(() => {
    const save = () => {
      const s = stateRef.current
      if (['running', 'paused'].includes(s.status)) saveTourSession({ status: s.status, stepId: stepId(s), track: s.track, remaining: s.remaining })
    }
    save(); window.addEventListener('pagehide', save)
    return () => window.removeEventListener('pagehide', save)
  }, [state.status, state.index, state.track])
  const openGuide = async () => {
    pause()
    const ctl = new AbortController(); guideController.current = ctl
    const outcome = await tourBus.run('quants.openGuide', {}, { signal: ctl.signal, timeoutMs: 60 * 60 * 1000 }).catch(() => null)
    if (outcome?.ok && !ctl.signal.aborted && getDisplayMode() === 'preview') resume()
  }
  const explore = (route) => { exit(); navigate(route) }
  return <TourContext.Provider value={{ eligible, state, start }}>
    {children}
    <TourLauncher mobile />
    {onStage && <TourStage state={state} step={step} act={ACTS[step.act]} anchor={anchor} notice={notice} pointer={pointer} reduced={reduced} light={light} start={start} seek={seek} beginSeek={beginSeek} pause={pause} resume={resume} exit={exit} explore={explore} openGuide={openGuide} />}
  </TourContext.Provider>
}
