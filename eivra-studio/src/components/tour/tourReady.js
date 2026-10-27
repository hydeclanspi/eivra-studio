import { abortError, delay } from '../../lib/tour/tourBus'

export async function waitForOverviewPaint(signal) {
  while (document.querySelector('.tour-stage')?.dataset.phase !== 'settling') await delay(16, signal)
  await new Promise((resolve, reject) => {
    let frame
    const cancel = () => { cancelAnimationFrame(frame); reject(abortError()) }
    if (signal.aborted) { reject(abortError()); return }
    signal.addEventListener('abort', cancel, { once: true })
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => { signal.removeEventListener('abort', cancel); resolve() })
    })
  })
}

// A page can paint before its idle calibration or image decoding completes.
// Wait for those explicit resources, then require an uninterrupted reading
// window. No network-idle heuristic: sync/animations may continue indefinitely.
export function waitForInitialPage(signal, minimumMs, selector = '[data-tour-page="new"]') {
  return new Promise((resolve, reject) => {
    let frame, previousFrame = null, readySince = null, previousSignature = null
    const decoded = new WeakMap()
    const cleanup = () => { cancelAnimationFrame(frame); signal.removeEventListener('abort', cancel) }
    const cancel = () => { cleanup(); reject(abortError()) }
    if (signal.aborted) { cancel(); return }
    signal.addEventListener('abort', cancel, { once: true })

    const sample = () => {
      if (document.hidden || document.readyState !== 'complete' || document.fonts?.status === 'loading') return null
      const page = document.querySelector(selector)
      if (!page || page.dataset.tourReady === 'false' || !page.getClientRects().length) return null
      if ([...page.querySelectorAll('[aria-busy="true"], [data-tour-ready="false"]')].some((el) => el.getClientRects().length)) return null

      const assets = []
      for (const img of document.images) {
        const rect = img.getBoundingClientRect()
        // Offscreen lazy images intentionally do not load until scrolled to.
        if (img.loading === 'lazy' && (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth)) continue
        if (!img.complete) return null
        const src = img.currentSrc || img.src
        let state = decoded.get(img)
        if (!state || state.src !== src) {
          state = { src, ready: !img.decode || !img.naturalWidth }
          decoded.set(img, state)
          if (!state.ready) {
            // A failed image is settled too; it must not deadlock the welcome.
            Promise.resolve().then(() => img.decode()).catch(() => {}).then(() => { state.ready = true })
          }
        }
        if (!state.ready) return null
        assets.push(src)
      }

      // Sample layout boxes, not animated CSS transforms inside decorations.
      const boxes = [page, ...page.children].map((el) => [el.offsetTop, el.offsetLeft, el.offsetWidth, el.offsetHeight].join(','))
      return [page.scrollHeight, ...boxes, ...assets].join('|')
    }
    const tick = (now) => {
      const signature = sample()
      const stalled = previousFrame !== null && now - previousFrame > 250
      if (signature === null || signature !== previousSignature || stalled) readySince = signature === null ? null : now
      previousFrame = now; previousSignature = signature
      if (readySince !== null && now - readySince >= minimumMs) { cleanup(); resolve(); return }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  })
}
