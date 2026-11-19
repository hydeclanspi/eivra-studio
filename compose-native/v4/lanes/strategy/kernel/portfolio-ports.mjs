// Platform composes this adapter with bindWebCore and ORIGINAL module exports inside its offline worker.
// No React, local ledger, confidence or payout model here. Expose only the two named read operations.
export function portfolioReads(core, api) {
  function snapshot(full) {
    const cfg = api.getSystemConfig(), cash = api.getReservoirState().availableCash
    if (!Number.isFinite(cash)) throw Error('可用资金不可用')
    const cap = api.capRecommendedStake(Number.MAX_SAFE_INTEGER, cash, cfg.riskCapRatio)
    const ctx = api.getPredictionCalibrationContext(full ? { detail: 'full', includeWeightSuggestions: false } : { detail: 'lite' })
    const all = core.getTodayMatches(), source = new Map(api.getInvestments().map(record => [record.id, record]))
    // Explicit null/empty Conf must not become Number(null) === 0 in the Web reader.
    const inspected = all.map(row => {
      const original = source.get(row.investmentId)?.matches?.[row.matchIndex]
      if (!row.researchCandidate && !original) throw Error('候选的来源场次已变化')
      if (original && (original.conf == null || original.conf === '') && original.calibrated_probability == null)
        return { ...row, missingLegQuote: true, missingLegQuoteReason: '该场没有腿级 Conf 或校准概率' }
      return row
    })
    const rows = core.candidateRows(inspected,cfg,ctx,cap,cash)
    rows.push(...inspected.filter(r => r.missingLegQuote).map(r => ({...r, inputIssue:r.missingLegQuoteReason})))
    return {rows, cfg, ctx, cap, source}
  }
  function leg(r,source,withDraft) {
    const {key,homeTeam,awayTeam,entries,autoRole,conf,odds,inputIssue} = r
    const view = {key,homeTeam,awayTeam,entries,autoRole,conf,odds,inputIssue}
    if (!withDraft) return view
    const original = source.get(r.investmentId)?.matches?.[r.matchIndex]
    if (original) {
      // Keep extended pre-match fields and opaque entry metadata intact, but never copy outcomes,
      // previously frozen forecasts or a previous record ID into a NEW draft.
      const {id, results, is_correct, match_rating, match_rep, actual_score, actual_result, match_outcome,
        settlement, settled_at, calibrated_probability, forecast_snapshot, conf_confirmed, ...pre} = original
      view.draftMatch = {...pre, ...api.getMatchSourceIdentity(original,r.investmentId), conf_confirmed:false}
    } else if (r.researchCandidate) {
      view.draftMatch = {...api.getMatchSourceIdentity(r), home_team:homeTeam, away_team:awayTeam, entries,
        entry_text:r.entry, entry_market_type:r.entryMarketType, odds, conf, conf_confirmed:false, mode:r.mode,
        tys_home:r.tysHome, tys_away:r.tysAway, fid:r.fid, fse_home:r.fseHome, fse_away:r.fseAway,
        note:r.note, quant_research_origin:r.researchCandidate, kickoff:r.kickoff}
    }
    return view
  }
  return {
    'portfolio.candidates': () => { const {rows,source}=snapshot(false); return rows.map(r=>leg(r,source,false)) },
    'portfolio.generate': req => {
      const {rows,cfg,ctx,cap,source}=snapshot(true)
      if (!Array.isArray(req.keys) || new Set(req.keys).size!==req.keys.length) throw Error('候选 key 缺失或重复')
      const byKey=new Map(rows.map(r=>[r.key,r]))
      if(byKey.size!==rows.length) throw Error('工作区候选标识冲突')
      const chosen=req.keys.map(k=>{const r=byKey.get(k); if(!r) throw Error('候选已变化，请刷新'); return {...r,roleTag:core.normalizeRoleTag(r.autoRole)} })
      const no = reason => ({status:'infeasible',reason})
      const blocked=chosen.find(r=>r.inputIssue)
      if(!chosen.length || blocked) return {status:'insufficient', reason:blocked?.inputIssue || '没有可报价的候选'}
      if(chosen.length < req.comboStructure.minLegs) return no('所选场次少于最小标的数。')
      const issue=core.getPortfolioInputIssue(chosen,req.qualityFilter); if(issue) return no(issue)
      const out=core.generateRecommendations(chosen,req.riskPref,cap,cfg,ctx,req.qualityFilter,req.comboStrategy,req.comboStructure,null,null,
        api.buildComboRetrospective(core.readComboPlanHistory()),req.allocationMode,req.solverMode)
      if(!out?.recommendations.length) return no('所选场次与当前阈值没有可行组合。请降低门槛或更换候选。')
      const eligible=out.recommendations.filter(p=>p.subset.length>=req.comboStructure.minLegs && (req.comboStrategy!=='thresholdStrict'||p.explain.thresholdPass))
      if(eligible.length!==out.recommendations.length) return no('原引擎的回退方案没有满足声明的硬约束，未予采用。')
      return {status:'ready',candidateCombos:out.candidateCombos,qualifiedCombos:out.qualifiedCombos,
        simulation:core.runPortfolioMonteCarlo(eligible.slice(0,20),50000),
        recommendations:eligible.map(({id,rank,layer,legs,ev,winRate,combinedOdds,amount,sharpe,utility,explain,subset})=>({
          id,rank,layer,legs,ev,winRate,combinedOdds,amount,sharpe,utility,explain,subset:subset.map(r=>leg(r,source,true))}))}
    },
  }
}
