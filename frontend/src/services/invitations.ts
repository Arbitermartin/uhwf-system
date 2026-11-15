import { api } from './api'
import type { CreatableRole, UserDetail } from './users'

// What happened to the invitation email, told honestly so the administrator knows
// whether the person has really been told.
export type Delivery = { sent: boolean; message: string }

export type InviteInput = {
    role: CreatableRole
    fullName: string
    email: string
    phone: string
    gender: '' | 'female' | 'male'
    staffId?: string
    departmentId?: number
    qualification?: string
    position?: string
}

export const inviteUser = async (data: InviteInput) =>
    (await api.post<{ user: UserDetail; invitation: Delivery }>('/invitations', data)).data

export const resendInvitation = async (userId: number) =>
    (await api.post<{ invitation: Delivery }>(`/invitations/${userId}/resend`)).data.invitation
