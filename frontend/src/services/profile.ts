import { api } from './api'
import type { Role, User } from '../context/auth-context'

export type Profile = {
    id: number
    fullName: string
    email: string
    phone: string | null
    gender: 'female' | 'male' | null
    role: Role
    status: 'pending' | 'active' | 'suspended'
    photo: string | undefined
    createdAt: string
    lastLoginAt: string | null
    student: { regNumber: string; programme: string | null; yearOfStudy: string | null; admittedAt: string } | null
    lecturer: { staffId: string; qualification: string | null; department: string } | null
    employee: { staffId: string; position: string; department: string; supervisor: string | null } | null
}

// Every call returns the profile and the updated "signed-in user", so the sidebar and top bar can refresh.
type Reply = { profile: Profile; user: User }

export const getProfile = async () => (await api.get<Reply>('/profile')).data

export const saveProfile = async (data: { fullName: string; phone: string; gender: '' | 'female' | 'male' }) =>
    (await api.patch<Reply>('/profile', data)).data

export const uploadPhoto = async (file: File) => {
    const body = new FormData()
    body.append('file', file)
    return (await api.post<Reply>('/profile/photo', body)).data
}

export const removePhoto = async () => (await api.delete<Reply>('/profile/photo')).data
