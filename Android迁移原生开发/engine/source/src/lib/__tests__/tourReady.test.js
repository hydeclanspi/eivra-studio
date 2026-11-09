import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { waitForInitialPage } from '../../components/tour/tourReady'
import { ENTRY_DELAY_MS } from '../tour/tourScript'

describe('welcome waits for a readable page', () => {
  let page, clockOffset, ctl, offered
  const image = (overrides = {}) => ({ complete: true, naturalWidth: 100, src: '/logo.svg', getBoundingClientRect: () => ({ top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 }), ...overrides })
  const start = () => waitForInitialPage(ctl.signal, ENTRY_DELAY_MS).then(offered)
  beforeEach(() => {
    vi.useFakeTimers(); clockOffset = 0; ctl = new AbortController(); offered = vi.fn()
    page = { dataset: { tourReady: 'true' }, getClientRects: () => [{}], querySelectorAll: () => [], children: [], scrollHeight: 1000, offsetTop: 0, offsetLeft: 0, offsetWidth: 1200, offsetHeight: 1000 }
    vi.stubGlobal('document', { hidden: false, readyState: 'complete', fonts: { status: 'loaded' }, images: [], querySelector: () => page })
    vi.stubGlobal('window', { innerHeight: 800, innerWidth: 1200 })
    vi.stubGlobal('requestAnimationFrame', (fn) => setTimeout(() => fn(Date.now() + clockOffset), 16))
    vi.stubGlobal('cancelAnimationFrame', clearTimeout)
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('does not time out slow loads and starts 3.75 seconds after calibration, fonts and document are ready', async () => {
    document.readyState = 'loading'; document.fonts.status = 'loading'; page.dataset.tourReady = 'false'
    const result = start()
    await vi.advanceTimersByTimeAsync(20000); expect(offered).not.toHaveBeenCalled()
    document.readyState = 'complete'; document.fonts.status = 'loaded'
    await vi.advanceTimersByTimeAsync(4000); expect(offered).not.toHaveBeenCalled()
    page.dataset.tourReady = 'true'
    await vi.advanceTimersByTimeAsync(3750); expect(offered).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(32); await result; expect(offered).toHaveBeenCalledOnce()
  })
  it('waits for images to finish decoding and notices images added during the reading window', async () => {
    let decode
    const img = image({ complete: false, decode: vi.fn(() => new Promise((resolve) => { decode = resolve })) })
    const result = start()
    await vi.advanceTimersByTimeAsync(2000)
    document.images.push(img)
    await vi.advanceTimersByTimeAsync(4000); expect(offered).not.toHaveBeenCalled()
    img.complete = true
    await vi.advanceTimersByTimeAsync(4000); expect(offered).not.toHaveBeenCalled(); expect(img.decode).toHaveBeenCalledOnce()
    decode()
    await vi.advanceTimersByTimeAsync(3750); expect(offered).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(32); await result; expect(offered).toHaveBeenCalledOnce()
  })
  it('rechecks a changed image source even when the element is reused', async () => {
    const img = image({ decode: vi.fn(() => Promise.resolve()) }); document.images.push(img)
    const result = start()
    await vi.advanceTimersByTimeAsync(2000)
    img.src = '/new-logo.svg'
    await vi.advanceTimersByTimeAsync(2000); expect(offered).not.toHaveBeenCalled(); expect(img.decode).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1800); await result; expect(offered).toHaveBeenCalledOnce()
  })
  it('settles failed images and skips offscreen lazy images', async () => {
    document.images.push(image({ naturalWidth: 0 }), image({ decode: () => Promise.reject(Error('decode failed')) }), image({ loading: 'lazy', complete: false, getBoundingClientRect: () => ({ top: 1500, bottom: 1600, left: 0, right: 100, width: 100, height: 100 }) }))
    const result = start()
    await vi.advanceTimersByTimeAsync(3800); await result; expect(offered).toHaveBeenCalledOnce()
  })
  it('restarts the reading window when content moves or fonts start loading again', async () => {
    const result = start()
    await vi.advanceTimersByTimeAsync(2000)
    page.scrollHeight = 1200
    await vi.advanceTimersByTimeAsync(2000); expect(offered).not.toHaveBeenCalled()
    document.fonts.status = 'loading'
    await vi.advanceTimersByTimeAsync(4000); expect(offered).not.toHaveBeenCalled()
    document.fonts.status = 'loaded'
    await vi.advanceTimersByTimeAsync(3780); await result; expect(offered).toHaveBeenCalledOnce()
  })
  it.each(['hidden', 'stalled'])('does not count a %s page as reading time', async (condition) => {
    const result = start()
    await vi.advanceTimersByTimeAsync(2000)
    if (condition === 'hidden') {
      document.hidden = true
      await vi.advanceTimersByTimeAsync(5000); expect(offered).not.toHaveBeenCalled()
      document.hidden = false
    } else clockOffset = 5000
    await vi.advanceTimersByTimeAsync(2000); expect(offered).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1800); await result; expect(offered).toHaveBeenCalledOnce()
  })
  it('waits for a mounted visible page and its busy region', async () => {
    const mounted = page; page = null
    const result = start()
    await vi.advanceTimersByTimeAsync(4000); expect(offered).not.toHaveBeenCalled()
    page = mounted; page.getClientRects = () => []
    await vi.advanceTimersByTimeAsync(4000); expect(offered).not.toHaveBeenCalled()
    page.getClientRects = () => [{}]; page.querySelectorAll = () => [{ getClientRects: () => [{}] }]
    await vi.advanceTimersByTimeAsync(4000); expect(offered).not.toHaveBeenCalled()
    page.querySelectorAll = () => []
    await vi.advanceTimersByTimeAsync(3780); await result; expect(offered).toHaveBeenCalledOnce()
  })
  it.each([false, true])('cancels cleanly, including an already aborted signal (%s)', async (preAborted) => {
    if (preAborted) ctl.abort()
    const result = start().catch((error) => error.name)
    ctl.abort()
    expect(await result).toBe('AbortError'); expect(vi.getTimerCount()).toBe(0); expect(offered).not.toHaveBeenCalled()
  })
})
