const actions = new Map()
const cache = new Map()
export const abortError = () => new DOMException('Tour cancelled', 'AbortError')
export function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(abortError()); return }
    const cancel = () => { clearTimeout(timer); reject(abortError()) }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve() }, ms)
    signal?.addEventListener('abort', cancel, { once: true })
  })
}
export const tourCache = { get: (key) => cache.get(key), set: (key, value) => cache.set(key, value), delete: (key) => cache.delete(key), clear: () => cache.clear() }
export const tourBus = {
  register(name, handler) { actions.set(name, handler); return () => { if (actions.get(name) === handler) actions.delete(name) } },
  async run(name, payload = {}, { signal, timeoutMs = 8000 } = {}) {
    const controller = new AbortController()
    const cancel = () => controller.abort()
    signal?.addEventListener('abort', cancel, { once: true })
    if (signal?.aborted) controller.abort()
    const timeout = setTimeout(cancel, timeoutMs)
    try {
      while (!actions.has(name)) await delay(40, controller.signal)
      if (controller.signal.aborted) throw abortError()
      return await Promise.race([
        actions.get(name)({ ...payload, signal: controller.signal }),
        delay(timeoutMs + 10, controller.signal).then(() => ({ ok: false, reason: 'timeout' })),
      ])
    } catch (error) {
      if (signal?.aborted) throw abortError()
      return { ok: false, reason: error.name === 'AbortError' ? 'timeout' : 'action_failed' }
    } finally { clearTimeout(timeout); signal?.removeEventListener('abort', cancel); controller.abort() }
  },
}
