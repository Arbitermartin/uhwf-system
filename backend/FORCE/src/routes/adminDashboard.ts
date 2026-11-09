import { Router } from 'express'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'

const router = Router()

// The numbers on the admin's first screen. Administrators only, checked on the server.
router.use(requireAuth, requireRole('admin'))

// Tanzania is UTC+3 all year (no daylight saving), so month boundaries are easy to work out.
const TZ_OFFSET_MS = 3 * 60 * 60 * 1000

// The last `count` months, oldest first, with the exact moment each one starts (in UTC).
export function lastMonths(now: Date, count: number) {
    const local = new Date(now.getTime() + TZ_OFFSET_MS)
    let year = local.getUTCFullYear()
    let month = local.getUTCMonth()

    const months: { key: string; start: Date }[] = []
    for (let i = 0; i < count; i++) {
        months.unshift({
            key: `${year}-${String(month + 1).padStart(2, '0')}`,
            start: new Date(Date.UTC(year, month, 1) - TZ_OFFSET_MS),
        })
        month -= 1
        if (month < 0) {
            month = 11
            year -= 1
        }
    }
    return months
}

router.get('/', async (_req, res) => {
    const months = lastMonths(new Date(), 6)
    const thisMonthStart = months[months.length - 1].start

    const [
        totalUsers,
        newUsers,
        students,
        newStudents,
        lecturers,
        newLecturers,
        courses,
        needsReview,
        pendingPayments,
        grouped,
        monthly,
        recent,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
        prisma.user.count({ where: { role: 'student' } }),
        prisma.user.count({ where: { role: 'student', createdAt: { gte: thisMonthStart } } }),
        prisma.user.count({ where: { role: 'lecturer' } }),
        prisma.user.count({ where: { role: 'lecturer', createdAt: { gte: thisMonthStart } } }),
        prisma.course.count({ where: { isActive: true } }),
        prisma.application.count({ where: { status: 'submitted' } }),
        prisma.payment.count({ where: { status: 'pending' } }),
        prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
        // New student accounts per month (Tanzania time), for the last 6 months
        prisma.$queryRaw<{ month: string; count: number }[]>`
      SELECT to_char((("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Dar_es_Salaam'), 'YYYY-MM') AS month,
             count(*)::int AS count
      FROM users
      WHERE role = 'student'
        AND "createdAt" >= (
          (date_trunc('month', (now() AT TIME ZONE 'Africa/Dar_es_Salaam')) - interval '5 months')
            AT TIME ZONE 'Africa/Dar_es_Salaam'
        ) AT TIME ZONE 'UTC'
      GROUP BY 1`,
        prisma.application.findMany({
            where: { status: { not: 'draft' } },
            orderBy: [{ submittedAt: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
            take: 5,
            select: {
                id: true,
                status: true,
                submittedAt: true,
                user: { select: { fullName: true, email: true } },
                payments: { select: { status: true } },
            },
        }),
    ])

    const byRole: Record<string, number> = { student: 0, lecturer: 0, employee: 0, ict: 0, admin: 0 }
    for (const g of grouped) byRole[g.role] = g._count._all

    const perMonth = new Map(monthly.map((m) => [m.month, m.count]))

    res.json({
        stats: {
            totalUsers,
            newUsersThisMonth: newUsers,
            students,
            newStudentsThisMonth: newStudents,
            lecturers,
            newLecturersThisMonth: newLecturers,
            courses,
            needsReview,
            pendingPayments,
        },
        registrations: months.map((m) => ({ month: m.key, count: perMonth.get(m.key) ?? 0 })),
        roles: {
            students: byRole.student,
            lecturers: byRole.lecturer,
            employees: byRole.employee,
            staff: byRole.ict + byRole.admin, // ICT and administrators together
        },
        recent: recent.map((a) => ({
            id: a.id,
            status: a.status,
            submittedAt: a.submittedAt,
            student: { name: a.user.fullName, email: a.user.email },
            paymentStatus: a.payments.some((p) => p.status === 'paid')
                ? 'paid'
                : a.payments.some((p) => p.status === 'pending')
                    ? 'pending'
                    : 'none',
        })),
    })
})

export default router
