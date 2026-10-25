// DOMRects already include application zoom; overlays use viewport pixels.
export function clipAnchorRect(rect, bounds, padding = 8) {
  if (!rect || rect.width <= 0 || rect.height <= 0 || rect.bottom <= bounds.top || rect.top >= bounds.bottom || rect.right <= bounds.left || rect.left >= bounds.right) return null
  const left = Math.max(bounds.left, rect.left - padding)
  const top = Math.max(bounds.top, rect.top - padding)
  const right = Math.min(bounds.right, rect.right + padding)
  const bottom = Math.min(bounds.bottom, rect.bottom + padding)
  return { left, top, width: right - left, height: bottom - top, radius: rect.radius }
}
export function sameAnchorRect(a, b) {
  if (!a || !b) return a === b
  return ['left', 'top', 'width', 'height', 'radius'].every((key) => Math.abs(a[key] - b[key]) < .25)
}
