import { api } from './api'

export type EnrollmentStatus = 'active' | 'dropped' | 'completed'

export type EnrollmentRow = {
    id: number
    status: EnrollmentStatus
    enrolledAt: string
    course: { id: number; code: string; title: string }
    student: { id: number; name: string; regNumber: string }
}

export type CourseFilter = { id: number; code: string; title: string; active: number }

export type EnrollmentList = {
    enrollments: EnrollmentRow[]
    total: number
    page: number
    pageSize: number
    counts: Record<EnrollmentStatus | 'all', number>
    courses: CourseFilter[]
}

export type StudentOption = { id: number; name: string; regNumber: string }

export const listEnrollments = async (params: {
    courseId?: number
    status?: EnrollmentStatus
    search?: string
    page: number
    pageSize: number
}) => (await api.get<EnrollmentList>('/admin/enrollments', { params })).data

export const findStudents = async (search: string) =>
    (await api.get<{ students: StudentOption[] }>('/admin/enrollments/students', { params: { search } })).data.students

export const enrollStudent = async (studentId: number, courseId: number) =>
    (await api.post<{ enrollment: EnrollmentRow }>('/admin/enrollments', { studentId, courseId })).data.enrollment

export const setEnrollmentStatus = async (id: number, status: EnrollmentStatus) =>
    (await api.patch<{ enrollment: EnrollmentRow }>(`/admin/enrollments/${id}`, { status })).data.enrollment

export const removeEnrollment = async (id: number) => {
    await api.delete(`/admin/enrollments/${id}`)
}
