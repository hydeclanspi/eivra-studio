"""Build-time only: export the reviewed Web solver. No runtime eval, generated source or duplicate model in Git.
Usage: python3 prepare_core.py /path/to/eivra-studio/src/pages/ComboPage.jsx /build/strategy-core.mjs
"""
import hashlib
import re
import sys
from pathlib import Path

PIN = '76e2271e4b1edb247cec4de827fc6cf9351bd14cc4d7861b708c67c23bd6f779'
ROOTS = 'getTodayMatches generateRecommendations getPortfolioInputIssue runPortfolioMonteCarlo readComboPlanHistory normalizeRoleTag'.split()
DEPS = 'getInvestments getActiveQuantCandidateRows brandLocalStorage getMatchSourceIdentity predictMatchProbability buildAtomicMatchProfile combineAtomicMatchProfiles estimateEntryAnchorOdds portfolioCandidateIssue'.split()

def emit(source):
    raw = source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != PIN:
        raise ValueError('ComboPage.jsx changed. Review bindings and re-run parity tests before updating PIN.')
    text = raw.decode()
    head = text[:text.index('// Pure algorithm entry points for regression tests;')]
    # This is intentionally NOT a general JS parser. The byte pin guards this exact declaration layout.
    parts = re.split(r'(?m)^(?=const [A-Za-z_$][\w$]*\s*=)', head)[1:]
    defs = {re.match(r'const (\w+)', part)[1]: part for part in parts}
    rows = text.split('  const candidateRows = useMemo(\n    () =>\n', 1)[1].split(',\n    [calibrationContext, riskCap, poolCapital, systemConfig, todayMatches]', 1)[0].strip()
    def names(code): return set(re.findall(r'\b\w+\b', code)) & defs.keys()
    keep = set(ROOTS) | names(rows)
    while True:
        more = keep | names('\n'.join(defs[name] for name in keep))
        if more == keep: break
        keep = more
    chunks = '\n'.join(code for name, code in defs.items() if name in keep)
    assert '<span' not in chunks and 'saveInvestments(' not in chunks and '.setItem(' not in chunks
    return ('// Generated from ComboPage.jsx SHA256 ' + PIN + '\nexport function bindWebCore({' + ','.join(DEPS) + '}) {\n' + chunks
            + '\nconst candidateRows = (todayMatches, systemConfig, calibrationContext, riskCap, poolCapital) => ' + rows + ';\n'
            + 'return {candidateRows,' + ','.join(ROOTS) + '}\n}\n')

if __name__ == '__main__':
    dest = Path(sys.argv[2]); dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(emit(Path(sys.argv[1])), encoding='utf-8')
