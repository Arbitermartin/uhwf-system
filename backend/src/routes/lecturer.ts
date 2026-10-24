import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import {
    activeStudents,
    lecturerProfileId,
    notifyStudents,
    ownedAssignment,
    ownedCourse,
} from '../services/lecturer'
import {
    attendancePercent,
    averagePercent,
    checkAttendanceDay,
    checkScore,
    dayToDate,
    dueDateFromDay,
    isRealDay,
    studentStatus,
    todayInTanzania,
} from '../services/lecturerRules'

const router = Router()

// Lecturers only, checked on the server. Every route below also checks that the course or
// assignment belongs to this lecturer.
router.use(requireAuth, requireRole('lecturer'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

const dayField = (message: string) =>
    z.string().refine((v) => isRealDay(v), message)

// ---------- Overview: the cards and the course tabs ----------
router.get('/overview', async (req, res) => {
    const profileId = await lecturerProfileId(req.user!.id)
    const weekAgo = dayToDate(todayInTanzania(new Date(Date.now() - 6 * 86_400_000)))

    const [courses, distinctStudents, pastDue, week] = await Promise.all([
        prisma.course.findMany({
            where: { lecturerId: profileId },
            orderBy: { code: 'asc' },
            select: {
                id: true,
                code: true,
                title: true,
                isActive: true,
                _count: { select: { enrollments: { where: { status: 'active' } } } },
            },
        }),
        prisma.enrollment.findMany({
            where: { status: 'active', course: { lecturerId: profileId } },
            distinct: ['studentId'],
            select: { studentId: true },
        }),
        prisma.assignment.findMany({
            where: { course: { lecturerId: profileId }, dueDate: { lt: new Date() } },
            select: {
                courseId: true,
                _count: { select: { submissions: { where: { score: { not: null } } } } },
            },
        }),
        prisma.attendanceRecord.groupBy({
            by: ['status'],
            where: { course: { lecturerId: profileId }, date: { gte: weekAgo } },
            _count: { _all: true },
        }),
    ])

    const enrolled = new Map(courses.map((c) => [c.id, c._count.enrollments]))
    // "to grade" = students who have no score yet for an assignment whose due date has passed
    const toGrade = pastDue.reduce(
        (sum, a) => sum + Math.max(0, (enrolled.get(a.courseId) ?? 0) - a._count.submissions),
        0,
    )

    const present = week.find((w) => w.status === 'present')?._count._all ?? 0
    const absent = week.find((w) => w.status === 'absent')?._count._all ?? 0

    res.json({
        courses: courses.map((c) => ({ id: c.id, code: c.code, title: c.title, isActive: c.isActive, enrolled: c._count.enrollments })),
        stats: {
            courses: courses.length,
            students: distinctStudents.length,
            toGrade,
            attendanceWeekPct: attendancePercent(present, absent),
        },
    })
})

// ---------- The students of one course, with attendance and scores ----------
const studentsQuery = z.object({
    date: dayField('Choose a real date.').optional(),
    assignmentId: z.coerce.number().int().positive().optional(),
})

router.get('/courses/:id/students', async (req, res) => {
    const profileId = await lecturerProfileId(req.user!.id)
    const course = await ownedCourse(idSchema.parse(req.params.id), profileId)
    const q = studentsQuery.parse(req.query)
    const day = q.date ?? todayInTanzania()

    const students = await activeStudents(course.id)
    const ids = students.map((s) => s.studentId)

    const [totals, dayMarks, scored] = await Promise.all([
        prisma.attendanceRecord.groupBy({
            by: ['studentId', 'status'],
            where: { courseId: course.id, studentId: { in: ids } },
            _count: { _all: true },
        }),
        prisma.attendanceRecord.findMany({
            where: { courseId: course.id, date: dayToDate(day), studentId: { in: ids } },
            select: { studentId: true, status: true },
        }),
        prisma.submission.findMany({
            where: { assignment: { courseId: course.id }, studentId: { in: ids }, score: { not: null } },
            select: { studentId: true, assignmentId: true, score: true, assignment: { select: { maxScore: true } } },
        }),
    ])

    const rows = students.map((s) => {
        const present = totals.find((t) => t.studentId === s.studentId && t.status === 'present')?._count._all ?? 0
        const absent = totals.find((t) => t.studentId === s.studentId && t.status === 'absent')?._count._all ?? 0
        const mine = scored.filter((x) => x.studentId === s.studentId)
        const avg = averagePercent(mine.map((x) => ({ score: x.score as number, max: x.assignment.maxScore })))
        const selected = q.assignmentId ? mine.find((x) => x.assignmentId === q.assignmentId) : undefined

        return {
            studentId: s.studentId,
            name: s.name,
            regNumber: s.regNumber,
            attendancePct: attendancePercent(present, absent),
            sessions: present + absent,
            today: dayMarks.find((m) => m.studentId === s.studentId)?.status ?? null,
            score: selected ? selected.score : null,
            status: studentStatus(present, absent, avg),
        }
    })

    res.json({ course, date: day, students: rows })
})

// ---------- Save attendance for one day ----------
const attendanceSchema = z.object({
    date: z.string(),
    marks: z
        .array(z.object({ studentId: z.number().int().positive(), status: z.enum(['present', 'absent']) }))
        .min(1, 'Mark at least one student.')
        .max(500),
})

router.put('/courses/:id/attendance', async (req, res) => {
    const userId = req.user!.id
    const profileId = await lecturerProfileId(userId)
    const course = await ownedCourse(idSchema.parse(req.params.id), profileId)
    const body = attendanceSchema.parse(req.body)

    const problem = checkAttendanceDay(body.date)
    if (problem) throw new HttpError(400, problem)

    const ids = body.marks.map((m) => m.studentId)
    if (new Set(ids).size !== ids.length) throw new HttpError(400, 'Each student can only be marked once.')

    // only students who are enrolled in THIS course can be marked
    const enrolled = await prisma.enrollment.count({ where: { courseId: course.id, status: 'active', studentId: { in: ids } } })
    if (enrolled !== ids.length) throw new HttpError(400, 'Some of these students are not enrolled in this course.')

    const date = dayToDate(body.date)
    await prisma.$transaction(
        body.marks.map((m) =>
            prisma.attendanceRecord.upsert({
                where: { courseId_studentId_date: { courseId: course.id, studentId: m.studentId, date } },
                update: { status: m.status, markedById: userId },
                create: { courseId: course.id, studentId: m.studentId, date, status: m.status, markedById: userId },
            }),
        ),
    )

    await prisma.activityLog.create({
        data: { userId, level: 'info', message: `Attendance saved for ${course.code} on ${body.date} (${ids.length} students)` },
    })
    res.json({ saved: ids.length })
})

// ---------- Assignments ----------
const assignmentSchema = z.object({
    title: z.string().trim().min(3, 'Enter a title (at least 3 characters).').max(120, 'The title is too long.'),
    description: z
        .string()
        .trim()
        .max(1000, 'The description is too long.')
        .transform((v) => v || null),
    dueDate: dayField('Choose the due date.'),
    maxScore: z
        .number({ invalid_type_error: 'Enter the maximum score as a number.' })
        .int('Use a whole number.')
        .min(1, 'At least 1.')
        .max(1000, 'At most 1000.'),
})

router.get('/courses/:id/assignments', async (req, res) => {
    const profileId = await lecturerProfileId(req.user!.id)
    const course = await ownedCourse(idSchema.parse(req.params.id), profileId)

    const [rows, enrolled] = await Promise.all([
        prisma.assignment.findMany({
            where: { courseId: course.id },
            orderBy: [{ dueDate: 'desc' }, { id: 'desc' }],
            select: {
                id: true,
                title: true,
                description: true,
                dueDate: true,
                maxScore: true,
                _count: { select: { submissions: { where: { score: { not: null } } } } },
            },
        }),
        prisma.enrollment.count({ where: { courseId: course.id, status: 'active' } }),
    ])

    res.json({
        assignments: rows.map(({ _count, ...a }) => ({ ...a, graded: _count.submissions, enrolled })),
    })
})

router.post('/courses/:id/assignments', async (req, res) => {
    const profileId = await lecturerProfileId(req.user!.id)
    const course = await ownedCourse(idSchema.parse(req.params.id), profileId)
    const body = assignmentSchema.parse(req.body)

    const created = await prisma.assignment.create({
        data: {
            courseId: course.id,
            title: body.title,
            description: body.description,
            dueDate: dueDateFromDay(body.dueDate),
            maxScore: body.maxScore,
        },
        select: { id: true },
    })

    const students = await activeStudents(course.id)
    await notifyStudents(
        students.map((s) => s.userId),
        { type: 'assignment', title: `New assignment in ${course.code}`, body: `${body.title}, due ${body.dueDate}`, linkUrl: '/student' },
    )

    res.status(201).json({ id: created.id })
})

router.patch('/assignments/:id', async (req, res) => {
    const profileId = await lecturerProfileId(req.user!.id)
    const assignment = await ownedAssignment(idSchema.parse(req.params.id), profileId)
    const body = assignmentSchema.parse(req.body)

    // lowering the maximum below a score that was already given would make that score invalid
    const tooHigh = await prisma.submission.count({ where: { assignmentId: assignment.id, score: { gt: body.maxScore } } })
    if (tooHigh > 0) {
        throw new HttpError(409, `${tooHigh} student(s) already have a score above ${body.maxScore}. Keep the maximum higher, or change those scores first.`)
    }

    await prisma.assignment.update({
        where: { id: assignment.id },
        data: {
            title: body.title,
            description: body.description,
            dueDate: dueDateFromDay(body.dueDate),
            maxScore: body.maxScore,
        },
    })
    res.json({ id: assignment.id })
})

router.delete('/assignments/:id', async (req, res) => {
    const profileId = await lecturerProfileId(req.user!.id)
    const assignment = await ownedAssignment(idSchema.parse(req.params.id), profileId)

    // Deleting an assignment would delete the scores students were given, so it is refused.
    const graded = await prisma.submission.count({ where: { assignmentId: assignment.id, score: { not: null } } })
    if (graded > 0) {
        throw new HttpError(409, `${graded} student(s) already have a score for this assignment, so it cannot be deleted.`)
    }

    await prisma.assignment.delete({ where: { id: assignment.id } })
    res.json({ message: 'Assignment deleted.' })
})

// ---------- Save scores for one assignment ----------
const scoresSchema = z.object({
    scores: z
        .array(z.object({ studentId: z.number().int().positive(), score: z.number().nullable() }))
        .min(1, 'Enter at least one score.')
        .max(500),
})

router.put('/assignments/:id/scores', async (req, res) => {
    const userId = req.user!.id
    const profileId = await lecturerProfileId(userId)
    const assignment = await ownedAssignment(idSchema.parse(req.params.id), profileId)
    const body = scoresSchema.parse(req.body)

    const ids = body.scores.map((s) => s.studentId)
    if (new Set(ids).size !== ids.length) throw new HttpError(400, 'Each student can only appear once.')

    const students = await activeStudents(assignment.courseId)
    const known = new Map(students.map((s) => [s.studentId, s]))
    if (ids.some((id) => !known.has(id))) throw new HttpError(400, 'Some of these students are not enrolled in this course.')

    // every score is checked against the maximum of THIS assignment
    const clean: { studentId: number; score: number | null }[] = []
    for (const s of body.scores) {
        if (s.score === null) {
            clean.push({ studentId: s.studentId, score: null })
            continue
        }
        const result = checkScore(s.score, assignment.maxScore)
        if (!result.ok) throw new HttpError(400, `${known.get(s.studentId)!.name}: ${result.message}`)
        clean.push({ studentId: s.studentId, score: result.value })
    }

    const before = await prisma.submission.findMany({
        where: { assignmentId: assignment.id, studentId: { in: ids } },
        select: { studentId: true, score: true },
    })
    const hadScore = new Set(before.filter((b) => b.score !== null).map((b) => b.studentId))
    const hasRow = new Set(before.map((b) => b.studentId))

    const now = new Date()
    await prisma.$transaction(
        clean
            // clearing a score for a student who has no record at all needs no change
            .filter((s) => s.score !== null || hasRow.has(s.studentId))
            .map((s) =>
                prisma.submission.upsert({
                    where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: s.studentId } },
                    update: { score: s.score, gradedAt: s.score === null ? null : now },
                    create: { assignmentId: assignment.id, studentId: s.studentId, score: s.score, gradedAt: now },
                }),
            ),
    )

    // tell a student when a score is posted for the first time (not on every later correction)
    const newlyGraded = clean.filter((s) => s.score !== null && !hadScore.has(s.studentId))
    await notifyStudents(
        newlyGraded.map((s) => known.get(s.studentId)!.userId),
        {
            type: 'grade',
            title: `New score in ${assignment.course.code}`,
            body: `${assignment.title}: your score was posted.`,
            linkUrl: '/student',
        },
    )

    await prisma.activityLog.create({
        data: { userId, level: 'info', message: `Scores saved for "${assignment.title}" (${assignment.course.code}), ${clean.length} students` },
    })
    res.json({ saved: clean.length })
})

// ---------- Announcements for one course ----------
const announcementSchema = z.object({
    title: z.string().trim().min(3, 'Add a title (at least 3 characters).').max(100, 'The title is too long.'),
    body: z.string().trim().min(5, 'Write at least 5 characters.').max(2000, 'The message is too long.'),
})

router.get('/courses/:id/announcements', async (req, res) => {
    const profileId = await lecturerProfileId(req.user!.id)
    const course = await ownedCourse(idSchema.parse(req.params.id), profileId)

    const rows = await prisma.announcement.findMany({
        where: { courseId: course.id, audience: 'course' },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 10,
        select: { id: true, title: true, body: true, createdAt: true, authorId: true, author: { select: { fullName: true } } },
    })

    res.json({
        announcements: rows.map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            createdAt: a.createdAt,
            author: a.author.fullName,
            mine: a.authorId === req.user!.id,
        })),
    })
})

router.post('/courses/:id/announcements', async (req, res) => {
    const userId = req.user!.id
    const profileId = await lecturerProfileId(userId)
    const course = await ownedCourse(idSchema.parse(req.params.id), profileId)
    const body = announcementSchema.parse(req.body)

    await prisma.announcement.create({
        data: { authorId: userId, title: body.title, body: body.body, audience: 'course', courseId: course.id },
    })

    const students = await activeStudents(course.id)
    await notifyStudents(
        students.map((s) => s.userId),
        {
            type: 'announcement',
            title: `${course.code}: ${body.title}`,
            body: body.body.length > 120 ? `${body.body.slice(0, 120)}...` : body.body,
            linkUrl: '/student',
        },
    )

    res.status(201).json({ notified: students.length })
})

router.delete('/announcements/:id', async (req, res) => {
    // a lecturer can only delete their own announcements
    const result = await prisma.announcement.deleteMany({
        where: { id: idSchema.parse(req.params.id), authorId: req.user!.id },
    })
    if (result.count === 0) throw new HttpError(404, 'Announcement not found.')
    res.json({ message: 'Announcement deleted.' })
})

export default router
