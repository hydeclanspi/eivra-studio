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

export async function waitForInitialPage(signal, minimumMs) {
  const started = performance.now()
  await delay(minimumMs, signal)
  // Slow images/fonts may still be loading after the minimum reading window.
  // A blocked third-party resource must not prevent the tour forever.
  while ((document.readyState !== 'complete' || document.fonts?.status === 'loading') && performance.now() - started < minimumMs + 15000) {
    await delay(100, signal)
  }
}
