// Keep the current feasible portfolio inside a bounded re-optimization pool.
// Otherwise a relaxed constraint can incorrectly appear infeasible when new
// ranked candidates push its original witnesses beyond the pool limit.
export function buildMatrixCandidatePool({ incumbent = [], supporters = [], ranked = [], limit, signature }) {
  const seen = new Set()
  return [...incumbent, ...supporters, ...ranked].filter((row) => {
    const key = signature(row)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, limit)
}
