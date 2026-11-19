import { parseNaturalInput } from './naturalInputParser'
import { AI_PARSE_MAX_COMBOS } from './aiInvestmentSchema'

// Explicit numbered paragraphs are separate orders. Plain text keeps the
// original multi-match interpretation, including decimal odds and amounts.
export function parseNaturalInputOrders(rawText) {
  const text = String(rawText || '')
  const markers = [...text.matchAll(/(?:^|\n)[ \t]*\d+[.)、][ \t]+/g)]
  if (markers.length < 2 || text.slice(0, markers[0].index).trim()) return parseNaturalInput(text)
  const parsed = markers.slice(0, AI_PARSE_MAX_COMBOS).map((marker, index) => parseNaturalInput(text.slice(marker.index + marker[0].length, markers[index + 1]?.index).trim()))
  const diagnostics = parsed.flatMap((result, index) => result.diagnostics.map((d) => ({ ...d, message: `第 ${index + 1} 单：${d.message}` })))
  if (markers.length > AI_PARSE_MAX_COMBOS) diagnostics.push({ level: 'warning', message: `本次仅解析前 ${AI_PARSE_MAX_COMBOS} 单，请分批导入剩余记录。` })
  return { combos: parsed.map((result) => ({ matches: result.matches, actualInput: result.actualInput, comboName: '' })), confidence: Math.min(...parsed.map((result) => result.confidence)), diagnostics, rawInput: text }
}
