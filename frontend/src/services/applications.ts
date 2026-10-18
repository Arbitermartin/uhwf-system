import { api } from './api'
import type { ApplicationStatus, DocKey } from '../context/application-context'

export type PayState = 'none' | 'pending' | 'paid'

export type AppRow = {
    id: number
    intake: string
    status: ApplicationStatus
    submittedAt: string | null
    reviewedAt: string | null
    student: { name: string; email: string; phone: string | null }
    paymentStatus: PayState
    courseCount: number
    documentCount: number
}

export type AppList = {
    applications: AppRow[]
    total: number
    page: number
    pageSize: number
    counts: Record<ApplicationStatus | 'all', number>
}

export type AppDetail = {
    id: number
    intake: string
    status: ApplicationStatus
    submittedAt: string | null
    reviewedAt: string | null
    reviewedBy: string | null
    reviewNote: string | null
    regNumber: string | null
    student: { id: number; name: string; email: string; phone: string | null; gender: 'female' | 'male' | null }
    personal: {
        dob: string | null
        nationality: string | null
        region: string | null
        kinName: string | null
        kinPhone: string | null
    }
    payments: {
        id: number
        amount: number
        method: string
        status: 'pending' | 'paid' | 'failed'
        reference: string | null
        paidAt: string | null
        createdAt: string
    }[]
    courses: { code: string; title: string; credits: number }[]
    documents: { type: DocKey; fileName: string; uploadedAt: string }[]
}

export type AppListParams = {
    status?: ApplicationStatus
    search?: string
    page: number
    pageSize: number
}

export const listApplications = async (params: AppListParams) =>
    (await api.get<AppList>('/applications', { params })).data

export const getApplication = async (id: number) =>
    (await api.get<{ application: AppDetail }>(`/applications/${id}`)).data.application

export const confirmPayment = async (id: number) =>
    (await api.post<{ application: AppDetail }>(`/applications/${id}/payment/confirm`)).data.application

export const approveApplication = async (id: number) =>
    (await api.post<{ application: AppDetail }>(`/applications/${id}/approve`)).data.application

export const rejectApplication = async (id: number, note: string) =>
    (await api.post<{ application: AppDetail }>(`/applications/${id}/reject`, { note })).data.application

// Opens in a new tab. The browser sends the login cookie, so only an administrator can open it.
export const documentUrl = (id: number, type: DocKey) => `/api/applications/${id}/documents/${type}/file`
