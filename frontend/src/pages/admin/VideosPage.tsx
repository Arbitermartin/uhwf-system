import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaEdit, FaPlus, FaTrashAlt, FaVideoSlash } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../services/api'
import {
    VIDEO_CATEGORIES,
    createVideo,
    deleteVideo,
    extractYoutubeId,
    listAdminVideos,
    updateVideo,
} from '../../services/videos'
import type { AdminVideo, VideoInput } from '../../services/videos'
import Pager from '../../components/pager'
import ModalShell from './users/ModalShell'

type Errors = Partial<Record<keyof VideoInput, string>>

const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'
const thumb = (id: string) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`

const emptyForm: VideoInput = { link: '', title: '', description: '', category: '', duration: '', date: '', featured: false }

const VideoFormModal = ({
    video,
    onClose,
    onSaved,
}: {
    video: AdminVideo | null
    onClose: () => void
    onSaved: (message: string) => void
}) => {
    const [form, setForm] = useState<VideoInput>(
        video
            ? {
                link: `https://www.youtube.com/watch?v=${video.youtubeId}`,
                title: video.title,
                description: video.description,
                category: video.category,
                duration: video.duration,
                date: video.date,
                featured: video.featured,
            }
            : emptyForm,
    )
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)

    const ytId = extractYoutubeId(form.link)

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        const next = e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : value
        setForm((prev) => ({ ...prev, [name]: next }))
        if (errors[name as keyof VideoInput]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const save = async () => {
        const found: Errors = {}
        if (!form.link.trim()) found.link = 'Paste the YouTube link.'
        else if (!ytId) found.link = 'This is not a valid YouTube link.'
        if (form.title.trim().length < 3) found.title = 'Enter a title (at least 3 characters).'
        if (!form.category) found.category = 'Choose a category.'
        if (form.duration.trim() && !/^((\d{1,2}:)?[0-5]?\d:[0-5]\d)?$/.test(form.duration.trim())) {
            found.duration = 'Use the format 5:42 or 1:05:30.'
        }
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        const data: VideoInput = {
            ...form,
            link: form.link.trim(),
            title: form.title.trim(),
            description: form.description.trim(),
            duration: form.duration.trim(),
        }
        try {
            if (video) await updateVideo(video.id, data)
            else await createVideo(data)
            onSaved(video ? 'Video updated.' : 'Video added. It is on the website now.')
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not save the video.'))
            setSaving(false)
        }
    }

    const cls = (k: keyof VideoInput) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <ModalShell title={video ? 'Edit video' : 'Add video'} onClose={onClose} wide>
            <div className="space-y-4">
                {serverError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}

                <div>
                    <label htmlFor="link" className="mb-1 block text-xs font-medium text-gray-600">YouTube link</label>
                    <input id="link" name="link" value={form.link} onChange={change} maxLength={300}
                        placeholder="https://www.youtube.com/watch?v=..." className={cls('link')} />
                    {errors.link && <p className="mt-1 text-xs text-red-600">{errors.link}</p>}
                    <div className="mt-2 flex items-center gap-3">
                        {ytId ? (
                            <img src={thumb(ytId)} alt="" className="h-16 w-28 rounded-md border border-gray-200 object-cover" />
                        ) : (
                            <span className="flex h-16 w-28 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                                <FaVideoSlash className="h-5 w-5" />
                            </span>
                        )}
                        <p className="text-xs text-gray-500">
                            {ytId
                                ? 'This is the picture visitors will see. Check that it is the right video.'
                                : 'Paste a link from YouTube. The video must be public or unlisted, and embedding must be allowed.'}
                        </p>
                    </div>
                </div>

                <div>
                    <label htmlFor="title" className="mb-1 block text-xs font-medium text-gray-600">Title</label>
                    <input id="title" name="title" value={form.title} onChange={change} maxLength={150} className={cls('title')} />
                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </div>

                <div>
                    <label htmlFor="description" className="mb-1 block text-xs font-medium text-gray-600">Description (optional)</label>
                    <textarea id="description" name="description" rows={3} value={form.description} onChange={change} maxLength={1000}
                        className={`${cls('description')} resize-none`} />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <label htmlFor="category" className="mb-1 block text-xs font-medium text-gray-600">Category</label>
                        <select id="category" name="category" value={form.category} onChange={change} className={cls('category')}>
                            <option value="">Choose</option>
                            {VIDEO_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
                    </div>
                    <div>
                        <label htmlFor="duration" className="mb-1 block text-xs font-medium text-gray-600">Length (optional)</label>
                        <input id="duration" name="duration" value={form.duration} onChange={change} placeholder="5:42" className={cls('duration')} />
                        {errors.duration && <p className="mt-1 text-xs text-red-600">{errors.duration}</p>}
                    </div>
                    <div>
                        <label htmlFor="date" className="mb-1 block text-xs font-medium text-gray-600">Date (optional)</label>
                        <input id="date" name="date" type="date" value={form.date} onChange={change} className={cls('date')} />
                        {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
                    </div>
                </div>
                <p className="-mt-2 text-xs text-gray-500">Leave the date empty to use today. The length is shown on the picture, so type it as it is on YouTube.</p>

                <label className="flex items-start gap-3 rounded-lg bg-green-50 p-3 text-sm text-gray-700">
                    <input type="checkbox" name="featured" checked={form.featured} onChange={change} className="mt-0.5 h-4 w-4 accent-green-700" />
                    <span>
                        <span className="font-medium text-green-950">Feature this video</span>
                        <span className="block text-xs text-gray-600">It shows large at the top of the gallery. Only one video can be featured, so this replaces the current one.</span>
                    </span>
                </label>

                <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={onClose}
                        className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={() => void save()} disabled={saving}
                        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60">
                        {saving ? 'Saving...' : video ? 'Save changes' : 'Add video'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

const VideosPage = () => {
    const [q, setQ] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [videos, setVideos] = useState<AdminVideo[]>([])
    const [total, setTotal] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [note, setNote] = useState('')
    const [modal, setModal] = useState<{ video: AdminVideo | null } | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const r = await listAdminVideos({ search: search || undefined, page })
            setVideos(r.videos)
            setTotal(r.total)
            setPageSize(r.pageSize)
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load the videos.'))
        } finally {
            setLoading(false)
        }
    }, [search, page])

    useEffect(() => {
        void load()
    }, [load])

    const remove = async (v: AdminVideo) => {
        if (!window.confirm(`Delete "${v.title}" from the gallery? The video on YouTube is not deleted.`)) return
        try {
            await deleteVideo(v.id)
            setNote('Video deleted.')
            void load()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the video.'))
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">Videos</h1>
                    <p className="text-sm text-gray-500">Videos shown in the Video Gallery on the website. They are hosted on YouTube.</p>
                </div>
                <button type="button" onClick={() => setModal({ video: null })}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300">
                    <FaPlus className="h-3.5 w-3.5" /> Add video
                </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()) }} className="flex gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title"
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <button type="submit" className="rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50">Search</button>
            </form>

            {note && <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{note}</p>}
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading ? (
                    <p className="p-6 text-center text-sm text-gray-500">Loading...</p>
                ) : total === 0 ? (
                    <p className="p-6 text-center text-sm text-gray-500">No videos yet. Press Add video to publish the first one.</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {videos.map((v) => (
                            <li key={v.id} className="flex flex-wrap items-center gap-3 p-4">
                                <img src={thumb(v.youtubeId)} alt="" loading="lazy" className="h-14 w-24 rounded-md object-cover" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-green-950">{v.title}</p>
                                    <p className="truncate text-xs text-gray-500">
                                        {v.category} · {v.date}{v.duration ? ` · ${v.duration}` : ''} · added by {v.uploadedBy}
                                    </p>
                                    <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer"
                                        className="text-xs font-medium text-green-800 hover:underline">Open on YouTube</a>
                                </div>
                                {v.featured && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">Featured</span>}
                                <button type="button" aria-label={`Edit ${v.title}`} onClick={() => setModal({ video: v })} className="p-2 text-green-900 hover:text-green-600"><FaEdit /></button>
                                <button type="button" aria-label={`Delete ${v.title}`} onClick={() => void remove(v)} className="p-2 text-red-700 hover:text-red-500"><FaTrashAlt /></button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <Pager page={page} total={total} pageSize={pageSize} onChange={setPage} />

            {modal && (
                <VideoFormModal
                    video={modal.video}
                    onClose={() => setModal(null)}
                    onSaved={(m) => { setModal(null); setNote(m); void load() }}
                />
            )}
        </div>
    )
}

export default VideosPage