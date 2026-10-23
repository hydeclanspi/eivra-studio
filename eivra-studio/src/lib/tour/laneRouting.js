const intersects = (a, b, r) => a[0] === b[0]
  ? a[0] > r.left + 1 && a[0] < r.right - 1 && Math.max(a[1], b[1]) > r.top + 1 && Math.min(a[1], b[1]) < r.bottom - 1
  : a[1] === b[1]
    ? a[1] > r.top + 1 && a[1] < r.bottom - 1 && Math.max(a[0], b[0]) > r.left + 1 && Math.min(a[0], b[0]) < r.right - 1
    : false
export const pathClear = (points, rects) => points.every((point, i) => !i || rects.every((r) => !intersects(points[i - 1], point, r)))
export const pathLength = (points) => points.reduce((n, p, i) => n + (i ? Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) : 0), 0)

// Only actual open gaps qualify. Nested cards are removed by the DOM adapter.
export function computeLanes(rects, minGap = 12) {
  const lanes = []
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j]
    const left = a.left < b.left ? a : b, right = left === a ? b : a
    const top = a.top < b.top ? a : b, bottom = top === a ? b : a
    if (right.left - left.right >= minGap && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)) {
      const x = (left.right + right.left) / 2
      lanes.push({ axis: 'V', a: [x, Math.min(a.top, b.top)], b: [x, Math.max(a.bottom, b.bottom)] })
    }
    if (bottom.top - top.bottom >= minGap && Math.min(a.right, b.right) > Math.max(a.left, b.left)) {
      const y = (top.bottom + bottom.top) / 2
      lanes.push({ axis: 'H', a: [Math.min(a.left, b.left), y], b: [Math.max(a.right, b.right), y] })
    }
  }
  return lanes.filter((l, i) => pathClear([l.a, l.b], rects) && !lanes.slice(0, i).some((p) => JSON.stringify(p) === JSON.stringify(l)))
}
export function beamRoute(start, target, lanes, obstacles, mobile = false) {
  const ends = [[target.left, Math.max(target.top, Math.min(start[1], target.bottom))], [target.right, Math.max(target.top, Math.min(start[1], target.bottom))], [Math.max(target.left, Math.min(start[0], target.right)), target.top], [Math.max(target.left, Math.min(start[0], target.right)), target.bottom]]
  ends.sort((a, b) => pathLength([start, a]) - pathLength([start, b]))
  if (mobile) return [start, ends[0]]
  const candidates = []
  for (const end of ends) {
    candidates.push([start, [start[0], end[1]], end], [start, [end[0], start[1]], end])
    for (const lane of lanes) {
      if (lane.axis === 'V') candidates.push([start, [lane.a[0], start[1]], [lane.a[0], end[1]], end])
      else candidates.push([start, [start[0], lane.a[1]], [end[0], lane.a[1]], end])
      for (const other of lanes) if (lane.axis !== other.axis) {
        const x = (lane.axis === 'V' ? lane : other).a[0], y = (lane.axis === 'H' ? lane : other).a[1]
        candidates.push(lane.axis === 'V' ? [start, [x, start[1]], [x, y], [end[0], y], end] : [start, [start[0], y], [x, y], [x, end[1]], end])
      }
    }
  }
  return candidates.filter((p) => pathClear(p, obstacles)).sort((a, b) => pathLength(a) - pathLength(b))[0] || [start, ends[0]]
}
export function sampleLaserSpeed(random = Math.random) {
  let z
  do { z = Math.sqrt(-2 * Math.log(Math.max(Number.EPSILON, random()))) * Math.cos(2 * Math.PI * random()) } while (Math.abs(z) > 3)
  return .7 + .1 * z
}
export function laserWave(lanes, opening = false, random = Math.random) {
  const wave = random(), count = opening ? 3 : wave < .07 ? 3 : wave < .27 ? 2 : 1
  const horizontal = lanes.filter((l) => l.axis === 'H').length
  const vertical = lanes.length - horizontal
  const pool = lanes.map((lane) => ({ lane, weight: lane.axis === 'H' ? .7 / horizontal : .3 / vertical }))
  const shots = []
  while (shots.length < count && pool.length) {
    let pick = random() * pool.reduce((n, p) => n + p.weight, 0), i = 0
    while (i < pool.length - 1 && pick >= pool[i].weight) { pick -= pool[i].weight; i++ }
    const { lane } = pool.splice(i, 1)[0]
    shots.push({ lane, reverse: random() < (lane.axis === 'H' ? .5 : 4 / 30), duration: (lane.axis === 'H' ? 680 : 840) / sampleLaserSpeed(random) })
  }
  return shots
}
