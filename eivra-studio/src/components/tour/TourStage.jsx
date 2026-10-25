import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, Pause, Play, RotateCcw, X } from 'lucide-react'
import { STEPS, TRACKS, stepOffset, stepAtProgress, trackDuration, trackLabel } from '../../lib/tour/tourScript'
import { createLightRenderer } from '../../lib/tour/lightRenderer'
import { centerOf, findAnchor } from './tourDom'
import useTourAnchorRect from './useTourAnchorRect'
import HostAvatar from './HostAvatar'

const time = (n) => `${String(Math.floor(n / 60000)).padStart(2, '0')}:${String(Math.floor(n / 1000) % 60).padStart(2, '0')}`
const overlaps = (a, b) => b && a.left < b.left + b.width + 16 && a.left + a.width + 16 > b.left && a.top < b.top + b.height + 16 && a.top + a.height + 16 > b.top
export default function TourStage({ state, step, act, anchor, notice, pointer, reduced, light, start, seek, beginSeek, pause, resume, exit, explore, openGuide }) {
  const canvas = useRef(null), host = useRef(null), previousFocus = useRef(document.activeElement), closeTimer = useRef(null)
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [countdown, setCountdown] = useState(4000), [hovered, setHovered] = useState(false)
  const [dock, setDock] = useState(0), [returning, setReturning] = useState(false), [opening, setOpening] = useState(!reduced && state.status !== 'offered')
  const { rect, tag: dataTag } = useTourAnchorRect(anchor)
  const [scrub, setScrub] = useState(null)
  const paused = state.status === 'paused', welcome = state.status === 'offered', finale = state.status === 'finale'
  const reveal = state.status === 'running' && step.anchor === 'console.bottom' && state.phase === 'dwelling' && state.remaining < 1600
  const stage = welcome || finale || reveal
  const overview = state.status === 'running' && state.phase === 'settling'
  const pill = paused || (!stage && (state.phase === 'routing' || overview))
  const form = returning || opening ? 'dot' : stage ? 'stage' : pill ? 'pill' : 'talk'
  const mobile = viewport.width < 768
  const width = form === 'dot' ? 46 : mobile ? Math.min(viewport.width - 32, 500) : form === 'stage' ? (welcome ? 540 : 500) : form === 'pill' ? (paused ? 310 : 270) : 384
  const height = form === 'dot' ? 46 : form === 'stage' ? (finale ? 360 : reveal ? 260 : mobile ? 480 : 456) : form === 'pill' ? 52 : mobile ? 154 : 164
  const positions = [
    { left: viewport.width - width - 24, top: viewport.height - height - 24 },
    { left: 24, top: viewport.height - height - 24 },
    { left: viewport.width - width - 24, top: 92 },
  ]
  let position = stage ? { left: (viewport.width - width) / 2, top: Math.max(80, (viewport.height - height) / 2) } : mobile ? { left: 16, top: viewport.height - height - 16 } : positions[dock]
  if (form === 'dot') { const logo = centerOf(findAnchor('brand.logo')); position = { left: logo[0] - 23, top: logo[1] - 23 } }
  useLayoutEffect(() => {
    if (stage || mobile || !rect) return
    const available = positions.map((p) => ({ ...p, width, height }))
    if (overlaps(available[dock], rect)) {
      const free = available.map((p, index) => ({ ...p, index })).filter((p) => !overlaps(p, rect)).sort((a, b) => Math.hypot(a.left - available[dock].left, a.top - available[dock].top) - Math.hypot(b.left - available[dock].left, b.top - available[dock].top))
      if (free[0]) setDock(free[0].index)
    }
    // Dock moves only to avoid the current target, never follows it frame by frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect, width, height, stage, mobile, viewport])
  useEffect(() => {
    const engine = createLightRenderer(canvas.current); light.current = engine
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    host.current?.focus({ preventScroll: true })
    const timer = setTimeout(() => setOpening(false), reduced ? 0 : 80)
    const restore = previousFocus.current
    return () => {
      clearTimeout(timer); clearTimeout(closeTimer.current); engine.dispose(); light.current = null
      window.removeEventListener('resize', update)
      if (restore?.isConnected) restore.focus?.({ preventScroll: true })
      else findAnchor('topbar.tourLauncher')?.focus({ preventScroll: true })
    }
    // The persistent stage owns exactly one renderer/focus lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (!welcome || hovered) return undefined
    let last = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      if (!document.hidden) setCountdown((n) => Math.max(0, n - (now - last)))
      last = now
    }, 50)
    return () => clearInterval(timer)
  }, [welcome, hovered])
  useEffect(() => { if (welcome && countdown <= 0) start(state.track) }, [welcome, countdown, start, state.track])
  const close = () => {
    if (reduced || !finale) { exit(); return }
    setReturning(true); light.current?.clear()
    light.current?.play({ kind: 'beam', points: [centerOf(document.querySelector('.tour-host-avatar')), centerOf(findAnchor('brand.logo'))], duration: 480 })
    closeTimer.current = setTimeout(exit, 520)
  }
  const ids = TRACKS[state.track], total = trackDuration(state.track)
  const before = stepOffset(state.track, state.index)
  const elapsed = finale ? total : before + (state.remaining == null ? 0 : step.duration - Math.min(step.duration, state.remaining))
  const progress = scrub ?? elapsed / total
  const commitSeek = (value) => { setScrub(null); seek(stepAtProgress(state.track, Number(value))) }
  const body = scrub == null ? (notice || step.body) : `回到：${STEPS[ids[stepAtProgress(state.track, scrub)]].title}`
  const avatarState = finale ? 'success' : state.phase === 'acting' && step.act === 1 ? 'think' : state.status === 'running' && !pill ? 'speak' : 'idle'
  return createPortal(<div className="tour-stage" style={{ zoom: 1 / (Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1) }} data-status={state.status} data-step={ids[state.index]} data-phase={state.phase} data-reduced={reduced ? 'true' : undefined}>
    {!paused && !returning && <div className="tour-intercept" aria-hidden="true" onClick={welcome ? close : pause} onWheel={welcome ? undefined : pause} />}
    {!paused && !overview && !returning && <div className={`tour-veil${rect && !stage ? ' has-target' : ''}`} aria-hidden="true" style={rect && !stage ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: rect.radius } : undefined} />}
    <canvas className="tour-light" ref={canvas} aria-hidden="true" />
    {rect && !paused && !stage && !returning && <div className="tour-reticle" data-target={anchor} aria-hidden="true" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: rect.radius }}>
      <i /><i /><i /><i />
      {dataTag && <span key={dataTag} className="tour-tag" style={{ maxWidth: Math.min(viewport.width - rect.left - 24, 520), top: rect.top < 110 ? 8 : -31 }}><b />{dataTag}</span>}
    </div>}
    <section ref={host} tabIndex={-1} className={`tour-host tour-host--${form}${welcome ? ' tour-host--welcome' : ''}`} data-speaking={avatarState === 'speak'} role="dialog" aria-modal="false" aria-label={paused ? '导览已暂停' : 'Eivra 产品导览'} style={{ ...position, width, height }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={(event) => { if (event.target !== event.currentTarget) setHovered(true) }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false) }}>
      <div className="tour-host-avatar"><HostAvatar act={finale ? 6 : step.act + 1} state={avatarState} eyes={form === 'stage' || form === 'talk'} /></div>
      <div className="tour-host-content" key={`${form}-${welcome}-${finale}-${reveal}`}>
        {form === 'pill' && <div className="tour-pill-content">
          {paused ? <><button className="tour-resume" onClick={resume}>导览已暂停 <Play size={12} /> 继续</button><button className="tour-icon" onClick={() => start(state.track)} aria-label="从头开始导览" title="从头开始导览"><RotateCcw size={13} /></button></> : <span>{overview ? '先看一眼这个页面' : `→ ${act[0]} · ${act[1]}`}<small>{overview ? 'OVERVIEW' : act[2]}</small></span>}
          <button className="tour-icon" onClick={close} aria-label="退出导览"><X size={13} /></button>
        </div>}
        {form === 'stage' && <div className="tour-stage-copy">
          <span className="tour-eyebrow">EIVRA STUDIO · {welcome ? 'A GUIDED JOURNEY' : 'DEMO'}</span>
          <h2 className={welcome || finale ? '' : 'tour-brand-line'}>{welcome ? '从一个判断，到一套闭环' : finale ? '一个闭环，持续校准' : 'Intuition, calibrated.'}</h2>
          {welcome && <>
            <p className="tour-welcome-brand">Intuition, calibrated.</p>
            <div className="tour-loop" aria-label="判断、配仓、结算、复盘、校准的闭环">{['判断', '配仓', '结算', '复盘', '校准'].map((label, i) => <span key={label} style={{ '--i': i }}>{label}{i < 4 && <b>→</b>}</span>)}<i>↺</i></div>
            <div className="tour-preview-features">
              <div><span>01 / RECALL</span><strong>让复盘接上判断</strong><small>一键调出过往备注</small></div>
              <div><span>02 / REFINE</span><strong>把依赖变成选择</strong><small>查看风险 · 定制组合</small></div>
              <div><span>03 / CALIBRATE</span><strong>让结果校准直觉</strong><small>从战报走到模型检验</small></div>
            </div>
          </>}
          {reveal && <p>赛前预期，对照赛后实际。</p>}
          {finale && <>
            <div className="tour-loop" aria-label="判断、配仓、结算、复盘、校准的闭环">{['判断', '配仓', '结算', '复盘', '校准'].map((label, i) => <span key={label} style={{ '--i': i }}>{label}{i < 4 && <b>→</b>}</span>)}<i>↺</i></div>
            <div className="tour-explore">{[['总览', '/dashboard'], ['深度分析', '/dashboard/analysis'], ['历史记录', '/history'], ['球队档案', '/history/teams']].map(([label, route]) => <button key={route} onClick={() => explore(route)}>{label} ↗</button>)}</div>
          </>}
          {!reveal && <div className="tour-stage-actions">
            {welcome ? <button className="tour-primary" onClick={() => start(state.track)}><Play size={12} fill="currentColor" /> 开始导览 · {trackLabel(state.track)}<svg viewBox="0 0 20 20" className="tour-countdown" aria-hidden="true"><circle cx="10" cy="10" r="8" style={{ strokeDashoffset: 50.27 * (1 - countdown / 4000) }} /></svg></button> : <button className="tour-primary" onClick={close}>自己逛逛</button>}
            {welcome ? <button className="tour-secondary" onClick={close}>自己逛逛</button> : <><button className="tour-secondary" onClick={() => start(state.track)}><RotateCcw size={12} /> 重播</button><a className="tour-secondary" href="https://github.com/hydeclanspi/eivra-studio" target="_blank" rel="noreferrer">GitHub <ExternalLink size={11} /></a></>}
          </div>}
          {!reveal && <small className="tour-footnote">{welcome ? '演示数据已脱敏 · 操作仅在浏览器内进行 · 字幕导览' : '演示数据，仅展示产品形态与算法能力，不构成投资建议。'}</small>}
          <button className="tour-stage-close tour-icon" onClick={close} aria-label="退出导览"><X size={14} /></button>
        </div>}
        {form === 'talk' && <>
          <span className="tour-signature">EIVRA</span>
          <div className="tour-meta"><span><em>{act[0]}</em>{act[1]}</span><time>{time(progress * total)} / {time(total)}</time><button className="tour-icon" onClick={pause} aria-label="暂停导览"><Pause size={12} /></button><button className="tour-icon" onClick={close} aria-label="退出导览"><X size={13} /></button></div>
          <div className="tour-caption" aria-live="polite" aria-atomic="true"><span className="sr-only">{body}</span><span aria-hidden="true" key={`${ids[state.index]}-${body}`}>{[...body].map((char, i) => <span className="tour-char" key={i} style={{ animationDelay: `${reduced ? 0 : i * 42 + (step.act === 5 && i > 6 ? 600 : 0)}ms` }}>{char}</span>)}</span></div>
          {step.act === 5 && <button className="tour-guide" onClick={openGuide}>打开完整指南 ↗</button>}
          <div className="tour-timeline"><b style={{ transform: `scaleX(${progress})` }} /><input type="range" min="0" max="1" step="0.001" value={progress} aria-label="导览进度，拖动跳转片段" aria-valuetext={`${time(progress * total)}，${STEPS[ids[stepAtProgress(state.track, progress)]].title}`} title="拖动回看或跳转片段" onPointerDown={() => { setScrub(progress); beginSeek() }} onChange={(event) => setScrub(Number(event.target.value))} onPointerUp={(event) => commitSeek(event.currentTarget.value)} onPointerCancel={() => commitSeek(elapsed / total)} onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) beginSeek() }} onKeyUp={(event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) commitSeek(event.currentTarget.value) }} onBlur={(event) => { if (scrub != null) commitSeek(event.currentTarget.value) }} />{ids.map((id, i) => i && STEPS[id].act !== STEPS[ids[i - 1]].act ? <i key={id} style={{ left: `${stepOffset(state.track, i) / total * 100}%` }} /> : null)}</div>
        </>}
      </div>
    </section>
    {pointer && !reduced && <div key={pointer.token} className="tour-pointer" aria-hidden="true" style={{ left: pointer.to[0], top: pointer.to[1], '--from-x': `${pointer.from[0] - pointer.to[0]}px`, '--from-y': `${pointer.from[1] - pointer.to[1]}px` }}><i /><b /></div>}
  </div>, document.body)
}
