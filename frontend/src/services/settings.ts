import { api } from './api'

export type AdmissionState = 'open' | 'upcoming' | 'closed'

export type AdmissionSettings = {
    enabled: boolean
    intake: string
    opensOn: string // yyyy-mm-dd
    closesOn: string // yyyy-mm-dd
    fee: number
    maxCourses: number
    status: AdmissionState
}

export type AdmissionUpdate = Omit<AdmissionSettings, 'status'>

export const getAdmissionSettings = async () =>
    (await api.get<{ settings: AdmissionSettings }>('/admin/settings')).data.settings

export const saveAdmissionSettings = async (data: AdmissionUpdate) =>
    (await api.put<{ settings: AdmissionSettings }>('/admin/settings', data)).data.settings

export type DepartmentRow = {
    id: number
    name: string
    courses: number
    lecturers: number
    employees: number
}

export const listDepartmentRows = async () =>
    (await api.get<{ departments: DepartmentRow[] }>('/departments')).data.departments

export const createDepartment = async (name: string) =>
    (await api.post<{ department: DepartmentRow }>('/departments', { name })).data.department

export const renameDepartment = async (id: number, name: string) =>
    (await api.patch<{ department: DepartmentRow }>(`/departments/${id}`, { name })).data.department

export const removeDepartment = async (id: number) => {
    await api.delete(`/departments/${id}`)
}
