// Rules for the weekly timetable. Nothing here touches the database, so it can be tested alone.

export const TIME = /^([01]\d|2[0-3]):[0-5]\d$/ // 00:00 to 23:59, always two digits

export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Tanzania is UTC+3 all year. Returns 1 (Monday) to 7 (Sunday).
export const weekdayInTanzania = (now: Date = new Date()) => {
    const d = new Date(now.getTime() + 3 * 60 * 60 * 1000).getUTCDay() // 0 = Sunday
    return d === 0 ? 7 : d
}

// Returns a message when the times cannot be used, or null when they are fine.
export function checkSlotTimes(start: string, end: string): string | null {
    if (!TIME.test(start) || !TIME.test(end)) return 'Use times like 08:00.'
    // both are "HH:MM" with two digits, so comparing the text is the same as comparing the times
    if (end <= start) return 'The end time must be after the start time.'
    return null
}

export const timesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
    aStart < bEnd && bStart < aEnd

export type ExistingSlot = {
    id: number
    weekday: number
    startTime: string
    endTime: string
    room: string | null
    course: { code: string; lecturerId: number | null }
}

// A lecturer cannot teach two classes at once, and one room cannot hold two classes at once.
// Returns a message describing the first clash, or null when there is none.
export function findClash(
    candidate: { weekday: number; startTime: string; endTime: string; room: string | null; lecturerProfileId: number },
    existing: ExistingSlot[],
    ignoreId?: number,
): string | null {
    const room = candidate.room?.trim().toLowerCase() || null

    for (const e of existing) {
        if (e.id === ignoreId || e.weekday !== candidate.weekday) continue
        if (!timesOverlap(candidate.startTime, candidate.endTime, e.startTime, e.endTime)) continue

        if (e.course.lecturerId === candidate.lecturerProfileId) {
            return `You already teach ${e.course.code} at ${e.startTime} to ${e.endTime} that day.`
        }
        if (room && e.room && e.room.trim().toLowerCase() === room) {
            return `Room ${candidate.room?.trim()} is already used by ${e.course.code} at ${e.startTime} to ${e.endTime}.`
        }
    }
    return null
}
