// Rules for the lecturer dashboard. Nothing here touches the database, so it can be tested alone.

export const AT_RISK_ATTENDANCE = 75 // percent present
export const AT_RISK_SCORE_PCT = 40 // average score, in percent of the maximum
export const MIN_SESSIONS = 3 // attendance only counts as a warning after this many recorded sessions
export const MAX_ATTENDANCE_AGE_DAYS = 120 // a lecturer can correct attendance this far back

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000 // Tanzania: UTC+3, no daylight saving

export const todayInTanzania = (now: Date = new Date()) =>
    new Date(now.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10)

export const isRealDay = (v: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
    const d = new Date(`${v}T00:00:00Z`)
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

// A calendar day as the database stores it (a date with no time)
export const dayToDate = (day: string) => new Date(`${day}T00:00:00.000Z`)

// The end of a due day in Tanzania time, so "due 20 Oct" means the whole of 20 Oct
export const dueDateFromDay = (day: string) => new Date(`${day}T23:59:59+03:00`)

// Returns a message when the day cannot be used for attendance, or null when it is fine.
export function checkAttendanceDay(day: string, now: Date = new Date()): string | null {
    if (!isRealDay(day)) return 'Choose a real date.'
    const today = todayInTanzania(now)
    if (day > today) return 'You cannot take attendance for a future date.'
    const oldest = todayInTanzania(new Date(now.getTime() - MAX_ATTENDANCE_AGE_DAYS * 86_400_000))
    if (day < oldest) return `Attendance can only be recorded for the last ${MAX_ATTENDANCE_AGE_DAYS} days.`
    return null
}

// A score is valid when it is between 0 and the assignment's maximum. Rounded to 2 decimals.
export function checkScore(score: number, max: number): { ok: true; value: number } | { ok: false; message: string } {
    if (!Number.isFinite(score)) return { ok: false, message: 'Enter a number.' }
    if (score < 0) return { ok: false, message: 'A score cannot be below 0.' }
    if (score > max) return { ok: false, message: `A score cannot be above ${max}.` }
    return { ok: true, value: Math.round(score * 100) / 100 }
}

export const averagePercent = (scores: { score: number; max: number }[]) =>
    scores.length === 0 ? null : (scores.reduce((sum, s) => sum + (s.score / s.max) * 100, 0) / scores.length)

export type StudentStatus = 'at_risk' | 'not_graded' | 'on_track'

export function attendancePercent(present: number, absent: number) {
    const sessions = present + absent
    return sessions === 0 ? null : Math.round((present / sessions) * 100)
}

export function studentStatus(present: number, absent: number, avgPct: number | null): StudentStatus {
    const sessions = present + absent
    const lowAttendance = sessions >= MIN_SESSIONS && (present / sessions) * 100 < AT_RISK_ATTENDANCE
    const lowScores = avgPct !== null && avgPct < AT_RISK_SCORE_PCT
    if (lowAttendance || lowScores) return 'at_risk'
    return avgPct === null ? 'not_graded' : 'on_track'
}
