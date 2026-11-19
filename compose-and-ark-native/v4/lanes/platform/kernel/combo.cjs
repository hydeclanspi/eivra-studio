// Pure region of the existing Combo page; exclude the two inline JSX renderers and the component.
module.exports = function comboPage(page) {
 const c=page('ComboPage','76e2271e4b1edb247cec4de827fc6cf9351bd14cc4d7861b708c67c23bd6f779');
 const imports=[c(1,1),c(5,6),c(10,18),c(28,28),c(31,31)].join('\n').replaceAll('../lib/','web/').replaceAll(".js'","'");
 return imports+'\n'+[c(36,2093),c(2214,3875)].join('\n')+`\nexport {getTodayMatches,generateRecommendations,runPortfolioMonteCarlo,DEFAULT_QUALITY_FILTER,DEFAULT_COMBO_STRUCTURE,DEFAULT_ROLE_PREFERENCE,getPortfolioInputIssue,normalizeRoleTag,readComboPlanHistory};
export function candidateRows(todayMatches,systemConfig,calibrationContext,riskCap,poolCapital){return ${c(4024,4049).replace(/,\s*$/,'')};}`
}
