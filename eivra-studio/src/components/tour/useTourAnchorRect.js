import { useEffect, useState } from 'react'
import { rectOf } from './tourDom'

export default function useTourAnchorRect(element) {
  const [rect, setRect] = useState(null)
  useEffect(() => {
    if (!element) { setRect(null); return undefined }
    let frame
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = rectOf(element)
        // Keep the hole inside the viewport even for very tall cards.
        const top = Math.max(72, r.top - 8), bottom = Math.min(window.innerHeight - 12, r.bottom + 8)
        setRect({ left: Math.max(8, r.left - 8), top, width: Math.min(window.innerWidth - 16, r.width + 16), height: Math.max(0, bottom - top), radius: r.radius })
      })
    }
    const observer = new ResizeObserver(update)
    observer.observe(element)
    window.addEventListener('resize', update)
    document.addEventListener('scroll', update, true)
    update()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', update); document.removeEventListener('scroll', update, true) }
  }, [element])
  return rect
}
