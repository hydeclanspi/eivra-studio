import { describe, expect, it } from 'vitest'
import { emptyEvidenceStore, eventKey, evidenceFromObservedResults, evidenceFromOfficial, instant, latestQuote, mergeEvidence, normalizeEvidence, quoteForSpec, resolveForecast } from '../quantEvidence'

const event = { home: '阿森纳', away: '切尔西', kickoff: '2026-01-15T12:00:00Z', source: 'test' }
const quote = { ...event, observedAt: '2026-01-15T11:00:00Z', market: 'result', selection: 'home', odds: 2 }
const at = '2026-01-15T11:10:00Z'
const spec = { team: '阿森纳', venue: 'any', market: 'result', outcome: 'win', probMode: 'market' }
const normalize = (quotes = [quote], results = []) => normalizeEvidence({ schemaVersion: 1, quotes, results }, { now: '2026-01-16T12:00:00Z' })

describe('timestamped research evidence', () => {
  it.each(['2026-01-01', '2026-01-01 00:00', '2026-02-30T00:00:00Z', '2026-01-01T24:00:00Z', '2026-01-01T00:00:00+15:00'])('rejects ambiguous or invalid clock %s', (value) => expect(instant(value)).toBeNull())
  it('equates timezone forms and aliases without fuzzy matching', () => {
    expect(eventKey(event)).toBe(eventKey({ ...event, kickoff: '2026-01-15T20:00:00+08:00' }))
    expect(quoteForSpec({ ...spec, team: 'Chelsea', outcome: 'lose' }, event)?.selection).toBe('home')
    expect(quoteForSpec({ ...spec, team: 'Arsenal Academy' }, event)).toBeNull()
    expect(quoteForSpec({ ...spec, team: '切尔西', market: 'score', score: { for: 2, against: 1 } }, event)).toEqual({ venue: 'away', selection: '1-2' })
  })
  it('rejects future capture, malformed score and backwards availability', () => {
    expect(() => normalizeEvidence({ schemaVersion: 1, quotes: [quote] }, { now: '2026-01-15T10:00:00Z' })).toThrow('当前时间')
    expect(() => normalize([], [{ ...event, availableAt: '2026-01-15T10:00:00Z', homeGoals: 1, awayGoals: 0 }])).toThrow('赛果可知时间')
    expect(() => normalize([], [{ ...event, availableAt: '2026-01-15T14:00:00Z', homeGoals: null, awayGoals: 0 }])).toThrow('整数')
  })
  it('is idempotent but retains conflicting prices and scores for rejection', () => {
    const once = mergeEvidence(emptyEvidenceStore(), { schemaVersion: 1, quotes: [quote] })
    expect(mergeEvidence(once, { schemaVersion: 1, quotes: [quote] }).quotes).toEqual(once.quotes)
    const conflict = mergeEvidence(once, { schemaVersion: 1, quotes: [{ ...quote, odds: 3 }] })
    expect(latestQuote(conflict.quotes, { eventId: eventKey(event), market: 'result', selection: 'home', at }).reason).toBe('conflicting_quote')
  })
  it('uses latest observations and rejects suspension instead of reviving an earlier price', () => {
    const data = normalize([quote, { ...quote, observedAt: at, tradable: false }])
    expect(latestQuote(data.quotes, { eventId: eventKey(event), market: 'result', selection: 'home', at }).reason).toBe('market_closed')
    expect(latestQuote(normalize().quotes, { eventId: eventKey(event), market: 'result', selection: 'home', at, maxAgeMinutes: 5 }).reason).toBe('stale_quote')
  })
  it('labels official naive times explicitly and never invents a final availability date', () => {
    const payload = evidenceFromOfficial([{ ...event, kickoff: '2026-01-15 20:00', selling: true, had: { home: 2, draw: 3, away: 4 }, scores: [] }], { now: at })
    expect(instant(payload.events[0].kickoff)).toBe(instant(event.kickoff))
    const evidence = mergeEvidence(emptyEvidenceStore(), payload)
    const observed = evidenceFromObservedResults([{ date: '2026-01-15', home: event.home, away: event.away, homeGoals: 1, awayGoals: 0 }], evidence, { now: '2026-01-16T12:00:00Z' })
    expect(observed.results[0].availableAt).toBe('2026-01-16T12:00:00Z')
    expect(instant(observed.results[0].kickoff)).toBe(instant(event.kickoff))
  })
  it('requires coherent market probabilities and excludes future ratings training data', () => {
    expect(resolveForecast(spec, normalize().quotes, { at }).available).toBe(false)
    const full = normalize([quote, { ...quote, selection: 'draw', odds: 3.5 }, { ...quote, selection: 'away', odds: 4 }])
    const market = resolveForecast(spec, full.quotes, { at })
    expect(market.available).toBe(true)
    expect(market.source).toMatch(/^market_/)
    const future = [{ ...event, eventId: eventKey(event), homeGoals: 10, awayGoals: 0, availableAt: '2026-01-16T12:00:00Z' }]
    expect(resolveForecast({ ...spec, probMode: 'ratings' }, full.quotes, { at, results: future })).toMatchObject({ available: false, probability: null, trainingCount: 0 })
  })
  it('does not revive an older complete probability snapshot after a newer partial or stopped one', () => {
    const full = [quote, { ...quote, selection: 'draw', odds: 3.5 }, { ...quote, selection: 'away', odds: 4 }]
    for (const newer of [[{ ...quote, observedAt: at }], full.map((row) => ({ ...row, observedAt: at, tradable: false }))]) {
      expect(resolveForecast(spec, normalize([...full, ...newer]).quotes, { at, source: 'test' }).available).toBe(false)
    }
  })
  it('keeps market-specific selling status separate', () => {
    const payload = evidenceFromOfficial([{ ...event, selling: false, sellingByMarket: { score: true }, had: { home: 2 }, scores: [{ home: 1, away: 0, odds: 5 }] }], { now: at })
    expect(payload.events[0].tradable).toBe(true)
    expect(payload.quotes.find((row) => row.market === 'result').tradable).toBe(false)
    expect(payload.quotes.find((row) => row.market === 'score').tradable).toBe(true)
  })
  it('records fresh collector receipts even without new evidence and rejects future receipts', () => {
    const collector = { state: 'stopped', intervalSeconds: 300, updatedAt: at }
    const once = mergeEvidence(emptyEvidenceStore(), { schemaVersion: 1, quotes: [quote] }, { now: at, collector })
    const repeated = mergeEvidence(once, { schemaVersion: 1, quotes: [quote] }, { now: at, collector })
    expect(repeated.quotes).toEqual(once.quotes)
    expect(repeated.imports.at(-1)).toMatchObject({ added: 0, collector: { state: 'stopped' } })
    expect(() => mergeEvidence(once, { schemaVersion: 1 }, { now: at, collector: { ...collector, updatedAt: '2027-01-01T00:00:00Z' } })).toThrow('采集器时间')
  })

})
