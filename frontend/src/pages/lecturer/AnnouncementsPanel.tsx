import { useCallback, useEffect, useRef, useState } from 'react'
import { FaTrash } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../services/api'
import { deleteAnnouncement, listAnnouncements, postAnnouncement } from '../../services/lecturer'
import type { AnnouncementRow } from '../../services/lecturer'

const AnnouncementsPanel = ({ courseId, courseCode }: { courseId: number; courseCode: string }) => {
    const [items, setItems] = useState<AnnouncementRow[] | null>(null)
    const [listError, setListError] = useState('')
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [errors, setErrors] = useState<{ title?: string; body?: string }>({})
    const [serverError, setServerError] = useState('')
    const [sending, setSending] = useState(false)
    const [note, setNote] = useState('')
    const [armedId, setArmedId] = useState<number | null>(null)
    const armTimer = useRef<number | undefined>(undefined)

    const load = useCallback(async () => {
        try {
            setItems(await listAnnouncements(courseId))
            setListError('')
        } catch (err) {
            setListError(getErrorMessage(err, 'Could not load the announcements.'))
        }
    }, [courseId])

    useEffect(() => {
        setItems(null)
        void load()
        return () => window.clearTimeout(armTimer.current)
    }, [load])

    const send = async () => {
        const found: { title?: string; body?: string } = {}
        if (title.trim().length < 3) found.title = 'Add a title (at least 3 characters).'
        if (body.trim().length < 5) found.body = 'Write at least 5 characters.'
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSending(true)
        setServerError('')
        setNote('')
        try {
            const notified = await postAnnouncement(courseId, { title: title.trim(), body: body.trim() })
            setTitle('')
            setBody('')
            setNote(`Posted. ${notified} student${notified === 1 ? ' was' : 's were'} notified.`)
            await load()
        } catch (err) {
            setErrors(getFieldErrors(err))
            setServerError(getErrorMessage(err, 'Could not post the announcement.'))
        } finally {
            setSending(false)
        }
    }

    const remove = async (id: number) => {
        if (armedId !== id) {
            setArmedId(id)
            window.clearTimeout(armTimer.current)
            armTimer.current = window.setTimeout(() => setArmedId(null), 4000)
            return
        }
        setArmedId(null)
        try {
            await deleteAnnouncement(id)
            await load()
        } catch (err) {
            setServerError(getErrorMessage(err, 'Could not delete the announcement.'))
        }
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-green-950">Announcements</h2>
            <p className="text-xs text-gray-500">Sent to every student enrolled in {courseCode}.</p>

            <div className="mt-3 space-y-2">
                <div>
                    <input
                        type="text"
                        value={title}
                        maxLength={100}
                        onChange={(e) => {
                            setTitle(e.target.value)
                            setErrors((p) => ({ ...p, title: undefined }))
                            setNote('')
                        }}
                        placeholder="Title"
                        aria-label="Announcement title"
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </div>
                <div>
                    <textarea
                        rows={3}
                        value={body}
                        maxLength={2000}
                        onChange={(e) => {
                            setBody(e.target.value)
                            setErrors((p) => ({ ...p, body: undefined }))
                            setNote('')
                        }}
                        placeholder="Write a message to the students of this course"
                        aria-label="Announcement text"
                        className={`w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 ${errors.body ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body}</p>}
                </div>
                {serverError && (
                    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}
                {note && (
                    <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                        {note}
                    </p>
                )}
                <button
                    type="button"
                    onClick={() => void send()}
                    disabled={sending}
                    className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                >
                    {sending ? 'Posting...' : 'Post to course'}
                </button>
            </div>

            {listError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{listError}</p>}
            <ul className="mt-3 divide-y divide-gray-100">
                {!items && !listError && <li className="py-3 text-sm text-gray-500">Loading...</li>}
                {items && items.length === 0 && <li className="py-3 text-sm text-gray-500">No announcements for this course yet.</li>}
                {items?.map((a) => (
                    <li key={a.id} className="py-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-green-950">{a.title}</p>
                            {a.mine && (
                                <button
                                    type="button"
                                    onClick={() => void remove(a.id)}
                                    aria-label={`Delete announcement ${a.title}`}
                                    className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${armedId === a.id ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                        }`}
                                >
                                    <FaTrash className="h-3 w-3" />
                                    {armedId === a.id ? 'Confirm' : ''}
                                </button>
                            )}
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-gray-700">{a.body}</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {a.author} · {new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    )
}

export default AnnouncementsPanel
