import { afterEach, describe, expect, it, vi } from 'vitest'
import { LEGACY_BRAND } from '../../../shared/brandCompatibility.js'

const mock = vi.hoisted(() => ({ row: null, from: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: mock.from }),
}))

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); mock.from.mockReset() })

describe('existing cloud snapshots', () => {
  it.each([LEGACY_BRAND.timeSnapshotSchema, 'eivra_time_snapshot_v1'])('reads %s from the existing table', async (schema) => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.invalid')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'synthetic-key')
    vi.stubEnv('VITE_EIVRA_SNAPSHOT_TABLE', '')
    const bundle = { version: 1, exported_at: '2026-10-19T00:00:00Z', system_config: {}, team_profiles: [], investments: [{ id: 'synthetic-history' }] }
    mock.row = { id: 'timemachine:manual:test', updated_at: '2026-10-19T00:00:00Z', payload: { schema, bundle, meta: { title: 'Original snapshot', mode: 'manual' } } }
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: mock.row, error: null }) }
    mock.from.mockReturnValue(query)
    const { fetchTimeMachineSnapshotById } = await import('../cloudSync.js')
    const result = await fetchTimeMachineSnapshotById(mock.row.id)
    expect(mock.from).toHaveBeenCalledWith(LEGACY_BRAND.cloudSnapshotTable)
    expect(result.ok).toBe(true)
    expect(result.bundle).toEqual(bundle)
    expect(result.meta.title).toBe('Original snapshot')
  })
})
