

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

export type TaskStatus = 'todo' | 'in_progress' | 'submitted' | 'returned' | 'done'

// The employee can only start a task. A task is finished by handing in the work and the
// administrator accepting it, so nobody marks their own work as done.
export const canMoveTask = (from: TaskStatus, to: TaskStatus) => from === 'todo' && to === 'in_progress'

// The employee has something to do about it
export const needsAction = (s: TaskStatus) => s === 'todo' || s === 'in_progress' || s === 'returned'

// Late only while the employee still has to act. Work that is handed in on time is not "overdue" while it waits for review.
export const isOverdue = (status: TaskStatus, due: Date, today: Date) => needsAction(status) && due < today

// A finished task takes no more work
export const canSubmitWork = (s: TaskStatus) => s !== 'done'

// Where a task sits in a list: what needs attention first, finished work last
const RANK: Record<TaskStatus, number> = { returned: 0, todo: 1, in_progress: 2, submitted: 3, done: 4 }
export const taskRank = (s: TaskStatus) => RANK[s]

export type ReviewDecision = 'accepted' | 'returned' | 'comment'
export type ReviewOutcome = { ok: true; status: TaskStatus } | { ok: false; message: string }

// What happens to a task when the administrator reviews it
export function reviewOutcome(decision: ReviewDecision, status: TaskStatus): ReviewOutcome {
    if (decision === 'comment') return { ok: true, status }
    if (decision === 'accepted') {
        return status === 'done' ? { ok: false, message: 'This task was already accepted.' } : { ok: true, status: 'done' }
    }
    return status === 'submitted'
        ? { ok: true, status: 'returned' }
        : { ok: false, message: 'Only work that was handed in can be returned for changes.' }
}

// Minutes between clocking in and out. While still clocked in, it counts up to "now".
export const minutesWorked = (clockIn: Date, clockOut: Date | null, now: Date = new Date()) =>
    Math.max(0, Math.round(((clockOut ?? now).getTime() - clockIn.getTime()) / 60_000))
