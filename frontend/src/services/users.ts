import { api } from './api'
import type { Role } from '../context/auth-context'

export type UserStatus = 'pending' | 'active' | 'suspended'
export type Gender = 'female' | 'male'

export type UserRow = {
    id: number
    fullName: string
    email: string
    phone: string | null
    role: Role
    status: UserStatus
    createdAt: string
    lastLoginAt: string | null
}

export type Department = { id: number; name: string }

export type UserDetail = UserRow & {
    gender: Gender | null
    photoUrl: string | null
    student: {
        regNumber: string
        programme: string | null
        yearOfStudy: string | null
        admittedAt: string
    } | null
    lecturer: {
        staffId: string
        qualification: string | null
        department: Department
        courses: number
    } | null
    employee: {
        staffId: string
        position: string
        department: Department
        supervisor: string | null
    } | null
    application: { status: string; intake: string; submittedAt: string | null } | null
}

export type UserUpdate = {
    fullName: string
    email: string
    phone: string
    gender: Gender | ''
    status: UserStatus
    profile?: {
        regNumber?: string
        programme?: string
        yearOfStudy?: string
        staffId?: string
        departmentId?: number
        qualification?: string
        position?: string
    }
}

export type ListParams = {
    search?: string
    role?: Role
    status?: UserStatus
    page: number
    pageSize: number
}

export type UserList = {
    users: UserRow[]
    total: number
    page: number
    pageSize: number
    counts: Record<Role | 'all', number>
}

export const listUsers = async (params: ListParams) =>
    (await api.get<UserList>('/users', { params })).data

export const getUser = async (id: number) =>
    (await api.get<{ user: UserDetail }>(`/users/${id}`)).data.user

export const updateUser = async (id: number, data: UserUpdate) =>
    (await api.patch<{ user: UserDetail }>(`/users/${id}`, data)).data.user

export const deleteUser = async (id: number) => {
    await api.delete(`/users/${id}`)
}

export const listDepartments = async () =>
    (await api.get<{ departments: Department[] }>('/departments')).data.departments

// NEW CHANGES 2026

export type CreatableRole = 'lecturer' | 'employee' | 'ict' | 'admin'

export type UserCreate = {
    role: CreatableRole
    fullName: string
    email: string
    phone: string
    gender: Gender | ''
    password: string
    staffId?: string
    departmentId?: number
    qualification?: string
    position?: string
}

export const createUser = async (data: UserCreate) =>
    (await api.post<{ user: UserDetail }>('/users', data)).data.user

// The server makes a new temporary password and returns it once.
export const resetPassword = async (id: number) =>
    (await api.post<{ temporaryPassword: string }>(`/users/${id}/reset-password`)).data.temporaryPassword