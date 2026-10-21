import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { candidateIssue, getActiveQuantCandidateRows, getQuantCandidates, portfolioCandidateIssue, recordCandidateAdoption, sendQuantCandidate, setQuantCandidateStatus } from '../quantCandidates'
vi.mock('../displayMode', () => ({ isPreviewMode: () => false }))
const input = { orderId: 'paper1', planId: 'plan1', versionId: 'v1', name: 'research', eventId: 'event1', home: '阿森纳', away: '切尔西', kickoff: '2026-01-15T12:00:00Z', market: 'result', selection: 'home', quote: { odds: 2, observedAt: '2026-01-15T11:00:00Z', source: 'test' }, forecast: { probability: .6, generatedAt: '2026-01-15T11:10:00Z', source: 'custom' }, stake: 10 }
beforeEach(() => {
  const store = new Map()
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-15T11:15:00Z'))
  vi.stubGlobal('window', { localStorage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) }, dispatchEvent: vi.fn() })
  vi.stubGlobal('CustomEvent', class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail } })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
describe('research to portfolio handoff', () => {
  it('requires a separate selection before entering the pool and preserves exact forecast probability', () => {
    const candidate = sendQuantCandidate(input)
    expect(getActiveQuantCandidateRows()).toEqual([])
    setQuantCandidateStatus(candidate.id, 'ready')
    expect(getActiveQuantCandidateRows()[0]).toMatchObject({ conf: .6, calibratedP: .6, eventId: 'event1', entries: [{ name: '主胜', odds: 2 }] })
    expect(sendQuantCandidate(input).id).toBe(candidate.id)
    expect(getQuantCandidates()).toHaveLength(1)
  })
  it('blocks stale, withdrawn and adopted candidates from being used again', () => {
    const candidate = sendQuantCandidate(input)
    setQuantCandidateStatus(candidate.id, 'ready')
    expect(portfolioCandidateIssue(candidate)).toBeNull()
    recordCandidateAdoption([candidate.id], ['investment1'])
    expect(getActiveQuantCandidateRows()).toEqual([])
    expect(portfolioCandidateIssue(candidate)).toMatch('已采纳')
    expect(candidateIssue(candidate, Date.parse('2026-01-15T11:59:59Z'))).toBeNull()
    expect(candidateIssue(candidate, Date.parse('2026-01-15T12:00:00Z'))).toMatch('已开赛')
  })
  it('links each adopted candidate only to its own investments and prevents reactivation', () => {
    const first = sendQuantCandidate(input)
    const second = sendQuantCandidate({ ...input, orderId: 'paper2' })
    recordCandidateAdoption([first.id, second.id], { [first.id]: ['investment1'], [second.id]: ['investment2'] })
    expect(getQuantCandidates().map((row) => row.investmentIds)).toEqual([['investment1'], ['investment2']])
    expect(() => setQuantCandidateStatus(first.id, 'ready')).toThrow('已采纳')
  })

})
