import { api } from './api'

export type VideoCategory = 'Conservation' | 'Community' | 'Research' | 'Events'
export const VIDEO_CATEGORIES: VideoCategory[] = ['Conservation', 'Community', 'Research', 'Events']

export type AdminVideo = {
    id: number
    title: string
    description: string
    category: VideoCategory
    youtubeId: string
    duration: string
    featured: boolean
    date: string // yyyy-mm-dd
    uploadedBy: string
}

export type VideoInput = {
    link: string
    title: string
    description: string
    category: VideoCategory | ''
    duration: string
    date: string
    featured: boolean
}

export type PublicVideo = {
    id: number
    title: string
    description: string
    category: VideoCategory
    date: string
    duration: string
    youtubeId: string
    featured: boolean
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/

// Same rules as the server, so the admin sees a preview before saving.
export const extractYoutubeId = (input: string): string | null => {
    const v = input.trim()
    if (YT_ID.test(v)) return v
    let url: URL
    try {
        url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`)
    } catch {
        return null
    }
    const host = url.hostname.replace(/^(www|m)\./, '')
    let id: string | null = null
    if (host === 'youtu.be') id = url.pathname.split('/')[1] ?? null
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        if (url.pathname === '/watch') id = url.searchParams.get('v')
        else id = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/)?.[1] ?? null
    }
    return id && YT_ID.test(id) ? id : null
}

export const listAdminVideos = async (params: { search?: string; page: number }) =>
    (await api.get<{ videos: AdminVideo[]; total: number; page: number; pageSize: number }>('/admin/videos', { params })).data

export const createVideo = async (data: VideoInput) =>
    (await api.post<{ video: AdminVideo }>('/admin/videos', data)).data.video

export const updateVideo = async (id: number, data: VideoInput) =>
    (await api.patch<{ video: AdminVideo }>(`/admin/videos/${id}`, data)).data.video

export const deleteVideo = async (id: number) => {
    await api.delete(`/admin/videos/${id}`)
}

export const listPublicVideos = async () =>
    (await api.get<{ videos: PublicVideo[] }>('/public/videos')).data.videos