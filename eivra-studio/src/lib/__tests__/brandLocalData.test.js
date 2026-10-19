import { afterEach, describe, expect, it, vi } from 'vitest'
import { LEGACY_BRAND } from '../../../shared/brandCompatibility.js'

vi.mock('../gitSync', () => ({ scheduleGitCommit: vi.fn() }))
vi.mock('../cloudSync', () => ({ getTimeMachineSession: () => null, isInTimeMachineSession: () => false }))

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules() })

describe('existing owner data at first Eivra load', () => {
  it('keeps saved positions and patch markers rather than reseeding genesis', async () => {
    const prefix = LEGACY_BRAND.storagePrefix
    const storedPositions = JSON.stringify([{ id: 'synthetic-existing-position', created_at: '2026-10-01T00:00:00Z', matches: [] }])
    const data = new Map([
      [`${prefix}.investments.v1`, storedPositions],
      ...['genesis_applied.v1', 'data_patch.v20260205', 'data_patch.v20260206'].map((suffix) => [`${prefix}.${suffix}`, '1']),
    ])
    vi.stubGlobal('window', {
      location: { pathname: '/arsenal/new' },
      localStorage: { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) },
      sessionStorage: { getItem: () => null },
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })
    const { getInvestments } = await import('../localData.js')
    expect(getInvestments().map((record) => record.id)).toEqual(['synthetic-existing-position'])
    expect(data.get('eivra.investments.v1')).toBe(storedPositions)
    expect(data.get(`${prefix}.investments.v1`)).toBe(storedPositions)
    expect(data.has('eivra.system_config.v1')).toBe(false)
  })
})
