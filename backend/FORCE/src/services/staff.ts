import { prisma } from '../prisma'
import { dayToDate } from './lecturerRules'
import { DEFAULT_ANNUAL_LEAVE_DAYS } from './staffRules'

// How many days of annual leave one employee gets per year. A sample value until UHWF sets its policy:
// change it by adding the setting "leave.annualDays" in the settings table.
export async function annualLeaveDays() {
    const row = await prisma.setting.findUnique({ where: { key: 'leave.annualDays' } })
    const n = Number.parseInt(row?.value ?? '', 10)
    return Number.isInteger(n) && n >= 0 && n <= 365 ? n : DEFAULT_ANNUAL_LEAVE_DAYS
}

// The annual leave of one employee for one calendar year (a request counts for the year it starts in).
//   left      = days not yet taken (approved leave is taken)
//   remaining = days that can still be requested (requests waiting for a decision are held back)
export async function leaveBalance(userId: number, year: number) {
    const total = await annualLeaveDays()
    const rows = await prisma.leaveRequest.groupBy({
        by: ['status'],
        where: {
            userId,
            type: 'annual',
            status: { in: ['pending', 'approved'] },
            startDate: { gte: dayToDate(`${year}-01-01`), lte: dayToDate(`${year}-12-31`) },
        },
        _sum: { days: true },
    })
    const used = rows.find((r) => r.status === 'approved')?._sum.days ?? 0
    const pending = rows.find((r) => r.status === 'pending')?._sum.days ?? 0
    return { total, used, pending, left: total - used, remaining: total - used - pending }
}

// Announcements an employee can read: for everyone, or for employees
export const employeeNotices = {
    OR: [{ audience: 'all' as const }, { audience: 'role' as const, targetRole: 'employee' as const }],
}
