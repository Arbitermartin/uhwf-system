import { dayToDate, isRealDay } from './lecturerRules'

// Rules for employee attendance, tasks and leave. Nothing here touches the database.

export const DEFAULT_ANNUAL_LEAVE_DAYS = 28 // a sample: the real policy is set in the settings table
export const LEAVE_TYPES = ['annual', 'sick', 'other'] as const
export type LeaveType = (typeof LEAVE_TYPES)[number]
export const MAX_LEAVE_SPAN_DAYS = 60
export const SICK_LEAVE_LOOKBACK_DAYS = 14

const DAY_MS = 86_400_000

// Working days (Monday to Friday) from start to end, both included.
// The system does not know the public holidays, so they count as working days.
export function workingDays(start: string, end: string): number {
    let n = 0
    for (let t = dayToDate(start).getTime(); t <= dayToDate(end).getTime(); t += DAY_MS) {
        const d = new Date(t).getUTCDay() // 0 = Sunday, 6 = Saturday
        if (d !== 0 && d !== 6) n++
    }
    return n
}

export const addDays = (day: string, n: number) => new Date(dayToDate(day).getTime() + n * DAY_MS).toISOString().slice(0, 10)

// Two periods (yyyy-mm-dd text) share at least one day
export const periodsOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart <= bEnd && bStart <= aEnd

export type LeaveCheck = { ok: true; days: number } | { ok: false; message: string }

// Is this leave request acceptable? `remaining` is the annual leave left, counting requests still waiting for a decision.
export function checkLeaveRequest(r: { type: LeaveType; start: string; end: string; today: string; remaining: number }): LeaveCheck {
    if (!isRealDay(r.start) || !isRealDay(r.end)) return { ok: false, message: 'Choose real dates.' }
    if (r.end < r.start) return { ok: false, message: 'The end date cannot be before the start date.' }
    if ((dayToDate(r.end).getTime() - dayToDate(r.start).getTime()) / DAY_MS + 1 > MAX_LEAVE_SPAN_DAYS) {
        return { ok: false, message: `One request can cover at most ${MAX_LEAVE_SPAN_DAYS} days. Please split it.` }
    }
    if (r.type === 'sick') {
        if (r.start < addDays(r.today, -SICK_LEAVE_LOOKBACK_DAYS)) {
            return { ok: false, message: `Sick leave can be recorded up to ${SICK_LEAVE_LOOKBACK_DAYS} days back.` }
        }
    } else if (r.start < r.today) {
        return { ok: false, message: 'Leave must start today or later.' }
    }
    const days = workingDays(r.start, r.end)
    if (days === 0) return { ok: false, message: 'That period has no working days (it is only a weekend).' }
    if (r.type === 'annual' && days > r.remaining) {
        return { ok: false, message: `This needs ${days} working day${days === 1 ? '' : 's'}, but you have ${Math.max(0, r.remaining)} of annual leave left.` }
    }
    return { ok: true, days }
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'

// A task only moves forward. Nobody reopens a finished task.
export const canMoveTask = (from: TaskStatus, to: TaskStatus) =>
    (from === 'todo' && (to === 'in_progress' || to === 'done')) || (from === 'in_progress' && to === 'done')

// Minutes between clocking in and out. While still clocked in, it counts up to "now".
export const minutesWorked = (clockIn: Date, clockOut: Date | null, now: Date = new Date()) =>
    Math.max(0, Math.round(((clockOut ?? now).getTime() - clockIn.getTime()) / 60_000))
