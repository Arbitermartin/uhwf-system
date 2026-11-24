// import { Router } from 'express'
// import { z } from 'zod'
// import { prisma } from '../prisma'
// import { requireAuth, requireRole } from '../middleware/auth'
// import { HttpError } from '../utils/httpError'
// import { weekdayInTanzania } from '../services/timetableRules'

// const router = Router()

// // Students only. Every query below is limited to the signed-in student's own records.
// router.use(requireAuth, requireRole('student'))

// const idSchema = z.coerce
//     .number({ invalid_type_error: 'Invalid id.' })
//     .int('Invalid id.')
//     .positive('Invalid id.')

// // These pages exist only after the application was approved (that is when the student record is made).
// async function studentProfileId(userId: number) {
//     const profile = await prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } })
//     if (!profile) throw new HttpError(403, 'This page is available after your application is approved.')
//     return profile.id
// }

// const round = (n: number) => Math.round(n)
// const average = (values: number[]) => (values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length)

// // Everything about the student's courses, attendance and assignments, loaded together.
// async function loadMine(studentId: number, statuses: ('active' | 'completed')[]) {
//     const enrollments = await prisma.enrollment.findMany({
//         where: { studentId, status: { in: statuses } },
//         orderBy: { course: { code: 'asc' } },
//         select: {
//             course: {
//                 select: {
//                     id: true,
//                     code: true,
//                     title: true,
//                     credits: true,
//                     description: true,
//                     department: { select: { name: true } },
//                     lecturer: { select: { user: { select: { fullName: true } } } },
//                 },
//             },
//         },
//     })
//     const courses = enrollments.map((e) => e.course)
//     const ids = courses.map((c) => c.id)

//     const [attendance, assignments] = await Promise.all([
//         prisma.attendanceRecord.groupBy({
//             by: ['courseId', 'status'],
//             where: { studentId, courseId: { in: ids } },
//             _count: { _all: true },
//         }),
//         prisma.assignment.findMany({
//             where: { courseId: { in: ids } },
//             orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
//             select: {
//                 id: true,
//                 courseId: true,
//                 title: true,
//                 dueDate: true,
//                 maxScore: true,
//                 submissions: { where: { studentId }, select: { score: true } },
//             },
//         }),
//     ])

//     return { courses, attendance, assignments }
// }

// type Mine = Awaited<ReturnType<typeof loadMine>>

// const attendanceOf = (m: Mine, courseId: number) => {
//     const present = m.attendance.find((a) => a.courseId === courseId && a.status === 'present')?._count._all ?? 0
//     const absent = m.attendance.find((a) => a.courseId === courseId && a.status === 'absent')?._count._all ?? 0
//     const sessions = present + absent
//     return { present, absent, pct: sessions === 0 ? null : round((present / sessions) * 100) }
// }

// const assignmentRows = (m: Mine, courseId: number) =>
//     m.assignments
//         .filter((a) => a.courseId === courseId)
//         .map((a) => {
//             const score = a.submissions[0]?.score ?? null
//             return {
//                 id: a.id,
//                 title: a.title,
//                 dueDate: a.dueDate,
//                 maxScore: a.maxScore,
//                 score,
//                 pct: score === null ? null : round((score / a.maxScore) * 100),
//             }
//         })

// const gradedPercents = (m: Mine, courseId?: number) =>
//     m.assignments
//         .filter((a) => (courseId === undefined || a.courseId === courseId) && a.submissions[0]?.score != null)
//         .map((a) => ((a.submissions[0].score as number) / a.maxScore) * 100)

// const lecturerName = (c: Mine['courses'][number]) => c.lecturer?.user.fullName ?? null

// // ---------- My courses ----------
// router.get('/courses', async (req, res) => {
//     const mine = await loadMine(await studentProfileId(req.user!.id), ['active', 'completed'])

//     res.json({
//         courses: mine.courses.map((c) => {
//             const rows = assignmentRows(mine, c.id)
//             const avg = average(gradedPercents(mine, c.id))
//             return {
//                 id: c.id,
//                 code: c.code,
//                 title: c.title,
//                 credits: c.credits,
//                 department: c.department.name,
//                 lecturer: lecturerName(c),
//                 attendance: attendanceOf(mine, c.id),
//                 assignments: { total: rows.length, graded: rows.filter((r) => r.score !== null).length },
//                 averagePct: avg === null ? null : round(avg),
//             }
//         }),
//     })
// })

// router.get('/courses/:id', async (req, res) => {
//     const studentId = await studentProfileId(req.user!.id)
//     const courseId = idSchema.parse(req.params.id)

//     const mine = await loadMine(studentId, ['active', 'completed'])
//     const course = mine.courses.find((c) => c.id === courseId)
//     if (!course) throw new HttpError(404, 'Course not found.') // a course you are not in looks like it does not exist

//     const [announcements, sessions] = await Promise.all([
//         prisma.announcement.findMany({
//             where: { courseId, audience: 'course' },
//             orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
//             take: 10,
//             select: { id: true, title: true, body: true, createdAt: true, author: { select: { fullName: true } } },
//         }),
//         prisma.attendanceRecord.findMany({
//             where: { studentId, courseId },
//             orderBy: { date: 'desc' },
//             take: 15,
//             select: { date: true, status: true },
//         }),
//     ])

//     res.json({
//         course: {
//             id: course.id,
//             code: course.code,
//             title: course.title,
//             credits: course.credits,
//             description: course.description,
//             department: course.department.name,
//             lecturer: lecturerName(course),
//         },
//         attendance: attendanceOf(mine, course.id),
//         sessions: sessions.map((s) => ({ date: s.date.toISOString().slice(0, 10), status: s.status })),
//         assignments: assignmentRows(mine, course.id),
//         announcements: announcements.map((a) => ({
//             id: a.id,
//             title: a.title,
//             body: a.body,
//             createdAt: a.createdAt,
//             author: a.author.fullName,
//         })),
//     })
// })

// // ---------- Results ----------
// router.get('/results', async (req, res) => {
//     const mine = await loadMine(await studentProfileId(req.user!.id), ['active', 'completed'])

//     const courses = mine.courses.map((c) => {
//         const rows = assignmentRows(mine, c.id)
//         const avg = average(gradedPercents(mine, c.id))
//         return {
//             courseId: c.id,
//             code: c.code,
//             title: c.title,
//             assignments: rows,
//             averagePct: avg === null ? null : round(avg),
//             graded: rows.filter((r) => r.score !== null).length,
//             total: rows.length,
//             attendancePct: attendanceOf(mine, c.id).pct,
//         }
//     })

//     const all = average(gradedPercents(mine))
//     const present = mine.attendance.filter((a) => a.status === 'present').reduce((s, a) => s + a._count._all, 0)
//     const absent = mine.attendance.filter((a) => a.status === 'absent').reduce((s, a) => s + a._count._all, 0)

//     res.json({
//         courses,
//         overall: {
//             averagePct: all === null ? null : round(all),
//             attendancePct: present + absent === 0 ? null : round((present / (present + absent)) * 100),
//             graded: courses.reduce((s, c) => s + c.graded, 0),
//             total: courses.reduce((s, c) => s + c.total, 0),
//         },
//     })
// })

// // ---------- Timetable ----------
// const slotSelect = {
//     id: true,
//     courseId: true,
//     weekday: true,
//     startTime: true,
//     endTime: true,
//     room: true,
//     course: { select: { code: true, title: true, lecturer: { select: { user: { select: { fullName: true } } } } } },
// } as const

// const toSlot = (s: {
//     id: number
//     courseId: number
//     weekday: number
//     startTime: string
//     endTime: string
//     room: string | null
//     course: { code: string; title: string; lecturer: { user: { fullName: string } } | null }
// }) => ({
//     id: s.id,
//     courseId: s.courseId,
//     courseCode: s.course.code,
//     courseTitle: s.course.title,
//     weekday: s.weekday,
//     startTime: s.startTime,
//     endTime: s.endTime,
//     room: s.room,
//     lecturer: s.course.lecturer?.user.fullName ?? null,
// })

// const mySlots = (studentId: number) =>
//     prisma.timetableSlot.findMany({
//         where: { course: { enrollments: { some: { studentId, status: 'active' } } } },
//         orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
//         select: slotSelect,
//     })

// router.get('/timetable', async (req, res) => {
//     const slots = await mySlots(await studentProfileId(req.user!.id))
//     res.json({ slots: slots.map(toSlot) })
// })

// // ---------- Home (the dashboard after approval) ----------
// router.get('/home', async (req, res) => {
//     const studentId = await studentProfileId(req.user!.id)
//     const mine = await loadMine(studentId, ['active', 'completed'])

//     const [slots, announcements] = await Promise.all([
//         mySlots(studentId),
//         prisma.announcement.findMany({
//             where: { audience: 'course', course: { enrollments: { some: { studentId, status: 'active' } } } },
//             orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
//             take: 5,
//             select: {
//                 id: true,
//                 title: true,
//                 body: true,
//                 createdAt: true,
//                 course: { select: { code: true } },
//                 author: { select: { fullName: true } },
//             },
//         }),
//     ])

//     const present = mine.attendance.filter((a) => a.status === 'present').reduce((s, a) => s + a._count._all, 0)
//     const absent = mine.attendance.filter((a) => a.status === 'absent').reduce((s, a) => s + a._count._all, 0)
//     const avg = average(gradedPercents(mine))
//     const today = weekdayInTanzania()

//     res.json({
//         stats: {
//             courses: mine.courses.length,
//             credits: mine.courses.reduce((s, c) => s + c.credits, 0),
//             attendancePct: present + absent === 0 ? null : round((present / (present + absent)) * 100),
//             averagePct: avg === null ? null : round(avg),
//         },
//         today: slots.filter((s) => s.weekday === today).map(toSlot),
//         announcements: announcements.map((a) => ({
//             id: a.id,
//             title: a.title,
//             body: a.body,
//             createdAt: a.createdAt,
//             course: a.course?.code ?? '',
//             author: a.author.fullName,
//         })),
//     })
// })

// export default router

import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { weekdayInTanzania } from '../services/timetableRules'
import { cleanFileName, removeUpload, resolveUpload, saveUpload } from '../services/files'
import { WORK_MAX_BYTES, detectWorkDocument, workContentType } from '../services/workFiles'
import { canHandIn, isLate } from '../services/learningRules'

const router = Router()

// Students only. Every query below is limited to the signed-in student's own records.
router.use(requireAuth, requireRole('student'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

// These pages exist only after the application was approved (that is when the student record is made).
async function studentProfileId(userId: number) {
    const profile = await prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } })
    if (!profile) throw new HttpError(403, 'This page is available after your application is approved.')
    return profile.id
}

const round = (n: number) => Math.round(n)
const average = (values: number[]) => (values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length)

// Everything about the student's courses, attendance and assignments, loaded together.
async function loadMine(studentId: number, statuses: ('active' | 'completed')[]) {
    const enrollments = await prisma.enrollment.findMany({
        where: { studentId, status: { in: statuses } },
        orderBy: { course: { code: 'asc' } },
        select: {
            course: {
                select: {
                    id: true,
                    code: true,
                    title: true,
                    credits: true,
                    description: true,
                    department: { select: { name: true } },
                    lecturer: { select: { user: { select: { fullName: true } } } },
                },
            },
        },
    })
    const courses = enrollments.map((e) => e.course)
    const ids = courses.map((c) => c.id)

    const [attendance, assignments] = await Promise.all([
        prisma.attendanceRecord.groupBy({
            by: ['courseId', 'status'],
            where: { studentId, courseId: { in: ids } },
            _count: { _all: true },
        }),
        prisma.assignment.findMany({
            where: { courseId: { in: ids } },
            orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
            select: {
                id: true,
                courseId: true,
                title: true,
                dueDate: true,
                maxScore: true,
                submissions: { where: { studentId }, select: { score: true, fileUrl: true, fileName: true, handedInAt: true } },
            },
        }),
    ])

    return { courses, attendance, assignments }
}

type Mine = Awaited<ReturnType<typeof loadMine>>

const attendanceOf = (m: Mine, courseId: number) => {
    const present = m.attendance.find((a) => a.courseId === courseId && a.status === 'present')?._count._all ?? 0
    const absent = m.attendance.find((a) => a.courseId === courseId && a.status === 'absent')?._count._all ?? 0
    const sessions = present + absent
    return { present, absent, pct: sessions === 0 ? null : round((present / sessions) * 100) }
}

const assignmentRows = (m: Mine, courseId: number) =>
    m.assignments
        .filter((a) => a.courseId === courseId)
        .map((a) => {
            const sub = a.submissions[0]
            const score = sub?.score ?? null
            return {
                id: a.id,
                title: a.title,
                dueDate: a.dueDate,
                maxScore: a.maxScore,
                score,
                pct: score === null ? null : round((score / a.maxScore) * 100),
                // the file the student handed in, if any. Closed once the lecturer has scored it.
                handedIn:
                    sub?.fileUrl && sub.handedInAt
                        ? { fileName: sub.fileName ?? 'file', at: sub.handedInAt, late: isLate(sub.handedInAt, a.dueDate) }
                        : null,
                canHandIn: canHandIn(score),
            }
        })

const gradedPercents = (m: Mine, courseId?: number) =>
    m.assignments
        .filter((a) => (courseId === undefined || a.courseId === courseId) && a.submissions[0]?.score != null)
        .map((a) => ((a.submissions[0].score as number) / a.maxScore) * 100)

const lecturerName = (c: Mine['courses'][number]) => c.lecturer?.user.fullName ?? null

// ---------- My courses ----------
router.get('/courses', async (req, res) => {
    const mine = await loadMine(await studentProfileId(req.user!.id), ['active', 'completed'])

    res.json({
        courses: mine.courses.map((c) => {
            const rows = assignmentRows(mine, c.id)
            const avg = average(gradedPercents(mine, c.id))
            return {
                id: c.id,
                code: c.code,
                title: c.title,
                credits: c.credits,
                department: c.department.name,
                lecturer: lecturerName(c),
                attendance: attendanceOf(mine, c.id),
                assignments: { total: rows.length, graded: rows.filter((r) => r.score !== null).length },
                averagePct: avg === null ? null : round(avg),
            }
        }),
    })
})

router.get('/courses/:id', async (req, res) => {
    const studentId = await studentProfileId(req.user!.id)
    const courseId = idSchema.parse(req.params.id)

    const mine = await loadMine(studentId, ['active', 'completed'])
    const course = mine.courses.find((c) => c.id === courseId)
    if (!course) throw new HttpError(404, 'Course not found.') // a course you are not in looks like it does not exist

    const [announcements, sessions] = await Promise.all([
        prisma.announcement.findMany({
            where: { courseId, audience: 'course' },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 10,
            select: { id: true, title: true, body: true, createdAt: true, author: { select: { fullName: true } } },
        }),
        prisma.attendanceRecord.findMany({
            where: { studentId, courseId },
            orderBy: { date: 'desc' },
            take: 15,
            select: { date: true, status: true },
        }),
    ])

    res.json({
        course: {
            id: course.id,
            code: course.code,
            title: course.title,
            credits: course.credits,
            description: course.description,
            department: course.department.name,
            lecturer: lecturerName(course),
        },
        attendance: attendanceOf(mine, course.id),
        sessions: sessions.map((s) => ({ date: s.date.toISOString().slice(0, 10), status: s.status })),
        assignments: assignmentRows(mine, course.id),
        announcements: announcements.map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            createdAt: a.createdAt,
            author: a.author.fullName,
        })),
    })
})

// ---------- Results ----------
router.get('/results', async (req, res) => {
    const mine = await loadMine(await studentProfileId(req.user!.id), ['active', 'completed'])

    const courses = mine.courses.map((c) => {
        const rows = assignmentRows(mine, c.id)
        const avg = average(gradedPercents(mine, c.id))
        return {
            courseId: c.id,
            code: c.code,
            title: c.title,
            assignments: rows,
            averagePct: avg === null ? null : round(avg),
            graded: rows.filter((r) => r.score !== null).length,
            total: rows.length,
            attendancePct: attendanceOf(mine, c.id).pct,
        }
    })

    const all = average(gradedPercents(mine))
    const present = mine.attendance.filter((a) => a.status === 'present').reduce((s, a) => s + a._count._all, 0)
    const absent = mine.attendance.filter((a) => a.status === 'absent').reduce((s, a) => s + a._count._all, 0)

    res.json({
        courses,
        overall: {
            averagePct: all === null ? null : round(all),
            attendancePct: present + absent === 0 ? null : round((present / (present + absent)) * 100),
            graded: courses.reduce((s, c) => s + c.graded, 0),
            total: courses.reduce((s, c) => s + c.total, 0),
        },
    })
})

// ---------- Timetable ----------
const slotSelect = {
    id: true,
    courseId: true,
    weekday: true,
    startTime: true,
    endTime: true,
    room: true,
    course: { select: { code: true, title: true, lecturer: { select: { user: { select: { fullName: true } } } } } },
} as const

const toSlot = (s: {
    id: number
    courseId: number
    weekday: number
    startTime: string
    endTime: string
    room: string | null
    course: { code: string; title: string; lecturer: { user: { fullName: string } } | null }
}) => ({
    id: s.id,
    courseId: s.courseId,
    courseCode: s.course.code,
    courseTitle: s.course.title,
    weekday: s.weekday,
    startTime: s.startTime,
    endTime: s.endTime,
    room: s.room,
    lecturer: s.course.lecturer?.user.fullName ?? null,
})

const mySlots = (studentId: number) =>
    prisma.timetableSlot.findMany({
        where: { course: { enrollments: { some: { studentId, status: 'active' } } } },
        orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
        select: slotSelect,
    })

router.get('/timetable', async (req, res) => {
    const slots = await mySlots(await studentProfileId(req.user!.id))
    res.json({ slots: slots.map(toSlot) })
})

// ---------- Home (the dashboard after approval) ----------
router.get('/home', async (req, res) => {
    const studentId = await studentProfileId(req.user!.id)
    const mine = await loadMine(studentId, ['active', 'completed'])

    const [slots, announcements] = await Promise.all([
        mySlots(studentId),
        prisma.announcement.findMany({
            where: { audience: 'course', course: { enrollments: { some: { studentId, status: 'active' } } } },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 5,
            select: {
                id: true,
                title: true,
                body: true,
                createdAt: true,
                course: { select: { code: true } },
                author: { select: { fullName: true } },
            },
        }),
    ])

    const present = mine.attendance.filter((a) => a.status === 'present').reduce((s, a) => s + a._count._all, 0)
    const absent = mine.attendance.filter((a) => a.status === 'absent').reduce((s, a) => s + a._count._all, 0)
    const avg = average(gradedPercents(mine))
    const today = weekdayInTanzania()

    res.json({
        stats: {
            courses: mine.courses.length,
            credits: mine.courses.reduce((s, c) => s + c.credits, 0),
            attendancePct: present + absent === 0 ? null : round((present / (present + absent)) * 100),
            averagePct: avg === null ? null : round(avg),
        },
        today: slots.filter((s) => s.weekday === today).map(toSlot),
        announcements: announcements.map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            createdAt: a.createdAt,
            course: a.course?.code ?? '',
            author: a.author.fullName,
        })),
    })
})

// ---------- Hand in assignment work: a Word (.docx) or PDF file ----------
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: WORK_MAX_BYTES, files: 1 } })

router.post('/assignments/:id/submit', upload.single('file'), async (req, res) => {
    const studentId = await studentProfileId(req.user!.id)
    const id = idSchema.parse(req.params.id)
    const note = z.string().trim().max(1000, 'The note is too long (1000 characters at most).').default('').parse(req.body?.note ?? '')

    // only an assignment of a course the student is enrolled in
    const assignment = await prisma.assignment.findFirst({
        where: { id, course: { enrollments: { some: { studentId, status: 'active' } } } },
        select: { id: true, title: true, course: { select: { code: true, lecturer: { select: { userId: true } } } } },
    })
    if (!assignment) throw new HttpError(404, 'Assignment not found.')

    const existing = await prisma.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId: id, studentId } },
        select: { score: true, fileUrl: true },
    })
    if (existing && !canHandIn(existing.score)) throw new HttpError(409, 'Your lecturer already scored this work, so it is closed.')

    const file = req.file
    if (!file) throw new HttpError(400, 'Choose your file first.')
    const doc = detectWorkDocument(file.buffer) // the real contents are checked, not the name
    if (!doc) throw new HttpError(400, 'Hand in a Word (.docx) or PDF file. An old .doc file must be saved as .docx first.')

    const stored = await saveUpload('assignments', `a${id}s${studentId}`, file.buffer, doc.ext)
    const fileName = `${cleanFileName(file.originalname).replace(/\.(docx?|pdf)$/i, '')}.${doc.ext}`
    const now = new Date()

    try {
        await prisma.submission.upsert({
            where: { assignmentId_studentId: { assignmentId: id, studentId } },
            update: { fileUrl: stored, fileName, note: note || null, handedInAt: now },
            create: { assignmentId: id, studentId, fileUrl: stored, fileName, note: note || null, handedInAt: now },
        })
    } catch (err) {
        await removeUpload(stored) // never keep a file nobody points to
        throw err
    }
    if (existing?.fileUrl) await removeUpload(existing.fileUrl) // the new version replaces the old one

    const lecturerUserId = assignment.course.lecturer?.userId
    if (lecturerUserId) {
        await prisma.notification.create({
            data: {
                userId: lecturerUserId,
                type: 'assignment_handed_in',
                title: `${req.user!.fullName} handed in work`,
                body: `${assignment.course.code}: ${assignment.title}`,
                linkUrl: '/lecturer/assignments',
            },
        })
    }
    res.status(201).json({ message: 'Your work was handed in.' })
})

// The student's own file
router.get('/assignments/:id/file', async (req, res) => {
    const studentId = await studentProfileId(req.user!.id)
    const sub = await prisma.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId: idSchema.parse(req.params.id), studentId } },
        select: { fileUrl: true, fileName: true },
    })
    if (!sub?.fileUrl) throw new HttpError(404, 'File not found.')

    const file = resolveUpload(sub.fileUrl)
    res.setHeader('Content-Type', workContentType(path.extname(file).slice(1)))
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName(sub.fileName ?? 'work')}"`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.sendFile(file, (err) => {
        if (err && !res.headersSent) res.status(404).json({ message: 'The file is missing on the server.' })
    })
})

export default router

