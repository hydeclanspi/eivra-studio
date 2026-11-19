import { useMemo } from 'react'
import { Signal } from 'lucide-react'
import { getStrategies } from '../lib/quantStrategy'
import { usePreviewTextMask } from '../lib/labels'

/* Quants 实盘信号（只读提示卡）
 * 列出「已转正」策略台账里仍在等待结果的头寸，给组合页一个旁路参考。
 * 纪律：绝不写任何东西；策略架数据损坏时静默消失，不能拖垮本页。 */

const OUTCOME_LABELS = { win: '胜', draw: '平', lose: '负' }

const describePlay = (strategy) =>
  strategy?.market === 'score'
    ? `比分 ${strategy.score?.for ?? '?'}-${strategy.score?.against ?? '?'}`
    : `胜平负 · ${OUTCOME_LABELS[strategy?.outcome] || '?'}`

const QuantsLiveSignals = () => {
  const maskText = usePreviewTextMask()
  const rows = useMemo(() => {
    try {
      return getStrategies()
        .filter((strategy) => strategy?.status === 'live')
        .flatMap((strategy) =>
          (Array.isArray(strategy.positions) ? strategy.positions : [])
            .filter((position) => position?.status === 'pending')
            .map((position) => ({
              key: `${strategy.id}:${position.id}`,
              strategyName: strategy.name || '未命名策略',
              team: position.venue === 'away' ? position.away : position.home,
              home: position.home || '',
              away: position.away || '',
              play: describePlay(strategy),
              odds: Number(position.entryOdds),
              stake: Number(position.stake),
              kickoff: position.kickoff || '',
            })),
        )
        .sort((a, b) => (a.kickoff < b.kickoff ? -1 : a.kickoff > b.kickoff ? 1 : 0))
    } catch {
      return []
    }
  }, [])

  if (rows.length === 0) return null

  return (
    <div className="mb-6 rounded-2xl border border-amber-200/70 bg-amber-50/60 px-5 py-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
        <Signal size={13} strokeWidth={2} />
        Quants 实盘信号
        <span className="font-normal text-amber-600/80">量化台账中仍在等待结果的 {rows.length} 个头寸 · 仅供参考，不构成投注建议</span>
      </div>
      <ul className="mt-2 space-y-1">
        {rows.map((row) => (
          <li key={row.key} className="text-xs text-stone-600">
            <span className="font-medium text-stone-700">{maskText(row.strategyName)}</span>
            {' · '}
            {maskText(row.team)} {row.play}
            {Number.isFinite(row.odds) && row.odds > 1 ? ` @ ${row.odds.toFixed(2)}` : ''}
            {Number.isFinite(row.stake) ? ` · ¥${row.stake.toFixed(1)}` : ''}
            {row.kickoff ? ` · ${row.kickoff}` : ''}
            <span className="text-stone-400">{row.home && row.away ? `（${maskText(row.home)} vs ${maskText(row.away)}）` : ''}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default QuantsLiveSignals
