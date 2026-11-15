import { api } from './api'
import type { Role } from '../context/auth-context'

export type IdeaStatus = 'submitted' | 'under_review' | 'needs_info' | 'approved' | 'not_selected'
export type Recommendation = 'support' | 'needs_work' | 'not_now'

export const ideaCategories = ['Conservation', 'Community', 'Technology', 'Education', 'Operations', 'Other'] as const

export type IdeaListItem = {
    id: number
    title: string
    category: string
    status: IdeaStatus
    createdAt: string
    author: { name: string; role: Role }
    mine: boolean
    feedbackCount: number
}

export type IdeaList = {
    ideas: IdeaListItem[]
    total: number
    page: number
    pageSize: number
    counts: { all: number; submitted: number; under_review: number; needs_info: number; decided: number }
}

export type FeedbackItem = {
    id: number
    kind: 'review' | 'reply'
    role: Role
    name: string | null // reviewers see names. The author sees only the role of each reviewer.
    comment: string
    recommendation: Recommendation | null
    impact: number | null
    feasibility: number | null
    effort: number | null
    createdAt: string
}

export type IdeaDetail = {
    id: number
    title: string
    category: string
    description: string
    status: IdeaStatus
    createdAt: string
    attachmentName: string | null
    author: { name: string; role: Role }
    mine: boolean
    canReview: boolean
    canReply: boolean
    canDecide: boolean
    feedback: FeedbackItem[]
}

export type FeedbackInput = {
    comment: string
    recommendation?: Recommendation
    impact?: number
    feasibility?: number
    effort?: number
}

export const listIdeas = async (params: {
    scope: 'mine' | 'review'
    status?: 'submitted' | 'under_review' | 'needs_info' | 'decided'
    search?: string
    page: number
    pageSize: number
}) => (await api.get<IdeaList>('/ideas', { params })).data

export const getIdea = async (id: number) => (await api.get<{ idea: IdeaDetail }>(`/ideas/${id}`)).data.idea

export const createIdea = async (data: { title: string; category: string; description: string }) =>
    (await api.post<{ idea: IdeaDetail }>('/ideas', data)).data.idea

export const sendFeedback = async (id: number, data: FeedbackInput) =>
    (await api.post<{ idea: IdeaDetail }>(`/ideas/${id}/feedback`, data)).data.idea

export const setIdeaStatus = async (id: number, status: Exclude<IdeaStatus, 'submitted'>) =>
    (await api.post<{ idea: IdeaDetail }>(`/ideas/${id}/status`, { status })).data.idea

export const deleteIdea = async (id: number) => {
    await api.delete(`/ideas/${id}`)
}

export const uploadAttachment = async (id: number, file: File) => {
    const body = new FormData()
    body.append('file', file)
    return (await api.post<{ idea: IdeaDetail }>(`/ideas/${id}/attachment`, body, { timeout: 60_000 })).data.idea
}

export const removeAttachment = async (id: number) =>
    (await api.delete<{ idea: IdeaDetail }>(`/ideas/${id}/attachment`)).data.idea

// A normal link: the browser downloads the file, and the login cookie proves who is asking.
export const attachmentLink = (id: number) => `/api/ideas/${id}/attachment`
