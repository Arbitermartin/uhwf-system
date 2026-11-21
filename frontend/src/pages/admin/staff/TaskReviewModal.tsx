import { useCallback, useEffect, useState } from 'react'
import { FaDownload } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import {
    adminTaskFileLink,
    dateOnly,
    dayShort,
    getAdminTask,
    priorityLabel,
    priorityTag,
    reviewTask,
    taskStatusLabel,
    taskStatusTag,
} from '../../../services/staff'
import type { AdminTaskDetail } from '../../../services/staff'
import ModalShell from '../users/ModalShell'

const decisionTag = { accepted: 'bg-green-100 text-green-800', returned: 'bg-amber-100 text-amber-900' } as const
const decisionLabel = { accepted: 'Accepted', returned: 'Returned for changes' } as const

// The administrator reads the work an employee handed in, answers with a comment, and accepts it or sends it back.
const TaskReviewModal = ({ taskId, onClose, onChanged }: { taskId: number; onClose: () => void; onChanged: () => void }) => {
    const [detail, setDetail] = useState<AdminTaskDetail | null>(null)
    const [loadError, setLoadError] = useState('')
    const [comment, setComment] = useState('')
    const [error, setError] = useState('')
    const [done, setDone] = useState('')
    const [busy, setBusy] = useState(false)

    const load = useCallback(async () => {
        try {
            setDetail(await getAdminTask(taskId))
            setLoadError('')
        } catch (err) {
            setLoadError(getErrorMessage(err, 'Could not load this task.'))
        }
    }, [taskId])

    useEffect(() => {
        void load()
    }, [load])

    const act = async (decision: 'accepted' | 'returned' | 'comment', message: string) => {
        setBusy(true)
        setError('')
        setDone('')
        try {
            await reviewTask(taskId, decision, comment)
            setComment('')
            setDone(message)
            await load()
            onChanged()
        } catch (err) {
            setError(getErrorMessage(err, 'That did not work. Please try again.'))
        } finally {
            setBusy(false)
        }
    }

    const t = detail?.task
    const waiting = t?.status === 'submitted'

    return (
        <ModalShell title={t ? t.title : 'Task'} subtitle={t ? `${t.employee} · due ${dayShort(t.dueDate)}` : undefined} onClose={onClose} wide>
            {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
            {!detail && !loadError && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}

            {detail && t && (
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${taskStatusTag[t.status]}`}>{taskStatusLabel[t.status]}</span>
                        <span className={`rounded px-2.5 py-0.5 text-xs font-semibold ${priorityTag[t.priority]}`}>{priorityLabel[t.priority]} priority</span>
                        {t.overdue && <span className="text-sm font-semibold text-red-700">Overdue</span>}
                        <span className="ml-auto text-xs text-gray-500">Assigned by {t.assignedBy}</span>
                    </div>

                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-green-900">Work handed in ({detail.submissions.length})</h3>
                        {detail.submissions.length === 0 ? (
                            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Nothing has been handed in yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                                {detail.submissions.map((f, i) => (
                                    <li key={f.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                                        <div className="min-w-0 flex-1">
                                            <p className="break-all font-medium text-green-950">
                                                {f.fileName} {i === 0 && <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-800">Latest</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">{dateOnly(f.createdAt)}</p>
                                            {f.note && <p className="mt-1 whitespace-pre-line rounded bg-green-50 p-2 text-xs text-gray-700">{f.note}</p>}
                                        </div>
                                        <a
                                            href={adminTaskFileLink(t.id, f.id)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-1.5 text-sm font-medium text-green-900 hover:bg-green-50"
                                        >
                                            <FaDownload className="h-3.5 w-3.5" /> Download
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {detail.comments.length > 0 && (
                        <section>
                            <h3 className="mb-2 text-sm font-semibold text-green-900">Comments</h3>
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

                    <section className="rounded-xl border border-gray-200 bg-green-50/50 p-4">
                        <h3 className="text-sm font-semibold text-green-950">Your answer</h3>
                        <label htmlFor="review-comment" className="mb-1 mt-2 block text-xs font-medium text-gray-600">
                            Comment for {t.employee}
                        </label>
                        <textarea
                            id="review-comment"
                            rows={3}
                            maxLength={1000}
                            value={comment}
                            onChange={(e) => {
                                setComment(e.target.value)
                                setError('')
                            }}
                            placeholder="What is good, and what needs to change?"
                            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">{t.employee} is notified and reads your comment on the task.</p>

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

                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={busy || t.status === 'done'}
                                onClick={() => void act('accepted', 'Accepted. The task is done and the employee was notified.')}
                                className="rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-40"
                            >
                                Accept
                            </button>
                            <button
                                type="button"
                                disabled={busy || !waiting}
                                onClick={() => void act('returned', 'Returned for changes. The employee was notified.')}
                                title={waiting ? undefined : 'Only work that was handed in can be returned'}
                                className="rounded-lg border border-amber-600 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                            >
                                Return for changes
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void act('comment', 'Comment sent.')}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                            >
                                Comment only
                            </button>
                        </div>
                        {t.status === 'done' && <p className="mt-2 text-xs text-gray-500">This task is accepted. You can still add comments.</p>}
                    </section>
                </div>
            )}
        </ModalShell>
    )
}

export default TaskReviewModal
