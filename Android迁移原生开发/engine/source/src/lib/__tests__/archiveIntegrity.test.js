import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const manifest = JSON.parse(readFileSync(resolve(root, 'archive/dugou-legacy.manifest.json'), 'utf8'))
const snapshot = resolve(root, 'archive/dugou-legacy')
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const walk = (directory, prefix = '') => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const relative = `${prefix}${entry.name}`
  return entry.isDirectory() ? walk(resolve(directory, entry.name), `${relative}/`) : [relative]
})

describe('frozen pre-migration source', () => {
  it('keeps exactly the baseline file set and bytes', () => {
    expect(walk(snapshot).sort()).toEqual(manifest.files.map((file) => file.path).sort())
    for (const file of manifest.files) {
      expect(sha256(readFileSync(resolve(snapshot, file.path))), file.path).toBe(file.sha256)
    }
  })

  it('preserves every existing graphical asset in the active application', () => {
    const images = manifest.files.filter((file) => /\.(svg|png|jpe?g|webp|ico)$/i.test(file.path))
    expect(images.length).toBeGreaterThan(0)
    for (const file of images) {
      expect(sha256(readFileSync(resolve(root, file.path))), file.path).toBe(file.sha256)
    }
  })
})
