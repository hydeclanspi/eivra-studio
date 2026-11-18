// Adapted from Lucent @3789a00 and the supplied c27 study. Viewport coordinates.
import { pathLength, laserWave } from './laneRouting'
const clamp = (n) => Math.max(0, Math.min(1, n))
const lerp = (a, b, p) => a + (b - a) * p
const ease = (p) => p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2
  function beamPoly(c, pts, k, alpha, add) {
    if (alpha <= 0 || pts.length < 2) return;
    c.save(); c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.lineCap = 'round'; c.lineJoin = 'round';
    const layers = add
      ? [[11, `rgba(110,170,255,${0.1 * alpha})`], [4.2, `rgba(130,190,255,${0.34 * alpha})`], [1.15, `rgba(226,240,255,${0.95 * alpha})`], [0.42, `rgba(255,255,255,${alpha})`]]
      : [[16, `rgba(70,147,255,${0.07 * alpha})`], [9, `rgba(70,147,255,${0.16 * alpha})`], [4.2, `rgba(56,137,255,${0.42 * alpha})`], [1.9, `rgba(105,172,255,${alpha})`], [0.85, `rgba(255,255,255,${0.95 * alpha})`]];
    layers.forEach(l => { c.strokeStyle = l[1]; c.lineWidth = l[0] * k; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); });
    const [x1, y1] = pts[pts.length - 1], g = c.createRadialGradient(x1, y1, 0, x1, y1, 16 * k);
    g.addColorStop(0, `rgba(255,255,255,${0.95 * alpha})`); g.addColorStop(0.25, add ? `rgba(190,225,255,${0.45 * alpha})` : `rgba(105,172,255,${0.5 * alpha})`); g.addColorStop(1, 'rgba(120,180,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x1, y1, 16 * k, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function flare(c, x, y, a, s, add) {
    if (a <= 0.002) return;
    const hue = ['80,140,255', '110,165,255', add ? '220,236,255' : '150,200,255'];
    c.save(); c.globalCompositeOperation = add ? 'lighter' : 'source-over';
    const w = 560 * s, g = c.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, `rgba(${hue[0]},0)`); g.addColorStop(0.35, `rgba(${hue[1]},${0.18 * a})`); g.addColorStop(0.5, `rgba(${hue[2]},${0.75 * a})`); g.addColorStop(0.65, `rgba(${hue[1]},${0.18 * a})`); g.addColorStop(1, `rgba(${hue[0]},0)`);
    c.fillStyle = g; c.fillRect(x - w, y - 1.3 * s * 3, 2 * w, 2.6 * s * 3);
    const r = 80 * s, h = c.createRadialGradient(x, y, 0, x, y, r);
    h.addColorStop(0, `rgba(255,255,255,${a})`); h.addColorStop(0.1, `rgba(${hue[2]},${0.75 * a})`); h.addColorStop(0.35, `rgba(${hue[1]},${0.16 * a})`); h.addColorStop(1, `rgba(${hue[0]},0)`);
    c.fillStyle = h; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.restore();
  }

function pointAt(points, distance) {
  for (let i = 1; i < points.length; i++) {
    const length = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
    if (distance <= length) return [lerp(points[i - 1][0], points[i][0], distance / (length || 1)), lerp(points[i - 1][1], points[i][1], distance / (length || 1)), i]
    distance -= length
  }
  return [...points.at(-1), points.length - 1]
}
export function createLightRenderer(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return { play() {}, clear() {}, dispose() {} }
  let effects = [], raf = 0, disposed = false
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  const clear = () => { effects = []; cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, canvas.width, canvas.height) }
  const draw = (now) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const dark = document.documentElement.classList.contains('liquid-glass-dark')
    effects = effects.filter((fx) => {
      const p = clamp((now - fx.start) / fx.duration)
      if (p >= 1) return false
      ctx.save(); ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over'
      if (fx.kind === 'beam') {
        const length = pathLength(fx.points), hd = ease(p) * length, td = Math.max(ease(clamp(p * 1.35 - .35)) * length, hd - 220)
        const head = pointAt(fx.points, hd), tail = pointAt(fx.points, td), points = [tail]
        for (let i = tail[2]; i < head[2]; i++) points.push(fx.points[i])
        points.push(head); beamPoly(ctx, points, 1, 1, dark)
        if (p > .65) { const end = fx.points.at(-1); flare(ctx, end[0], end[1], Math.sin((p - .65) / .35 * Math.PI) * .7, .3, dark) }
      } else if (fx.kind === 'sweep') {
        ctx.translate(lerp(-440, window.innerWidth + 440, .5 - Math.cos(Math.PI * p) / 2), window.innerHeight / 2); ctx.rotate(-.42)
        const g = ctx.createLinearGradient(-220, 0, 220, 0)
        g.addColorStop(0, 'rgba(200,226,255,0)'); g.addColorStop(.5, `rgba(200,226,255,${Math.sin(Math.PI * p) * .65})`); g.addColorStop(1, 'rgba(200,226,255,0)')
        ctx.fillStyle = g; ctx.fillRect(-220, -window.innerHeight * 2, 440, window.innerHeight * 4)
      } else if (fx.kind === 'scan') {
        const r = fx.rect, x = lerp(r.left, r.right, ease(p)), a = Math.sin(Math.PI * p)
        const g = ctx.createLinearGradient(x - 54, 0, x, 0)
        g.addColorStop(0, 'rgba(105,172,255,0)'); g.addColorStop(1, `rgba(105,172,255,${a * .25})`)
        ctx.fillStyle = g; ctx.fillRect(x - 54, r.top, 54, r.height)
        ctx.fillStyle = `rgba(105,172,255,${a})`; ctx.fillRect(x, r.top, 1.6, r.height)
        flare(ctx, x, r.top, a * .5, .16, dark); flare(ctx, x, r.bottom, a * .5, .16, dark)
      } else if (fx.kind === 'lasers') {
        const age = now - fx.start, on = Math.min(clamp(age / 400), clamp((fx.duration - age) / 400))
        if (age >= fx.next) {
          const shots = laserWave(fx.lanes, fx.next === 275)
          fx.shots.push(...shots.map((s) => ({ ...s, start: now })))
          fx.next = age + Math.max(1530 + Math.random() * 1640, ...shots.map((s) => s.duration + 90))
        }
        fx.lanes.forEach((l, i) => {
          const vertical = l.axis === 'V'
          ctx.setLineDash([5, 7]); ctx.lineDashOffset = -(age / 1000 * 46 + i * 13); ctx.lineWidth = 1.3
          for (const side of [-1, 1]) {
            const g = ctx.createLinearGradient(...l.a, ...l.b)
            g.addColorStop(0, `rgba(180,149,96,${on * .8})`); g.addColorStop(.5, `rgba(255,242,207,${on * .95})`); g.addColorStop(1, `rgba(255,255,255,${on * .75})`)
            ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(l.a[0] + (vertical ? 4 * side : 0), l.a[1] + (vertical ? 0 : 4 * side)); ctx.lineTo(l.b[0] + (vertical ? 4 * side : 0), l.b[1] + (vertical ? 0 : 4 * side)); ctx.stroke()
          }
          ctx.setLineDash([]); ctx.strokeStyle = `rgba(150,200,255,${on * .2})`; ctx.lineWidth = 4
          ctx.beginPath(); ctx.moveTo(...l.a); ctx.lineTo(...l.b); ctx.stroke()
        })
        fx.shots = fx.shots.filter((s) => {
          const u = (now - s.start) / s.duration
          if (u > 1.25) return false
          const a = s.reverse ? s.lane.b : s.lane.a, b = s.reverse ? s.lane.a : s.lane.b
          const length = pathLength([a, b]), distance = u * (length + 150)
          const head = pointAt([a, b], Math.min(distance, length)), tail = pointAt([a, b], Math.max(0, Math.min(distance - 150, length)))
          if (pathLength([head, tail]) > .5) {
            const g = ctx.createLinearGradient(tail[0], tail[1], head[0], head[1])
            g.addColorStop(0, 'rgba(105,172,255,0)'); g.addColorStop(.55, `rgba(105,172,255,${on * .85})`); g.addColorStop(.85, `rgba(180,221,255,${on})`); g.addColorStop(1, `rgba(255,255,255,${on})`)
            ctx.strokeStyle = g; ctx.lineCap = 'round'
            for (const [w, alpha] of [[11, .16], [3.2, 1]]) { ctx.lineWidth = w; ctx.globalAlpha = alpha; ctx.beginPath(); ctx.moveTo(tail[0], tail[1]); ctx.lineTo(head[0], head[1]); ctx.stroke() }
          }
          return true
        })
      }
      ctx.restore(); return true
    })
    raf = effects.length && !disposed ? requestAnimationFrame(draw) : 0
  }
  resize(); window.addEventListener('resize', resize)
  return {
    play(effect) { if (disposed) return; effects.push({ ...effect, start: performance.now(), shots: [], next: 275 }); if (!raf) raf = requestAnimationFrame(draw) },
    clear,
    dispose() { disposed = true; clear(); window.removeEventListener('resize', resize) },
  }
}
