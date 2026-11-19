import { brandLocalStorage } from './brandStorage'
import { isPreviewMode } from './displayMode'
import { previewRead, previewWrite } from './previewStore'

export const copy = (value) => JSON.parse(JSON.stringify(value))
export const uid = (prefix) => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`}`
export const stableJSON = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJSON).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJSON(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}
// Content identity only; not a cryptographic signature or proof of provenance.
export const contentId = (value) => {
  let a = 2166136261; let b = 2246822519
  const data = stableJSON(value)
  for (let i = 0; i < data.length; i += 1) {
    a = Math.imul(a ^ data.charCodeAt(i), 16777619)
    b = Math.imul(b ^ data.charCodeAt(i), 3266489917)
  }
  return `${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`
}

export function quantStore(key, arrayFields, maxBytes = 4 * 1024 * 1024) {
  const empty = () => ({ schemaVersion: 1, ...Object.fromEntries(arrayFields.map((field) => [field, []])) })
  const assert = (store) => {
    if (!store || store.schemaVersion !== 1 || arrayFields.some((field) => !Array.isArray(store[field]))) throw new Error('研究存储格式不兼容，原数据已保留。请先导出备份。')
    for (const field of arrayFields) {
      const ids = new Set()
      for (const item of store[field]) {
        if (!item?.id || ids.has(item.id)) throw new Error('研究存储有缺失或重复标识，原数据已保留。')
        ids.add(item.id)
      }
    }
    return store
  }
  const read = () => {
    if (typeof window === 'undefined') return empty()
    if (isPreviewMode()) return copy(assert(previewRead(key, empty())))
    const raw = brandLocalStorage.getItem(key)
    if (raw == null) return empty()
    try { return copy(assert(JSON.parse(raw))) }
    catch (error) { throw new Error(`无法读取研究记录：${error.message}。没有覆盖原数据。`) }
  }
  const write = (store) => {
    assert(store)
    if (typeof window === 'undefined') throw new Error('当前环境无法保存浏览器研究记录。')
    const raw = JSON.stringify(store)
    if (raw.length * 2 > maxBytes) throw new Error('本地研究记录达到容量上限，本次未保存；请先导出备份。')
    const preview = isPreviewMode()
    if (preview) previewWrite(key, copy(store))
    else brandLocalStorage.setItem(key, raw)
    window.dispatchEvent(new CustomEvent('eivra:data-changed', { detail: { key, preview } }))
    return copy(store)
  }
  return { empty, assert, read, write }
}

export const immutableUnion = (left, right) => {
  const items = new Map(left.map((item) => [item.id, item]))
  for (const item of right) {
    const previous = items.get(item.id)
    if (previous && stableJSON(previous) !== stableJSON(item)) throw new Error(`不可变记录冲突：${item.id}，未覆盖旧记录。`)
    items.set(item.id, item)
  }
  return [...items.values()]
}
