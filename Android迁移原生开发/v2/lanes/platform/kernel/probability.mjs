// Fixed read adapter for the platform allow-list, not an evaluator or a second ledger.
// Upstream: DashboardPage.jsx error_rolling (446–469 and 495–517).
export function probabilityReview(dashboard, investments, getMatchSourceIdentity) {
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
  const ids = new Set(dashboard.periodInvestmentRoiSeries.map(r => String(r.id)))
  const bins = Array.from({length:5}, (_,i) => ({label:`${20*i}–${20*i+20}%`, samples:0, sum:0, wins:0}))
  let samples=0, excluded=0
  const identity = l => l && l.source_investment_id && l.source_match_id && l.selection_key
    ? JSON.stringify([l.source_investment_id,l.source_match_id,l.selection_key]) : null
  for (const inv of investments) {
    if (!ids.has(String(inv.id)) || inv.status==='pending' || inv.is_archived) continue
    const s=inv.forecast_snapshot
    const times=[inv.outcome_available_at, inv.settled_at].map(Date.parse).filter(Number.isFinite)
    const usable = s?.schema_version === 1 && s.model_status !== 'approximate' && times.length>0 && Date.parse(s.generated_at)<Math.min(...times)
    const legs=inv.matches.map(m=>identity(getMatchSourceIdentity(m,inv.id)))
    inv.matches.forEach((m,i) => {
      const key=legs[i], hits=usable && key ? (s.legs || []).filter(l => identity(l) === key) : []
      const p=hits[0]?.calibrated_probability
      if(hits.length!==1 || legs.indexOf(key)!==legs.lastIndexOf(key) || hits[0]?.model_status==='approximate' || typeof m.is_correct!=='boolean' || !Number.isFinite(p) || p<0 || p>1) {excluded++;return}
      const bin=bins[Math.min(4,Math.floor(5*p))]; bin.samples++;bin.sum+=p;bin.wins+=Number(m.is_correct);samples++
    })
  }
  return {eligible:rows.length, windowSize, minWindow, points, frozen:{samples,excluded,bins:bins.map(b=>({label:b.label,samples:b.samples,meanPrediction:b.samples?b.sum/b.samples:null,observed:b.samples?b.wins/b.samples:null}))}}
}
