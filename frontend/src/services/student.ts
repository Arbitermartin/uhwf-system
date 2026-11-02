import { api } from './api'
import type { Slot } from './timetable'

export type AttendanceSummary = { present: number; absent: number; pct: number | null }

export type MyCourse = {
    id: number
    code: string
    title: string
    credits: number
    department: string
    lecturer: string | null
    attendance: AttendanceSummary
    assignments: { total: number; graded: number }
    averagePct: number | null
}

export type ResultAssignment = {
    id: number
    title: string
    dueDate: string
    maxScore: number
    score: number | null
    pct: number | null
}

export type CourseDetail = {
    course: {
        id: number
        code: string
        title: string
        credits: number
        description: string | null
        department: string
        lecturer: string | null
    }
    attendance: AttendanceSummary
    sessions: { date: string; status: 'present' | 'absent' }[]
    assignments: ResultAssignment[]
    announcements: { id: number; title: string; body: string; createdAt: string; author: string }[]
}

export type CourseResult = {
    courseId: number
    code: string
    title: string
    assignments: ResultAssignment[]
    averagePct: number | null
    graded: number
    total: number
    attendancePct: number | null
}

export type Results = {
    courses: CourseResult[]
    overall: { averagePct: number | null; attendancePct: number | null; graded: number; total: number }
}

export type StudentHomeData = {
    stats: { courses: number; credits: number; attendancePct: number | null; averagePct: number | null }
    today: Slot[]
    announcements: { id: number; title: string; body: string; createdAt: string; course: string; author: string }[]
}

export const listMyCourses = async () => (await api.get<{ courses: MyCourse[] }>('/student/courses')).data.courses
export const getCourseDetail = async (id: number) => (await api.get<CourseDetail>(`/student/courses/${id}`)).data
export const getResults = async () => (await api.get<Results>('/student/results')).data
export const getMyTimetable = async () => (await api.get<{ slots: Slot[] }>('/student/timetable')).data.slots
export const getStudentHome = async () => (await api.get<StudentHomeData>('/student/home')).data
