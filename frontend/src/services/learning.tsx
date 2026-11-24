import { api } from './api'

export type CourseRef = { id: number; code: string; title: string }

export type NoteCard = {
    id: number
    title: string
    excerpt: string
    course: CourseRef | null // null = a general note, for everybody
    author: string
    authorRole: string
    attachment: { name: string; inlineViewable: boolean } | null
    createdAt: string
    updatedAt: string
    manageable: boolean
}

export type NoteDetail = NoteCard & { body: string; courseId: number | null }

export type NoteMeta = {
    canWrite: boolean
    canPostGeneral: boolean
    postableCourses: CourseRef[]
    filterCourses: CourseRef[]
}

export const getNoteMeta = async () => (await api.get<NoteMeta>('/learning/meta')).data

export const listNotes = async (params: { course?: string; search?: string; page: number; pageSize: number }) =>
    (await api.get<{ notes: NoteCard[]; total: number; page: number; pageSize: number }>('/learning', { params })).data

export const getNote = async (id: number) => (await api.get<{ note: NoteDetail }>(`/learning/${id}`)).data.note

export const createNote = async (data: { courseId: number | null; title: string; body: string }) =>
    (await api.post<{ note: NoteDetail }>('/learning', data)).data.note

export const updateNote = async (id: number, data: { courseId: number | null; title: string; body: string }) =>
    (await api.patch<{ note: NoteDetail }>(`/learning/${id}`, data)).data.note

export const deleteNote = async (id: number) => {
    await api.delete(`/learning/${id}`)
}

export const uploadNoteFile = async (id: number, file: File) => {
    const body = new FormData()
    body.append('file', file)
    return (await api.post<{ note: NoteDetail }>(`/learning/${id}/attachment`, body, { timeout: 120_000 })).data.note
}

export const removeNoteFile = async (id: number) => (await api.delete<{ note: NoteDetail }>(`/learning/${id}/attachment`)).data.note

// Normal links: the browser opens or downloads the file, and the login cookie proves who is asking.
export const noteFileLink = (id: number, inline = false) => `/api/learning/${id}/attachment${inline ? '?inline=1' : ''}`

export const NOTE_FILE_MAX = 10 * 1024 * 1024
