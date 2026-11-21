import { useCallback, useEffect, useRef, useState } from 'react'
import { FaThumbtack, FaTrash } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { dateOnly, deleteNotice, listAdminNotices, noticeAudiences, postNotice } from '../../../services/staff'
import type { AdminNotice } from '../../../services/staff'

const audienceLabel = (value: string) => noticeAudiences.find((a) => a.value === value)?.label ?? value

const NoticesManager = () => {
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [audience, setAudience] = useState('employee')
    const [pinned, setPinned] = useState(false)
    const [errors, setErrors] = useState<{ title?: string; body?: string }>({})
    const [serverError, setServerError] = useState('')
    const [note, setNote] = useState('')
    const [sending, setSending] = useState(false)

    const [list, setList] = useState<AdminNotice[] | null>(null)
    const [listError, setListError] = useState('')
    const [armedId, setArmedId] = useState<number | null>(null)
    const armTimer = useRef<number | undefined>(undefined)

    const load = useCallback(async () => {
        try {
            setList(await listAdminNotices())
            setListError('')
        } catch (err) {
            setListError(getErrorMessage(err, 'Could not load the notices.'))
        }
    }, [])

    useEffect(() => {
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
            const n = await postNotice({ title: title.trim(), body: body.trim(), audience, pinned })
            setTitle('')
            setBody('')
            setPinned(false)
            setNote(`Posted. ${n} ${n === 1 ? 'person was' : 'people were'} notified.`)
            await load()
        } catch (err) {
            setErrors(getFieldErrors(err))
            setServerError(getErrorMessage(err, 'Could not post the notice.'))
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
            await deleteNotice(id)
            await load()
        } catch (err) {
            setListError(getErrorMessage(err, 'Could not delete the notice.'))
        }
    }

    return (
        <div className="space-y-4">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-green-950">Post a notice</h2>
                <div className="mt-3 space-y-3">
                    {serverError && (
                        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {serverError}
                        </p>
                    )}
                    <div>
                        <input
                            value={title}
                            maxLength={100}
                            onChange={(e) => {
                                setTitle(e.target.value)
                                setErrors((p) => ({ ...p, title: undefined }))
                            }}
                            placeholder="Title"
                            aria-label="Notice title"
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
                            }}
                            placeholder="Write the notice"
                            aria-label="Notice text"
                            className={`w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 ${errors.body ? 'border-red-400' : 'border-gray-200'}`}
                        />
                        {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            For
                            <select value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm">
                                {noticeAudiences.map((a) => (
                                    <option key={a.value} value={a.value}>
                                        {a.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 accent-green-700" />
                            Pin to the top
                        </label>
                        <button
                            type="button"
                            onClick={() => void send()}
                            disabled={sending}
                            className="ml-auto rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                        >
                            {sending ? 'Posting...' : 'Post notice'}
                        </button>
                    </div>
                    {note && (
                        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                            {note}
                        </p>
                    )}
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-green-950">Recent notices</h2>
                {listError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{listError}</p>}
                <ul className="mt-2 divide-y divide-gray-100">
                    {!list && !listError && <li className="py-6 text-center text-sm text-gray-500">Loading...</li>}
                    {list && list.length === 0 && <li className="py-6 text-center text-sm text-gray-500">No notices yet.</li>}
                    {list?.map((n) => (
                        <li key={n.id} className="flex items-start gap-3 py-3">
                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-2 font-medium text-green-950">
                                    {n.pinned && <FaThumbtack className="h-3 w-3 text-amber-600" aria-label="Pinned" />}
                                    {n.title}
                                </p>
                                <p className="whitespace-pre-line text-sm text-gray-700">{n.body}</p>
                                <p className="mt-1 text-xs text-gray-500">
                                    For {audienceLabel(n.audience)} · {n.author} · {dateOnly(n.createdAt)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => void remove(n.id)}
                                aria-label={`Delete ${n.title}`}
                                className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium ${armedId === n.id ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                    }`}
                            >
                                <FaTrash className="h-3 w-3" />
                                {armedId === n.id ? 'Confirm' : ''}
                            </button>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}

export default NoticesManager
