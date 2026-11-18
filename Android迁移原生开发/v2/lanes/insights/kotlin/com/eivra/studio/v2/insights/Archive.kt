package com.eivra.studio.v2.insights

import org.json.JSONArray
import org.json.JSONObject
import java.time.*
import java.time.format.DateTimeFormatter
import java.util.Locale

internal fun JSONObject.text(k: String): String? = when (val v = opt(k)) {
    is String -> v.trim().takeIf { it.isNotEmpty() }
    is Number -> v.toString()
    else -> null
}
internal fun JSONObject.number(k: String) = text(k)?.toDoubleOrNull()?.takeIf { it.isFinite() }
internal fun JSONObject.prob(k: String) = number(k)?.takeIf { it in 0.0..1.0 }
internal fun JSONObject.id() = requireNotNull(text("id")) { "记录缺少 ID" }
internal fun JSONArray.objects() = (0 until length()).map { getJSONObject(it) }
internal fun Double?.fmt(n: Int = 2, suffix: String = ""): String = this?.let { String.format(Locale.ROOT, "%.${n}f%s", it, suffix) } ?: "—"
internal fun Double?.pct() = fmt(1, "%") // already percentage points
internal fun Double?.chance() = this?.times(100).pct() // unit interval
internal fun Double?.cash() = this?.let { "¥${it.fmt()}" } ?: "—"

internal enum class Window(val wire: String, val label: String, private val days: Long?) {
    All("all", "全部", null), Week("1w", "近一周", 7), Fortnight("2w", "近两周", 14), Month("1m", "近一月", 30);
    fun includes(at: Instant?, today: LocalDate, zone: ZoneId): Boolean {
        if (days == null) return true
        val day = at?.atZone(zone)?.toLocalDate() ?: return false
        return !day.isBefore(today.minusDays(days)) && !day.isAfter(today)
    }
}
private fun String?.instant(zone: ZoneId): Instant? {
    val s = this ?: return null
    return runCatching { Instant.parse(s) }.getOrNull()
        ?: runCatching { OffsetDateTime.parse(s).toInstant() }.getOrNull()
        ?: runCatching { LocalDateTime.parse(s).atZone(zone).toInstant() }.getOrNull()
        ?: runCatching { LocalDate.parse(s).atStartOfDay(ZoneOffset.UTC).toInstant() }.getOrNull()
}
private val minuteFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm", Locale.ROOT)
internal fun Instant?.stamp(zone: ZoneId = ZoneId.systemDefault()) = this?.atZone(zone)?.format(minuteFormat) ?: "时间未记录"
private val resultPair = Regex("(?:^|[^\\d.])(\\d{1,2})\\s*[-:：]\\s*(\\d{1,2})(?![\\d.])")
private fun JSONObject.score(): String? {
    fun side(vararg keys: String) = keys.firstNotNullOfOrNull { number(it) }?.takeIf { it >= 0 && it <= Int.MAX_VALUE && it == it.toInt().toDouble() }?.toInt()
    val h = side("home", "homeGoals", "home_goals") ?: return null
    val a = side("away", "awayGoals", "away_goals") ?: return null
    return "$h–$a"
}
internal data class Entry(val name: String, val odds: Double?)
internal data class Leg(val home: String, val away: String, val entries: List<Entry>, val entryText: String?, val prediction: String?,
    val score: String?, val result: String?, val correct: Boolean?, val conf: Double?, val ajr: Double?, val mode: String?, val note: String?, val review: String?) {
    val match get() = "${home.ifBlank { "未记主队" }} vs ${away.ifBlank { "未记客队" }}"
    val outcome get() = when(correct) { true -> "命中"; false -> "未命中"; null -> "未判定" }
}
internal data class Ticket(val id: String, val name: String?, val created: Instant?, val settledAt: Instant?, val status: String,
    val archived: Boolean, val demoSeed: Boolean, val inputs: Double?, val profit: Double?, val revenue: Double?, val rating: Double?,
    val ratingBasis: String?, val frozenAt: String?, val ticketProbability: Double?, val legs: List<Leg>) {
    val pending get() = status == "pending"
    val label get() = name ?: legs.firstOrNull()?.match ?: "未记录对阵"
    val statusText get() = when { pending -> "待结算"; status == "draw" || profit == 0.0 -> "持平"; status == "win" -> "已中"; status == "lose" -> "未中"; else -> "状态未明" }
    fun matches(query: String): Boolean = query.isBlank() || sequenceOf(id, label).plus(legs.asSequence().flatMap { l ->
        sequenceOf(l.home, l.away, l.result, l.entryText, l.note, l.review, l.score).filterNotNull() + l.entries.asSequence().map { it.name }
    }).any { it.contains(query.trim(), ignoreCase = true) }
}
internal class Archive(val tickets: List<Ticket>, private val aliases: Map<String, String>) {
    private val byId = tickets.associateBy { it.id }.also { require(it.size == tickets.size) { "账本包含重复记录 ID" } }
    fun exact(id: String) = byId[id]
    fun canonical(name: String): String = aliases[name.trim().lowercase(Locale.ROOT)] ?: when(name.trim()) { "西汉姆" -> "西汉姆联"; "维拉" -> "阿斯顿维拉"; else -> name.trim() }
    fun visible(mode: String, window: Window, today: LocalDate, zone: ZoneId) = tickets.filter {
        !(mode == "demo" && it.demoSeed) && window.includes(it.created, today, zone)
    }
    companion object {
        fun parse(payload: String, zone: ZoneId = ZoneId.systemDefault()): Archive {
            val root = JSONObject(payload)
            val aliases = buildMap {
                for (p in root.getJSONArray("team_profiles").objects()) {
                    val raw = p.text("teamName") ?: continue
                    val name = when(raw) { "西汉姆" -> "西汉姆联"; "维拉" -> "阿斯顿维拉"; else -> raw }
                    put(raw.lowercase(Locale.ROOT), name); put(name.lowercase(Locale.ROOT), name)
                    p.optJSONArray("abbreviations")?.let { arr -> for (i in 0 until arr.length()) (arr.opt(i) as? String)?.let { put(it.trim().lowercase(Locale.ROOT), name) } }
                }
            }
            val tickets = root.getJSONArray("investments").objects().map { j ->
                val snap = j.optJSONObject("forecast_snapshot")?.takeIf { it.optInt("schema_version") == 1 }
                val legs = j.getJSONArray("matches").objects().map { m ->
                    val entries = m.optJSONArray("entries")?.objects().orEmpty().mapNotNull { e -> e.text("name")?.let { Entry(it,e.number("odds")) } }
                    val result = m.text("results")
                    val score = m.optJSONObject("actual_score")?.score() ?: result?.let { resultPair.find(it) }?.let { "${it.groupValues[1].toInt()}–${it.groupValues[2].toInt()}" }
                    Leg(m.text("home_team").orEmpty(),m.text("away_team").orEmpty(),entries,m.text("entry_text"),m.optJSONObject("predicted_score")?.score(),
                        score,result,m.opt("is_correct") as? Boolean,m.number("conf"),m.number("match_rating"),m.text("mode"),m.text("note"),m.text("post_note"))
                }
                Ticket(j.id(),j.text("combo_name"),j.text("created_at").instant(zone),j.text("settled_at").instant(zone),j.text("status") ?: "pending",
                    j.optBoolean("is_archived"),j.optBoolean("__demo_seed_pending"),j.number("inputs"),j.number("profit"),j.number("revenues"),j.number("expected_rating"),
                    j.text("expected_rating_semantics") ?: snap?.text("expected_rating_semantics"),snap?.text("generated_at"),snap?.prob("ticket_hit_probability"),legs)
            }.sortedByDescending { it.created }
            return Archive(tickets, aliases)
        }
    }
}
