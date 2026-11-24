import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { cleanFileName, removeUpload, resolveUpload, saveUpload } from '../services/files'
import { WORK_MAX_BYTES, detectWorkDocument, workContentType } from '../services/workFiles'
import { makeExcerpt } from '../services/content'
import {
    canManageNote,
    canPostGeneral,
    canPostTo,
    canReadKnowledgeBase,
    canWriteNotes,
    noteSchema,
} from '../services/learningRules'

const router = Router()

// The knowledge base ("My learning" for students). Who can see and change what is decided below,
// on the server, for every request.
router.use(requireAuth)

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: WORK_MAX_BYTES, files: 1 } })

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

type Viewer = { id: number; role: string }

const courseSelect = { id: true, code: true, title: true } as const

// ---------- What this person may see and do ----------
async function studentCourseIds(userId: number) {
    const rows = await prisma.enrollment.findMany({
        where: { status: { in: ['active', 'completed'] }, student: { userId } },
        select: { courseId: true },
    })
    return rows.map((r) => r.courseId)
}

async function ownedCourseIds(userId: number) {
    const rows = await prisma.course.findMany({ where: { lecturer: { userId } }, select: { id: true } })
    return rows.map((r) => r.id)
}

// Which notes this person may read. A student: general notes and the notes of their own courses.
async function visibleWhere(viewer: Viewer): Promise<Prisma.LearningNoteWhereInput> {
    if (!canReadKnowledgeBase(viewer.role)) throw new HttpError(403, 'The knowledge base is not open to your account.')
    if (viewer.role === 'student') {
        return { OR: [{ courseId: null }, { courseId: { in: await studentCourseIds(viewer.id) } }] }
    }
    return {}
}

const noteSelect = {
    id: true,
    courseId: true,
    title: true,
    body: true,
    attachmentName: true,
    createdAt: true,
    updatedAt: true,
    course: { select: courseSelect },
    author: { select: { fullName: true, role: true } },
} satisfies Prisma.LearningNoteSelect

type Note = Prisma.LearningNoteGetPayload<{ select: typeof noteSelect }>

const attachmentOf = (n: Note) =>
    n.attachmentName ? { name: n.attachmentName, inlineViewable: n.attachmentName.toLowerCase().endsWith('.pdf') } : null

const toCard = (n: Note, manageable: boolean) => ({
    id: n.id,
    title: n.title,
    excerpt: makeExcerpt(n.body, 200),
    course: n.course,
    author: n.author.fullName,
    authorRole: n.author.role,
    attachment: attachmentOf(n),
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    manageable,
})

// ---------- Courses to post to and to filter by ----------
router.get('/meta', async (req, res) => {
    const me = req.user!
    if (!canReadKnowledgeBase(me.role)) throw new HttpError(403, 'The knowledge base is not open to your account.')

    const write = canWriteNotes(me.role)
    const [postable, filter] = await Promise.all([
        !write
            ? []
            : me.role === 'lecturer'
                ? prisma.course.findMany({ where: { lecturer: { userId: me.id } }, orderBy: { code: 'asc' }, select: courseSelect })
                : prisma.course.findMany({ orderBy: { code: 'asc' }, select: courseSelect }),
        me.role === 'student'
            ? prisma.course.findMany({ where: { id: { in: await studentCourseIds(me.id) } }, orderBy: { code: 'asc' }, select: courseSelect })
            : prisma.course.findMany({ orderBy: { code: 'asc' }, select: courseSelect }),
    ])

    res.json({ canWrite: write, canPostGeneral: canPostGeneral(me.role), postableCourses: postable, filterCourses: filter })
})

// ---------- List ----------
const listQuery = z.object({
    course: z.string().optional(), // a course id, or "general"
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(30).default(12),
})

router.get('/', async (req, res) => {
    const me = req.user!
    const q = listQuery.parse(req.query)

    const visible = await visibleWhere(me)
    const filters: Prisma.LearningNoteWhereInput[] = []
    if (q.course === 'general') filters.push({ courseId: null })
    else if (q.course && Number.isInteger(Number(q.course))) filters.push({ courseId: Number(q.course) })
    if (q.search) {
        filters.push({ OR: [{ title: { contains: q.search, mode: 'insensitive' } }, { body: { contains: q.search, mode: 'insensitive' } }] })
    }
    const where: Prisma.LearningNoteWhereInput = { AND: [visible, ...filters] }

    const owned = me.role === 'lecturer' ? new Set(await ownedCourseIds(me.id)) : new Set<number>()

    const [rows, total] = await Promise.all([
        prisma.learningNote.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select: noteSelect,
        }),
        prisma.learningNote.count({ where }),
    ])

    res.json({
        notes: rows.map((n) => toCard(n, canManageNote(me, n, n.courseId !== null && owned.has(n.courseId)))),
        total,
        page: q.page,
        pageSize: q.pageSize,
    })
})

// A note the person may read, or "not found"
async function openNote(id: number, viewer: Viewer) {
    const visible = await visibleWhere(viewer)
    const note = await prisma.learningNote.findFirst({ where: { AND: [visible, { id }] }, select: noteSelect })
    if (!note) throw new HttpError(404, 'Note not found.')
    return note
}

async function manageableNote(id: number, viewer: Viewer) {
    const note = await openNote(id, viewer)
    const owns = note.courseId !== null && (await ownedCourseIds(viewer.id)).includes(note.courseId)
    if (!canManageNote(viewer, note, owns)) throw new HttpError(403, 'You cannot change this note.')
    return note
}

const detail = (n: Note, manageable: boolean) => ({ ...toCard(n, manageable), body: n.body, courseId: n.courseId })

router.get('/:id', async (req, res) => {
    const me = req.user!
    const note = await openNote(idSchema.parse(req.params.id), me)
    const owns = note.courseId !== null && me.role === 'lecturer' && (await ownedCourseIds(me.id)).includes(note.courseId)
    res.json({ note: detail(note, canManageNote(me, note, owns)) })
})

// ---------- Write a note ----------
router.post('/', async (req, res) => {
    const me = req.user!
    if (!canWriteNotes(me.role)) throw new HttpError(403, 'Only lecturers, ICT and administrators write notes.')
    const body = noteSchema.parse(req.body)

    const owns = body.courseId !== null && me.role === 'lecturer' && (await ownedCourseIds(me.id)).includes(body.courseId)
    if (!canPostTo(me, body.courseId, owns)) {
        throw new HttpError(403, body.courseId === null ? 'Only ICT and administrators write general notes.' : 'You can only write notes for your own courses.')
    }
    const course = body.courseId === null ? null : await prisma.course.findUnique({ where: { id: body.courseId }, select: { code: true } })
    if (body.courseId !== null && !course) throw new HttpError(400, 'That course does not exist.')

    const created = await prisma.learningNote.create({
        data: { courseId: body.courseId, authorId: me.id, title: body.title, body: body.body },
        select: { id: true },
    })

    // the students of the course are told
    if (course && body.courseId !== null) {
        const students = await prisma.enrollment.findMany({
            where: { courseId: body.courseId, status: 'active' },
            select: { student: { select: { userId: true } } },
        })
        await prisma.notification.createMany({
            data: students.map((s) => ({
                userId: s.student.userId,
                type: 'learning',
                title: `New learning note in ${course.code}`,
                body: body.title,
                linkUrl: '/student/learning',
            })),
        })
    }

    const note = await openNote(created.id, me)
    res.status(201).json({ note: detail(note, true) })
})

// ---------- Change and delete ----------
router.patch('/:id', async (req, res) => {
    const me = req.user!
    const id = idSchema.parse(req.params.id)
    const body = noteSchema.parse(req.body)
    await manageableNote(id, me)

    // it can only be moved to a place this person may post to
    const owns = body.courseId !== null && me.role === 'lecturer' && (await ownedCourseIds(me.id)).includes(body.courseId)
    if (!canPostTo(me, body.courseId, owns)) throw new HttpError(403, 'You cannot move this note there.')

    await prisma.learningNote.update({ where: { id }, data: { courseId: body.courseId, title: body.title, body: body.body } })
    res.json({ note: detail(await openNote(id, me), true) })
})

router.delete('/:id', async (req, res) => {
    const me = req.user!
    const id = idSchema.parse(req.params.id)
    await manageableNote(id, me)

    const row = await prisma.learningNote.findUnique({ where: { id }, select: { attachmentPath: true } })
    await prisma.learningNote.delete({ where: { id } })
    if (row?.attachmentPath) await removeUpload(row.attachmentPath)
    res.json({ message: 'Note deleted.' })
})

// ---------- The attachment: a PDF or a Word (.docx) file ----------
router.post('/:id/attachment', upload.single('file'), async (req, res) => {
    const me = req.user!
    const id = idSchema.parse(req.params.id)
    await manageableNote(id, me)

    const file = req.file
    if (!file) throw new HttpError(400, 'Choose a file first.')
    const doc = detectWorkDocument(file.buffer) // the real contents are checked, not the name
    if (!doc) throw new HttpError(400, 'Attach a PDF or a Word (.docx) file. An old .doc file must be saved as .docx first.')

    const old = await prisma.learningNote.findUnique({ where: { id }, select: { attachmentPath: true } })
    const stored = await saveUpload('learning', `note${id}`, file.buffer, doc.ext)
    const name = `${cleanFileName(file.originalname).replace(/\.(docx?|pdf)$/i, '')}.${doc.ext}`
    try {
        await prisma.learningNote.update({ where: { id }, data: { attachmentPath: stored, attachmentName: name } })
    } catch (err) {
        await removeUpload(stored)
        throw err
    }
    if (old?.attachmentPath) await removeUpload(old.attachmentPath)

    res.json({ note: detail(await openNote(id, me), true) })
})

router.delete('/:id/attachment', async (req, res) => {
    const me = req.user!
    const id = idSchema.parse(req.params.id)
    await manageableNote(id, me)

    const old = await prisma.learningNote.findUnique({ where: { id }, select: { attachmentPath: true } })
    await prisma.learningNote.update({ where: { id }, data: { attachmentPath: null, attachmentName: null } })
    if (old?.attachmentPath) await removeUpload(old.attachmentPath)
    res.json({ note: detail(await openNote(id, me), true) })
})

// Open a PDF in the page (?inline=1), or download any attachment. Only people who may read the note get the file.
router.get('/:id/attachment', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    await openNote(id, req.user!)

    const row = await prisma.learningNote.findUnique({ where: { id }, select: { attachmentPath: true, attachmentName: true } })
    if (!row?.attachmentPath || !row.attachmentName) throw new HttpError(404, 'This note has no attachment.')

    const file = resolveUpload(row.attachmentPath)
    const ext = path.extname(file).slice(1)
    const inline = req.query.inline === '1' && ext === 'pdf'
    res.setHeader('Content-Type', workContentType(ext))
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${cleanFileName(row.attachmentName)}"`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.sendFile(file, (err) => {
        if (err && !res.headersSent) res.status(404).json({ message: 'The file is missing on the server.' })
    })
})

export default router
