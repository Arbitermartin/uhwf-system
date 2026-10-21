import { api } from './api'

export type CourseRow = {
    id: number
    code: string
    title: string
    description: string | null
    credits: number
    isActive: boolean
    department: { id: number; name: string }
    lecturer: { id: number; name: string; staffId: string } | null
    enrolled: number
    chosenByApplicants: number
}

export type CourseList = {
    courses: CourseRow[]
    total: number
    page: number
    pageSize: number
    counts: { all: number; active: number; inactive: number }
}

export type LecturerOption = { id: number; name: string; staffId: string; department: string }

export type CourseInput = {
    code: string
    title: string
    description: string
    credits: number
    departmentId: number
    lecturerId: number | null
    isActive: boolean
}

export type CourseListParams = {
    search?: string
    departmentId?: number
    status?: 'active' | 'inactive'
    page: number
    pageSize: number
}

export const listCourses = async (params: CourseListParams) =>
    (await api.get<CourseList>('/admin/courses', { params })).data

export const listLecturerOptions = async () =>
    (await api.get<{ lecturers: LecturerOption[] }>('/admin/courses/lecturers')).data.lecturers

export const createCourse = async (data: CourseInput) =>
    (await api.post<{ course: CourseRow }>('/admin/courses', data)).data.course

export const updateCourse = async (id: number, data: CourseInput) =>
    (await api.patch<{ course: CourseRow }>(`/admin/courses/${id}`, data)).data.course

export const deleteCourse = async (id: number) => {
    await api.delete(`/admin/courses/${id}`)
}
