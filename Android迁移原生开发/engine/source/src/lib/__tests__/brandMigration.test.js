import { afterEach, describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx'
import { createBrandStorage } from '../brandStorage.js'
import { getDisplayMode, lockToPreview, FULL_MODE, PREVIEW_MODE } from '../displayMode.js'
import { buildDataWorkbook, parseDataBundleFromWorkbook } from '../excel.js'
import { encryptJson, decryptJson, requireOwner } from '../../../api/_shared.js'
import { LEGACY_BRAND, isTimeSnapshotSchema } from '../../../shared/brandCompatibility.js'

const memoryStorage = (entries = []) => {
  const values = new Map(entries)
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('brand storage migration', () => {
  it.each([
    ['investments.v1', '[{"id":"historic-position"}]'],
    ['new_investment_draft.v1', '{"note":"unsaved draft"}'],
    ['genesis_applied.v1', '1'],
  ])('preserves legacy %s before any new writes', (suffix, value) => {
    const legacy = `${LEGACY_BRAND.storagePrefix}.${suffix}`
    const current = `eivra.${suffix}`
    const storage = memoryStorage([[legacy, value]])
    const migrated = createBrandStorage(() => storage)
    expect(migrated.getItem(current)).toBe(value)
    expect(storage.getItem(current)).toBe(value)
    expect(storage.getItem(legacy)).toBe(value)
    migrated.setItem(current, 'newer value')
    expect(migrated.getItem(current)).toBe('newer value')
    expect(storage.getItem(legacy)).toBe(value)
  })

  it('keeps existing Eivra preferences and handles colon keys', () => {
    const storage = memoryStorage([
      [`${LEGACY_BRAND.storagePrefix}:layout-mode`, 'classic'],
      ['eivra:layout-mode', 'modern'],
    ])
    expect(createBrandStorage(() => storage).getItem('eivra:layout-mode')).toBe('modern')
  })

  it('does not resurrect a submitted legacy draft after clearing', () => {
    const storage = memoryStorage([[`${LEGACY_BRAND.storagePrefix}.new_investment_draft.v1`, 'draft']])
    const migrated = createBrandStorage(() => storage)
    migrated.removeItem('eivra.new_investment_draft.v1')
    expect(migrated.getItem('eivra.new_investment_draft.v1')).toBeNull()
    expect(storage.values.size).toBe(0)
  })

  it('can read old data when the migration copy exceeds quota, but never claims a new write succeeded', () => {
    const storage = memoryStorage([[`${LEGACY_BRAND.storagePrefix}.investments.v1`, 'saved']])
    storage.setItem = () => { throw new Error('quota') }
    const migrated = createBrandStorage(() => storage)
    expect(migrated.getItem('eivra.investments.v1')).toBe('saved')
    expect(() => migrated.setItem('eivra.investments.v1', 'changed')).toThrow('quota')
    expect(storage.values.size).toBe(1)
  })

  it('preserves an unlocked session and clears both aliases on relock', () => {
    const sessionStorage = memoryStorage([[`${LEGACY_BRAND.storagePrefix}.full_session_latch.v1`, '1']])
    vi.stubGlobal('window', { location: { pathname: '/new' }, sessionStorage, dispatchEvent: vi.fn() })
    vi.stubGlobal('CustomEvent', class { constructor(type) { this.type = type } })
    expect(getDisplayMode()).toBe(FULL_MODE)
    lockToPreview()
    expect(getDisplayMode()).toBe(PREVIEW_MODE)
    expect(sessionStorage.values.size).toBe(0)
  })
})

describe('brand protocol compatibility', () => {
  it('accepts both client generations with the existing route-marker semantics', () => {
    for (const header of ['x-eivra-arsenal', LEGACY_BRAND.ownerHeader]) {
      expect(requireOwner({ headers: { [header]: '1' } }).ok).toBe(true)
    }
  })

  it('reads old encrypted envelopes and writes the Eivra schema without changing payloads', () => {
    const payload = { investments: [{ id: 'synthetic-1' }], system_config: { initialCapital: 100 } }
    const envelope = encryptJson(payload, 'synthetic-test-secret')
    expect(envelope.schema).toBe('eivra_enc_v1')
    expect(decryptJson({ ...envelope, schema: 'dugou_enc_v1' }, 'synthetic-test-secret')).toEqual(payload)
    expect(decryptJson(envelope, 'synthetic-test-secret')).toEqual(payload)
    expect(decryptJson(envelope, 'incorrect-secret')).toBeNull()
  })

  it('recognizes both time-snapshot generations without accepting an unrelated schema', () => {
    expect(isTimeSnapshotSchema(LEGACY_BRAND.timeSnapshotSchema)).toBe(true)
    expect(isTimeSnapshotSchema('eivra_time_snapshot_v1')).toBe(true)
    expect(isTimeSnapshotSchema('other_snapshot')).toBe(false)
  })

  it('imports legacy Excel backups and emits the Eivra format for new backups', () => {
    const bundle = { version: 1, exported_at: '2026-10-19T00:00:00.000Z', system_config: { initialCapital: 100 }, team_profiles: [], investments: [], access_logs: [] }
    const workbook = buildDataWorkbook(bundle)
    const meta = XLSX.utils.sheet_to_json(workbook.Sheets.__Meta)
    expect(meta.find((row) => row.key === 'format').value).toBe('eivra_excel_backup')
    meta.find((row) => row.key === 'format').value = 'dugou_excel_backup'
    workbook.Sheets.__Meta = XLSX.utils.json_to_sheet(meta)
    expect(parseDataBundleFromWorkbook(workbook)).toEqual(bundle)
  })
})
