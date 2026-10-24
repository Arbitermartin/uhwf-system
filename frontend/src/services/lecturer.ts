import { api } from './api'

export type LecturerCourse = { id: number; code: string; title: string; isActive: boolean; enrolled: number }

export type LecturerOverview = {
    courses: LecturerCourse[]
    stats: { courses: number; students: number; toGrade: number; attendanceWeekPct: number | null }
}

export type StudentStatus = 'at_risk' | 'not_graded' | 'on_track'
export type Mark = 'present' | 'absent'

export type StudentRow = {
    studentId: number
    name: string
    regNumber: string
    attendancePct: number | null
    sessions: number
    today: Mark | null // the mark saved for the chosen date
    score: number | null // the score for the chosen assignment
    status: StudentStatus
}

export type StudentsReply = {
    course: { id: number; code: string; title: string }
    date: string
    students: StudentRow[]
}

export type AssignmentRow = {
    id: number
    title: string
    description: string | null
    dueDate: string // a date and time
    maxScore: number
    graded: number
    enrolled: number
}

export type AssignmentInput = { title: string; description: string; dueDate: string; maxScore: number }

export type AnnouncementRow = {
    id: number
    title: string
    body: string
    createdAt: string
    author: string
    mine: boolean
}

// ---------- dates (Tanzania is UTC+3 all year) ----------
const TZ_MS = 3 * 60 * 60 * 1000
export const todayTZ = () => new Date(Date.now() + TZ_MS).toISOString().slice(0, 10)
export const dayTZ = (iso: string) => new Date(new Date(iso).getTime() + TZ_MS).toISOString().slice(0, 10)
export const addDaysTZ = (days: number) => new Date(Date.now() + TZ_MS + days * 86_400_000).toISOString().slice(0, 10)

// ---------- calls ----------
export const getOverview = async () => (await api.get<LecturerOverview>('/lecturer/overview')).data

export const getStudents = async (courseId: number, date: string, assignmentId?: number) =>
    (await api.get<StudentsReply>(`/lecturer/courses/${courseId}/students`, { params: { date, assignmentId } })).data

export const saveAttendance = async (courseId: number, date: string, marks: { studentId: number; status: Mark }[]) =>
    (await api.put<{ saved: number }>(`/lecturer/courses/${courseId}/attendance`, { date, marks })).data.saved

export const listAssignments = async (courseId: number) =>
    (await api.get<{ assignments: AssignmentRow[] }>(`/lecturer/courses/${courseId}/assignments`)).data.assignments

export const createAssignment = async (courseId: number, data: AssignmentInput) => {
    await api.post(`/lecturer/courses/${courseId}/assignments`, data)
}

export const updateAssignment = async (id: number, data: AssignmentInput) => {
    await api.patch(`/lecturer/assignments/${id}`, data)
}

export const deleteAssignment = async (id: number) => {
    await api.delete(`/lecturer/assignments/${id}`)
}

export const saveScores = async (assignmentId: number, scores: { studentId: number; score: number | null }[]) =>
    (await api.put<{ saved: number }>(`/lecturer/assignments/${assignmentId}/scores`, { scores })).data.saved

export const listAnnouncements = async (courseId: number) =>
    (await api.get<{ announcements: AnnouncementRow[] }>(`/lecturer/courses/${courseId}/announcements`)).data.announcements

export const postAnnouncement = async (courseId: number, data: { title: string; body: string }) =>
    (await api.post<{ notified: number }>(`/lecturer/courses/${courseId}/announcements`, data)).data.notified

export const deleteAnnouncement = async (id: number) => {
    await api.delete(`/lecturer/announcements/${id}`)
}
