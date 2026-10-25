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
  // Start the reading window after load, with a cap for blocked resources.
  while ((document.readyState !== 'complete' || document.fonts?.status === 'loading') && performance.now() - started < 15000) {
    await delay(100, signal)
  }
  await delay(minimumMs, signal)
}
