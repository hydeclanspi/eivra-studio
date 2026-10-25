import { describe, expect, it } from 'vitest'
import { buildMatrixCandidatePool } from '../portfolioCandidatePool'

describe('bounded matrix re-optimization pool', () => {
  it('keeps the previously feasible portfolio when a new ranking fills the cap', () => {
    const incumbent = [{ id: 'original-a' }, { id: 'original-b' }]
    const ranked = Array.from({ length: 60 }, (_, i) => ({ id: `new-${i}` }))
    const pool = buildMatrixCandidatePool({ incumbent, supporters: [ranked[40]], ranked, limit: 40, signature: (row) => row.id })
    expect(pool).toHaveLength(40)
    expect(pool).toEqual(expect.arrayContaining([...incumbent, ranked[40]]))
    expect(new Set(pool.map((row) => row.id)).size).toBe(40)
  })
  it('deduplicates by combination identity and preserves ordinary ranked input without an incumbent', () => {
    const ranked = [{ id: 'a' }, { id: 'a' }, { id: 'b' }]
    expect(buildMatrixCandidatePool({ ranked, limit: 40, signature: (row) => row.id })).toEqual([ranked[0], ranked[2]])
  })
})
