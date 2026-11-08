import { api } from './api'
import type { Role } from '../context/auth-context'

export type AccountStatus = 'active' | 'suspended' | 'pending'

export type AccountRow = {
    id: number
    name: string
    email: string
    role: Role
    status: AccountStatus
    lastLoginAt: string | null
    createdAt: string
    mustChangePassword: boolean
    failedLogins24h: number
    manageable: boolean // false: shown for support, but ICT cannot act on it
}

export type AccountList = {
    accounts: AccountRow[]
    total: number
    page: number
    pageSize: number
    counts: Record<AccountStatus | 'all', number>
}

export type AccountDetail = AccountRow & { phone: string | null; reference: string | null }

export type ActivityEntry = { id: number; level: 'error' | 'warning' | 'info'; message: string; createdAt: string }

export const listAccounts = async (params: {
    search?: string
    role?: Role
    status?: AccountStatus
    page: number
    pageSize: number
}) => (await api.get<AccountList>('/ict/accounts', { params })).data

export const getAccount = async (id: number) =>
    (await api.get<{ account: AccountDetail; activity: ActivityEntry[] }>(`/ict/accounts/${id}`)).data

export const resetAccountPassword = async (id: number) =>
    (await api.post<{ temporaryPassword: string }>(`/ict/accounts/${id}/reset-password`)).data.temporaryPassword

export const signAccountOut = async (id: number) =>
    (await api.post<{ message: string }>(`/ict/accounts/${id}/sign-out`)).data.message

export const setAccountStatus = async (id: number, status: 'active' | 'suspended') => {
    await api.post(`/ict/accounts/${id}/status`, { status })
}
