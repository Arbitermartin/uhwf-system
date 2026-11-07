import path from 'node:path'

// Rules for the website content (news and events). Nothing here touches the database.

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000 // Tanzania: UTC+3, no daylight saving

// A short preview of an article for the cards: one line, cut at 160 characters
export const makeExcerpt = (content: string, max = 160) => {
    const flat = content.replace(/\s+/g, ' ').trim()
    return flat.length > max ? `${flat.slice(0, max).trimEnd()}...` : flat
}

// The first moment of today in Tanzania, as a real point in time
export const startOfTodayTz = (now: Date = new Date()) => {
    const local = new Date(now.getTime() + TZ_OFFSET_MS)
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - TZ_OFFSET_MS)
}

export const isRealDay = (v: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
    const d = new Date(`${v}T00:00:00Z`)
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

export const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

// "2026-11-20" and "14:30" (or "" for an all-day event) become one moment in Tanzania time
export const eventDateFrom = (date: string, time: string) => new Date(`${date}T${time || '00:00'}:00+03:00`)

// The other way round. A time of 00:00 means "all day".
export const splitEventDate = (d: Date) => {
    const local = new Date(d.getTime() + TZ_OFFSET_MS).toISOString()
    return { date: local.slice(0, 10), time: local.slice(11, 16) }
}

// An article is visible to the public once it has a publish time that has arrived
export const isPublished = (publishedAt: Date | null, now: Date = new Date()) =>
    publishedAt !== null && publishedAt <= now

// The link to a news picture. The ?v= part changes when the picture is replaced,
// so browsers never keep showing an old picture.
export const newsImageUrl = (id: number, storedPath: string | null, scope: 'public' | 'admin') =>
    storedPath ? `/api/${scope === 'public' ? 'public/news' : 'admin/news'}/${id}/image?v=${encodeURIComponent(path.basename(storedPath))}` : null
