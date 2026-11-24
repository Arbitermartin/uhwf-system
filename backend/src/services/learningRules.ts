import { z } from 'zod'

// Rules for the knowledge base and for handing in assignment work. Nothing here touches the database.

// Who may read the knowledge base. A student sees general notes and the notes of their own courses.
// Everyone below sees every note. Members are not part of it.
export const STAFF_READERS = ['lecturer', 'employee', 'ict', 'admin'] as const
export const canReadKnowledgeBase = (role: string) => role === 'student' || (STAFF_READERS as readonly string[]).includes(role)

// Who writes notes. Lecturers write for their own courses. ICT and administrators write for any course, and general notes.
export const canWriteNotes = (role: string) => role === 'lecturer' || role === 'ict' || role === 'admin'
export const canPostGeneral = (role: string) => role === 'ict' || role === 'admin'

// May this person change or delete this note?
export function canManageNote(viewer: { role: string }, note: { courseId: number | null }, ownsCourse: boolean): boolean {
    if (viewer.role === 'ict' || viewer.role === 'admin') return true
    if (viewer.role === 'lecturer') return note.courseId !== null && ownsCourse
    return false
}

// May this person post a note for this course (null = a general note)?
export function canPostTo(viewer: { role: string }, courseId: number | null, ownsCourse: boolean): boolean {
    if (courseId === null) return canPostGeneral(viewer.role)
    if (viewer.role === 'ict' || viewer.role === 'admin') return true
    return viewer.role === 'lecturer' && ownsCourse
}

// May this student read this note?
export const studentCanRead = (note: { courseId: number | null }, enrolledCourseIds: number[]) =>
    note.courseId === null || enrolledCourseIds.includes(note.courseId)

export const noteSchema = z.object({
    courseId: z.number({ invalid_type_error: 'Choose a course.' }).int().positive('Choose a course.').nullable(),
    title: z.string().trim().min(3, 'Enter a title (at least 3 characters).').max(150, 'The title is too long.'),
    // paragraphs: a blank line between them
    body: z.string().trim().min(10, 'Write at least 10 characters.').max(30000, 'The note is too long.'),
})

// A hand-in is closed once the lecturer has given a score
export const canHandIn = (score: number | null) => score === null

// Handed in after the due date
export const isLate = (handedIn: Date, due: Date) => handedIn.getTime() > due.getTime()
