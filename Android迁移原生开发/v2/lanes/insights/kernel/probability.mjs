// Fixed read adapter for the platform allow-list, not an evaluator or a second ledger.
// Upstream: DashboardPage.jsx error_rolling (446–469 and 495–517).
export function probabilityReview(dashboard) {
  if (!Array.isArray(dashboard?.periodMatchRows)) throw new TypeError('Missing periodMatchRows')
  // Deliberate stricter null guard at the JSON bridge: NaN serializes to null; it is NOT p=0.
  const rows = dashboard.periodMatchRows.filter(r => Number.isFinite(r.conf) &&
    (r.status === 'win' || r.status === 'lose')).sort((a,b) => Date.parse(a.date) - Date.parse(b.date))
  const windowSize = Math.max(6, Math.min(20, Math.floor(rows.length * .6)))
  const minWindow = Math.max(4, Math.min(8, windowSize))
  const points = []
  for (let i = minWindow - 1; i < rows.length; i++) {
    const start = Math.max(0, i - windowSize + 1), n = i - start + 1
    let sq = 0, log = 0
    for (let j = start; j <= i; j++) {
      const p = Math.max(.02, Math.min(.98, rows[j].conf)), y = Number(rows[j].status === 'win')
      sq += (p-y)**2; log -= y * Math.log(p) + (1-y) * Math.log(1-p)
    }
    const r = rows[i]; points.push({label:r.dateLabel, match:r.match, investmentId:r.investmentId, n,
      brier:Number((sq/n).toFixed(4)), logLoss:Number((log/n).toFixed(4))})
  }
  return {eligible:rows.length, windowSize, minWindow, points}
}
