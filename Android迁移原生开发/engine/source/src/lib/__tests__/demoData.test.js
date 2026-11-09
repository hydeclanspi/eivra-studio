import { describe, expect, it } from 'vitest'
import { getDemoInvestments, getDemoSystemConfig } from '../demoData'

const money = (value) => Math.round(value * 100) / 100

describe('synthetic demo monetary ledger', () => {
  const rows = getDemoInvestments()
  const settled = rows.filter((row) => row.status !== 'pending')

  it('pays the recorded multiplier on a win and loses only the stake on a loss', () => {
    for (const row of settled) {
      expect(row.inputs).toBeGreaterThan(0)
      expect(row.suggested_amount).toBe(row.inputs)
      expect(row.combined_odds).toBe(money(row.matches.reduce((product, match) => product * match.odds, 1)))
      expect(row.revenues).toBe(row.status === 'win' ? money(row.inputs * row.combined_odds) : 0)
      expect(row.profit).toBe(money(row.revenues - row.inputs))
    }
  })

  it('keeps most losses in tens, occasional losses over 100 and varied winning amounts', () => {
    const losses = settled.filter((row) => row.status === 'lose')
    const wins = settled.filter((row) => row.status === 'win')
    expect(losses.filter((row) => row.inputs >= 10 && row.inputs < 100).length / losses.length).toBeGreaterThan(0.7)
    expect(losses.some((row) => row.inputs >= 100)).toBe(true)
    expect(losses.filter((row) => row.inputs >= 100).length / losses.length).toBeLessThan(0.15)
    expect(Math.max(...losses.map((row) => row.inputs))).toBeLessThanOrEqual(150)
    expect(wins.some((row) => row.profit >= 100 && row.profit < 1000)).toBe(true)
    expect(wins.some((row) => row.profit < 100)).toBe(true)
  })

  it('derives the closed cycle settlement from the same history ledger', () => {
    const config = getDemoSystemConfig()
    const settlement = config.poolSettlements[0]
    const profit = money(settled.filter((row) => row.created_at <= settlement.created_at).reduce((sum, row) => sum + row.profit, 0))
    expect(settlement.realizedProfit).toBe(profit)
    expect(settlement.poolBefore).toBe(money(settlement.cycleBase + profit))
    const allocation = config.capitalInjections.find((row) => row.id === settlement.linkedInjectionId)
    expect(allocation.amount).toBe(settlement.newCapital)
  })

  it('leaves the pending demonstration orders unsettled and returns isolated copies', () => {
    const pending = rows.filter((row) => row.status === 'pending')
    expect(pending.map((row) => row.inputs)).toEqual([8, 12, 10])
    expect(pending.every((row) => row.revenues === 0 && row.profit === 0)).toBe(true)
    const copy = getDemoInvestments()
    copy[0].inputs = -1
    expect(getDemoInvestments()[0].inputs).toBe(rows[0].inputs)
  })
})
