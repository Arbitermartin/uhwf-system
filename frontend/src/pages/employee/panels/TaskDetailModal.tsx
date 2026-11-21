import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaDownload, FaPaperclip } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import {
    WORK_MAX_BYTES,
    dateOnly,
    dayShort,
    getMyTask,
    myTaskFileLink,
    priorityLabel,
    priorityTag,
    startMyTask,
    submitTaskWork,
    taskStatusLabel,
    taskStatusTag,
} from '../../../services/staff'
import type { MyTaskDetail } from '../../../services/staff'
import ModalShell from '../../admin/users/ModalShell'

const decisionTag = { accepted: 'bg-green-100 text-green-800', returned: 'bg-amber-100 text-amber-900' } as const
const decisionLabel = { accepted: 'Accepted', returned: 'Returned for changes' } as const

const isAllowed = (file: File) => {
    const name = file.name.toLowerCase()
    return name.endsWith('.pdf') || name.endsWith('.docx')
}

// One task for the employee: what was asked, what the administrator said, and the place to hand in the work.
const TaskDetailModal = ({ taskId, onClose, onChanged }: { taskId: number; onClose: () => void; onChanged: () => void }) => {
    const [detail, setDetail] = useState<MyTaskDetail | null>(null)
    const [loadError, setLoadError] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [note, setNote] = useState('')
    const [fileError, setFileError] = useState('')
    const [error, setError] = useState('')
    const [done, setDone] = useState('')
    const [busy, setBusy] = useState(false)

    const load = useCallback(async () => {
        try {
            setDetail(await getMyTask(taskId))
            setLoadError('')
        } catch (err) {
            setLoadError(getErrorMessage(err, 'Could not load this task.'))
        }
    }, [taskId])

    useEffect(() => {
        void load()
    }, [load])

    const choose = (e: ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0] ?? null
        e.target.value = ''
        if (!picked) return
        // Quick checks here. The server checks the real file again.
        if (!isAllowed(picked)) {
            setFile(null)
            return setFileError('Choose a Word (.docx) or PDF file. In Word, an old .doc file can be saved as .docx.')
        }
        if (picked.size > WORK_MAX_BYTES) {
            setFile(null)
            return setFileError('The file is larger than 10 MB.')
        }
        setFile(picked)
        setFileError('')
        setError('')
    }

    const handIn = async () => {
        if (!file) return setFileError('Choose your file first.')
        setBusy(true)
        setError('')
        setDone('')
        try {
            await submitTaskWork(taskId, file, note)
            setFile(null)
            setNote('')
            setDone('Your work was handed in. The administrator was notified and will answer here.')
            await load()
            onChanged()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not hand in your work. Please try again.'))
        } finally {
            setBusy(false)
        }
    }

    const start = async () => {
        setBusy(true)
        setError('')
        try {
            await startMyTask(taskId)
            await load()
            onChanged()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not start the task.'))
        } finally {
            setBusy(false)
        }
    }

    const t = detail?.task

    return (
        <ModalShell title={t ? t.title : 'Task'} subtitle={t ? `From ${t.from} · due ${dayShort(t.dueDate)}` : undefined} onClose={onClose} wide>
            {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
            {!detail && !loadError && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}

            {detail && t && (
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${taskStatusTag[t.status]}`}>{taskStatusLabel[t.status]}</span>
                        <span className={`rounded px-2.5 py-0.5 text-xs font-semibold ${priorityTag[t.priority]}`}>{priorityLabel[t.priority]} priority</span>
                        {t.overdue && <span className="text-sm font-semibold text-red-700">Overdue</span>}
                        {t.status === 'todo' && (
                            <button
                                type="button"
                                onClick={() => void start()}
                                disabled={busy}
                                className="ml-auto rounded-lg border border-green-900 px-4 py-1.5 text-sm font-medium text-green-900 hover:bg-green-50 disabled:opacity-60"
                            >
                                Start this task
                            </button>
                        )}
                    </div>

                    {t.status === 'returned' && (
                        <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                            The administrator returned your work. Read the comment below, make the changes, and hand it in again.
                        </p>
                    )}
                    {t.status === 'submitted' && (
                        <p role="status" className="rounded-lg bg-purple-50 p-3 text-sm text-purple-900">
                            Your work is waiting for the administrator. You can still hand in a newer version.
                        </p>
                    )}
                    {t.status === 'done' && (
                        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                            This task was accepted. Well done.
                        </p>
                    )}

                    {detail.comments.length > 0 && (
                        <section>
                            <h3 className="mb-2 text-sm font-semibold text-green-900">What the administrator said</h3>
                            <ul className="space-y-2">
                                {detail.comments.map((c) => (
                                    <li key={c.id} className="rounded-lg border border-gray-200 bg-white p-3">
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                            <span className="font-semibold text-green-950">{c.author}</span>
                                            {c.decision && <span className={`rounded-full px-2 py-0.5 font-semibold ${decisionTag[c.decision]}`}>{decisionLabel[c.decision]}</span>}
                                            <span className="ml-auto">{dateOnly(c.createdAt)}</span>
                                        </div>
                                        <p className="mt-1.5 whitespace-pre-line text-sm text-gray-800">{c.body}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {detail.submissions.length > 0 && (
                        <section>
                            <h3 className="mb-2 text-sm font-semibold text-green-900">Work you handed in</h3>
                            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                                {detail.submissions.map((f, i) => (
                                    <li key={f.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                                        <div className="min-w-0 flex-1">
                                            <p className="break-all font-medium text-green-950">
                                                {f.fileName} {i === 0 && <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-800">Latest</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {dateOnly(f.createdAt)}
                                                {f.note ? ` · ${f.note}` : ''}
                                            </p>
                                        </div>
                                        <a
                                            href={myTaskFileLink(t.id, f.id)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-1.5 text-sm font-medium text-green-900 hover:bg-green-50"
                                        >
                                            <FaDownload className="h-3.5 w-3.5" /> Download
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {t.canSubmit && (
                        <section className="rounded-xl border border-gray-200 bg-green-50/50 p-4">
                            <h3 className="text-sm font-semibold text-green-950">{detail.submissions.length > 0 ? 'Hand in a new version' : 'Hand in your work'}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">A Word (.docx) or PDF file, up to 10 MB. An old .doc file must be saved as .docx first.</p>

                            <label
                                className={`mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed bg-white px-4 py-3 text-sm hover:bg-green-50 ${fileError ? 'border-red-400' : 'border-green-300'
                                    }`}
                            >
                                <span className="flex min-w-0 items-center gap-2 text-gray-700">
                                    <FaPaperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                    <span className="truncate">{file ? file.name : 'Choose a file'}</span>
                                </span>
                                <span className="shrink-0 font-medium text-green-800">{file ? 'Change' : 'Browse'}</span>
                                <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={choose} />
                            </label>
                            {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}

                            <label htmlFor="work-note" className="mb-1 mt-3 block text-xs font-medium text-gray-600">
                                Note for the administrator (optional)
                            </label>
                            <textarea
                                id="work-note"
                                rows={2}
                                maxLength={1000}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                            />

                            {error && (
                                <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {error}
                                </p>
                            )}
                            {done && (
                                <p role="status" className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                                    {done}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => void handIn()}
                                disabled={busy}
                                className="mt-3 rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                            >
                                {busy ? 'Handing in...' : detail.submissions.length > 0 ? 'Hand in again' : 'Hand in work'}
                            </button>
                        </section>
                    )}
                </div>
            )}
        </ModalShell>
    )
}

export default TaskDetailModal
