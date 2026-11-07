import { api } from './api'

/* ============================ Admin ============================ */

export type NewsRow = {
    id: number
    title: string
    excerpt: string
    published: boolean
    publishedAt: string | null
    createdAt: string
    author: string
    image: string | null // a link, or null when the article has no picture
}

export type NewsFull = NewsRow & { content: string }

export type NewsList = {
    news: NewsRow[]
    total: number
    page: number
    pageSize: number
    counts: { all: number; published: number; draft: number }
}

export type NewsInput = { title: string; content: string; publish: boolean }

export type EventRow = {
    id: number
    title: string
    location: string
    description: string | null
    eventDate: string
    date: string // yyyy-mm-dd, Tanzania time
    time: string // HH:MM, Tanzania time. 00:00 means all day
    upcoming: boolean
}

export type EventList = {
    events: EventRow[]
    total: number
    page: number
    pageSize: number
    counts: { all: number; upcoming: number; past: number }
}

export type EventInput = { title: string; location: string; description: string; date: string; time: string }

export const listNews = async (params: { status?: 'published' | 'draft'; search?: string; page: number; pageSize: number }) =>
    (await api.get<NewsList>('/admin/news', { params })).data

export const getNews = async (id: number) => (await api.get<{ news: NewsFull }>(`/admin/news/${id}`)).data.news

export const createNews = async (data: NewsInput) => (await api.post<{ news: NewsFull }>('/admin/news', data)).data.news

export const updateNews = async (id: number, data: NewsInput) =>
    (await api.patch<{ news: NewsFull }>(`/admin/news/${id}`, data)).data.news

export const deleteNews = async (id: number) => {
    await api.delete(`/admin/news/${id}`)
}

export const uploadNewsImage = async (id: number, file: File) => {
    const body = new FormData()
    body.append('file', file)
    return (await api.post<{ news: NewsFull }>(`/admin/news/${id}/image`, body)).data.news
}

export const removeNewsImage = async (id: number) =>
    (await api.delete<{ news: NewsFull }>(`/admin/news/${id}/image`)).data.news

export const listEvents = async (params: { scope?: 'upcoming' | 'past'; search?: string; page: number; pageSize: number }) =>
    (await api.get<EventList>('/admin/events', { params })).data

export const createEvent = async (data: EventInput) =>
    (await api.post<{ event: EventRow }>('/admin/events', data)).data.event

export const updateEvent = async (id: number, data: EventInput) =>
    (await api.patch<{ event: EventRow }>(`/admin/events/${id}`, data)).data.event

export const deleteEvent = async (id: number) => {
    await api.delete(`/admin/events/${id}`)
}

/* ============================ Public ============================ */

export type PublicNews = { id: number; title: string; excerpt: string; publishedAt: string | null; image: string | null }
export type PublicNewsFull = PublicNews & { content: string }
export type PublicEvent = {
    id: number
    title: string
    location: string
    description: string | null
    eventDate: string
    date: string
    time: string
}

export const getPublicHome = async () => (await api.get<{ news: PublicNews[]; events: PublicEvent[] }>('/public/home')).data

export const listPublicNews = async (page: number) =>
    (await api.get<{ news: PublicNews[]; total: number; page: number; pageSize: number }>('/public/news', { params: { page } })).data

export const getPublicNews = async (id: number) =>
    (await api.get<{ news: PublicNewsFull }>(`/public/news/${id}`)).data.news

export const listPublicEvents = async (scope: 'upcoming' | 'past', page: number) =>
    (await api.get<{ events: PublicEvent[]; total: number; page: number; pageSize: number }>('/public/events', { params: { scope, page } })).data

/* ============================ Dates ============================ */

// Tanzania time, whatever the visitor's own time zone is
export const longDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Dar_es_Salaam' })

export const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Dar_es_Salaam' })

// the pieces for a calendar badge: "20" and "NOV"
export const badgeParts = (date: string) => {
    const d = new Date(`${date}T12:00:00`)
    return { day: String(d.getDate()), month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase() }
}

export const eventWhen = (e: { date: string; time: string }) => {
    const d = new Date(`${e.date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    return e.time === '00:00' ? d : `${d}, ${e.time}`
}
