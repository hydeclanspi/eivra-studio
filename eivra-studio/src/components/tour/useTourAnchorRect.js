import { useLayoutEffect, useState } from 'react'
import { clipAnchorRect, sameAnchorRect } from '../../lib/tour/anchorGeometry'
import { findAnchor, rectOf } from './tourDom'

export default function useTourAnchorRect(name) {
  const [target, setTarget] = useState({ rect: null, tag: '' })
  useLayoutEffect(() => {
    let frame
    const update = () => {
      // ResizeObserver misses position-only layout shifts and transforms.
      // Re-resolve the logical target after remounts or collapsed variants.
      // Stable frames do not trigger a React render.
      const element = name ? findAnchor(name) : null
      const container = element?.closest('.app-main-scroll')?.getBoundingClientRect()
      const bounds = { left: 8, top: Math.max(72, container?.top || 0), right: window.innerWidth - 8, bottom: Math.min(window.innerHeight - 12, container?.bottom || window.innerHeight) }
      const rect = clipAnchorRect(rectOf(element), bounds)
      const tag = element?.dataset.tourTag || ''
      setTarget((previous) => sameAnchorRect(previous.rect, rect) && previous.tag === tag ? previous : { rect, tag })
      if (name) frame = requestAnimationFrame(update)
    }
    update()
    return () => cancelAnimationFrame(frame)
  }, [name])
  return target
}
