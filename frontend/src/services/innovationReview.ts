import { api } from './api'

export type IdeaStatus = 'received' | 'reviewing' | 'shortlisted' | 'rejected'

export type IdeaRow = {
    id: number
    title: string
    category: string
    region: string
    stage: string
    status: IdeaStatus
    createdAt: string
    fullName: string
    reviewer: string | null
    mine: boolean
    canStart: boolean
    canDecide: boolean
    canRelease: boolean
}

export type IdeaFull = IdeaRow & {
    email: string
    phone: string | null
    description: string
    beneficiaries: string | null
    link: string | null
    reviewNote: string | null
    reviewedAt: string | null
}

export type IdeaList = {
    ideas: IdeaRow[]
    total: number
    page: number
    pageSize: number
    counts: { all: number; received: number; reviewing: number; shortlisted: number; rejected: number }
}

export const listIdeas = async (params: { status?: IdeaStatus; search?: string; page: number }) =>
    (await api.get<IdeaList>('/innovations', { params })).data

export const getIdea = async (id: number) => (await api.get<{ idea: IdeaFull }>(`/innovations/${id}`)).data.idea
export const startReview = async (id: number) => (await api.post<{ idea: IdeaFull }>(`/innovations/${id}/start`)).data.idea
export const releaseIdea = async (id: number) => (await api.post<{ idea: IdeaFull }>(`/innovations/${id}/release`)).data.idea
export const decideIdea = async (id: number, decision: 'shortlisted' | 'rejected', note: string) =>
    (await api.post<{ idea: IdeaFull }>(`/innovations/${id}/decision`, { decision, note })).data.idea