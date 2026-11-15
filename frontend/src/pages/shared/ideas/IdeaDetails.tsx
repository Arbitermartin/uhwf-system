import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaArrowLeft, FaCheck, FaDownload, FaPaperclip, FaTrash } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import {
    attachmentLink,
    deleteIdea,
    getIdea,
    removeAttachment,
    sendFeedback,
    setIdeaStatus,
    uploadAttachment,
} from '../../../services/ideas'
import type { IdeaDetail as Detail, IdeaStatus, Recommendation } from '../../../services/ideas'
import { roleLabel } from '../../admin/users/userLabels'
import {
    REVIEWER_ROLES,
    recLabel,
    recTag,
    reviewerRoleLabel,
    reviewerRoleTag,
    statusLabel,
    statusTag,
    stepReached,
    steps,
    when,
} from './IdeaLabels'

const FILE_MAX = 5 * 1024 * 1024

type DecisionStatus = Exclude<IdeaStatus, 'submitted'>
const decisions: { value: DecisionStatus; label: string }[] = [
    { value: 'under_review', label: 'Under review' },
    { value: 'needs_info', label: 'Needs more info' },
    { value: 'approved', label: 'Approved' },
    { value: 'not_selected', label: 'Not selected' },
]

const Slider = ({ label, value, onChange, error }: { label: string; value: number; onChange: (n: number) => void; error?: string }) => (
    <div className="mb-2">
        <div className="flex items-center gap-3">
            <span className="w-24 text-xs text-gray-600">{label}</span>
            <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={value}
                aria-label={label}
                onChange={(e) => onChange(Number(e.target.value))}
                className="flex-1 accent-green-800"
            />
            <span className="w-4 text-sm font-medium text-green-950">{value}</span>
        </div>
        {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
    </div>
)

const IdeaDetail = ({
    id,
    onBack,
    onChanged,
    onDeleted,
}: {
    id: number
    onBack: () => void
    onChanged: () => void
    onDeleted: () => void
}) => {
    const [idea, setIdea] = useState<Detail | null>(null)
    const [loadError, setLoadError] = useState('')
    const [note, setNote] = useState('')
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [busy, setBusy] = useState(false)

    // the review form
    const [rec, setRec] = useState<Recommendation | ''>('')
    const [impact, setImpact] = useState(3)
    const [feasibility, setFeasibility] = useState(3)
    const [effort, setEffort] = useState(3)
    const [comment, setComment] = useState('')
    const [decision, setDecision] = useState<DecisionStatus>('under_review')
    const [armedDelete, setArmedDelete] = useState(false)
    const armTimer = useRef<number | undefined>(undefined)

    useEffect(() => {
        let cancelled = false
        getIdea(id)
            .then((i) => {
                if (cancelled) return
                setIdea(i)
                if (i.status !== 'submitted') setDecision(i.status)
            })
            .catch((err) => {
                if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this idea.'))
            })
        return () => {
            cancelled = true
            window.clearTimeout(armTimer.current)
        }
    }, [id])

    // Runs one action. On success the idea on screen is replaced by the answer of the server.
    const run = async (action: () => Promise<Detail>, success: string, after?: () => void) => {
        setBusy(true)
        setError('')
        setFieldErrors({})
        setNote('')
        try {
            const updated = await action()
            setIdea(updated)
            if (updated.status !== 'submitted') setDecision(updated.status)
            setNote(success)
            after?.()
            onChanged()
        } catch (err) {
            setFieldErrors(getFieldErrors(err))
            setError(getErrorMessage(err, 'That did not work. Please try again.'))
        } finally {
            setBusy(false)
        }
    }

    const sendReview = () => {
        if (!idea) return
        void run(
            () =>
                sendFeedback(idea.id, {
                    comment: comment.trim(),
                    recommendation: rec || undefined,
                    impact,
                    feasibility,
                    effort,
                }),
            'Feedback sent. The person who shared the idea can see it now.',
            () => {
                setComment('')
                setRec('')
                setImpact(3)
                setFeasibility(3)
                setEffort(3)
            },
        )
    }

    const sendReply = () => {
        if (!idea) return
        void run(() => sendFeedback(idea.id, { comment: comment.trim() }), 'Your reply was sent to the reviewers.', () => setComment(''))
    }

    const attach = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file || !idea) return
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) return setError('Attach a PDF, JPG or PNG file.')
        if (file.size > FILE_MAX) return setError('The file is larger than 5 MB.')
        void run(() => uploadAttachment(idea.id, file), 'The file was attached.')
    }

    const remove = async () => {
        if (!idea) return
        if (!armedDelete) {
            setArmedDelete(true)
            window.clearTimeout(armTimer.current)
            armTimer.current = window.setTimeout(() => setArmedDelete(false), 4000)
            return
        }
        setBusy(true)
        try {
            await deleteIdea(idea.id)
            onDeleted()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the idea.'))
            setArmedDelete(false)
            setBusy(false)
        }
    }

    return (
        <div className="space-y-4">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-700">
                <FaArrowLeft className="h-3 w-3" /> Back to the list
            </button>

            {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
            {!idea && !loadError && <p className="py-8 text-center text-sm text-gray-500">Loading...</p>}

            {idea && (
                <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-green-950">{idea.title}</h2>
                            <p className="text-sm text-gray-500">
                                {idea.mine ? 'Shared by you' : `From ${idea.author.name} (${roleLabel[idea.author.role]})`} · {idea.category} · {when(idea.createdAt)}
                            </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTag[idea.status]}`}>{statusLabel[idea.status]}</span>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800">{idea.description}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                            {idea.attachmentName ? (
                                <>
                                    <a
                                        href={attachmentLink(idea.id)}
                                        className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-1.5 text-sm font-medium text-green-900 hover:bg-green-50"
                                    >
                                        <FaDownload className="h-3.5 w-3.5" /> {idea.attachmentName}
                                    </a>
                                    {idea.mine && (
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => void run(() => removeAttachment(idea.id), 'The file was removed.')}
                                            className="text-sm text-red-700 hover:underline disabled:opacity-60"
                                        >
                                            Remove file
                                        </button>
                                    )}
                                </>
                            ) : idea.mine ? (
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-green-300 px-3 py-1.5 text-sm text-green-800 hover:bg-green-50">
                                    <FaPaperclip className="h-3.5 w-3.5" /> Attach a file (PDF, JPG or PNG)
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={attach} disabled={busy} />
                                </label>
                            ) : (
                                <span className="text-xs text-gray-500">No attachment.</span>
                            )}
                        </div>
                    </div>

                    {/* progress */}
                    <ol className="flex items-start" aria-label="Progress of this idea">
                        {steps.map((name, i) => {
                            const done = i <= stepReached[idea.status]
                            return (
                                <li key={name} className="flex min-w-0 flex-1 flex-col items-center">
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${done ? 'bg-green-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {done ? <FaCheck className="h-2.5 w-2.5" /> : i + 1}
                                    </span>
                                    <span className="mt-1 text-center text-xs text-gray-500">{name}</span>
                                </li>
                            )
                        })}
                    </ol>

                    {idea.mine && idea.status === 'needs_info' && (
                        <p className="rounded-lg bg-purple-50 p-3 text-sm text-purple-900">The reviewers need more information. Please reply below.</p>
                    )}

                    {note && (
                        <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
                            {note}
                        </p>
                    )}
                    {error && (
                        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    {/* all feedback */}
                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-green-950">Feedback ({idea.feedback.length})</h3>
                        {idea.feedback.length === 0 && (
                            <p className="text-sm text-gray-500">
                                {idea.mine ? 'No feedback yet. Reviewers from administration, ICT and the employees will answer here.' : 'Nobody has given feedback yet.'}
                            </p>
                        )}
                        <ul className="space-y-2">
                            {idea.feedback.map((f) => (
                                <li key={f.id} className="rounded-lg border border-gray-200 bg-white p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {f.kind === 'review' ? (
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${reviewerRoleTag[f.role] ?? 'bg-gray-100 text-gray-700'}`}>
                                                {reviewerRoleLabel[f.role] ?? 'Reviewer'}
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">{idea.mine ? 'You' : 'Idea author'}</span>
                                        )}
                                        {f.name && f.kind === 'review' && <span className="text-xs text-gray-500">{f.name}</span>}
                                        {f.recommendation && <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${recTag[f.recommendation]}`}>{recLabel[f.recommendation]}</span>}
                                        <span className="ml-auto text-xs text-gray-400">{when(f.createdAt)}</span>
                                    </div>
                                    <p className="mt-2 whitespace-pre-line text-sm text-gray-800">{f.comment}</p>
                                    {f.impact !== null && (
                                        <p className="mt-1.5 text-xs text-gray-500">
                                            Impact {f.impact}/5, feasibility {f.feasibility}/5, effort {f.effort}/5
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* the author replies */}
                    {idea.canReply && (
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <label htmlFor="reply" className="mb-1 block text-xs font-medium text-gray-600">
                                Reply to the reviewers
                            </label>
                            <textarea
                                id="reply"
                                rows={3}
                                value={comment}
                                maxLength={2000}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add details or answer a question"
                                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                            />
                            {fieldErrors.comment && <p className="mt-1 text-xs text-red-600">{fieldErrors.comment}</p>}
                            <button
                                type="button"
                                disabled={busy}
                                onClick={sendReply}
                                className="mt-2 rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50 disabled:opacity-60"
                            >
                                {busy ? 'Sending...' : 'Send reply'}
                            </button>
                        </div>
                    )}

                    {/* a reviewer reviews */}
                    {idea.canReview && (
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h3 className="mb-3 text-sm font-semibold text-green-950">Your review</h3>
                            <Slider label="Impact" value={impact} onChange={setImpact} error={fieldErrors.impact} />
                            <Slider label="Feasibility" value={feasibility} onChange={setFeasibility} error={fieldErrors.feasibility} />
                            <Slider label="Effort" value={effort} onChange={setEffort} error={fieldErrors.effort} />

                            <p className="mb-1 mt-3 text-xs font-medium text-gray-600">Your recommendation</p>
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(recLabel) as Recommendation[]).map((k) => (
                                    <button
                                        key={k}
                                        type="button"
                                        aria-pressed={rec === k}
                                        onClick={() => setRec(k)}
                                        className={`rounded-full border px-4 py-1.5 text-sm font-medium ${rec === k ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                                            }`}
                                    >
                                        {recLabel[k]}
                                    </button>
                                ))}
                            </div>
                            {fieldErrors.recommendation && <p className="mt-1 text-xs text-red-600">{fieldErrors.recommendation}</p>}

                            <label htmlFor="review-comment" className="mb-1 mt-3 block text-xs font-medium text-gray-600">
                                Feedback for the person who shared the idea
                            </label>
                            <textarea
                                id="review-comment"
                                rows={4}
                                value={comment}
                                maxLength={2000}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="What is good about it, and what would make it stronger?"
                                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                            />
                            {fieldErrors.comment && <p className="mt-1 text-xs text-red-600">{fieldErrors.comment}</p>}
                            <p className="mt-1 text-xs text-gray-500">The person who shared the idea can read your feedback and sees that it came from you as a reviewer.</p>

                            <button
                                type="button"
                                disabled={busy}
                                onClick={sendReview}
                                className="mt-3 rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                            >
                                {busy ? 'Sending...' : 'Send feedback'}
                            </button>
                        </div>
                    )}

                    {/* the final decision */}
                    {idea.canDecide ? (
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h3 className="mb-2 text-sm font-semibold text-green-950">Final decision (administrator)</h3>
                            <div className="flex flex-wrap gap-2">
                                <select
                                    value={decision}
                                    onChange={(e) => setDecision(e.target.value as DecisionStatus)}
                                    aria-label="Final decision"
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    {decisions.map((d) => (
                                        <option key={d.value} value={d.value}>
                                            {d.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    disabled={busy || decision === idea.status}
                                    onClick={() => void run(() => setIdeaStatus(idea.id, decision), 'Decision saved. The person was notified.')}
                                    className="rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50 disabled:opacity-50"
                                >
                                    Save decision
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">The person who shared the idea is told the new status and sees all the feedback.</p>
                        </div>
                    ) : (
                        idea.canReview && (
                            <p className="text-xs text-gray-500">Only the administrator makes the final decision. Your recommendation and comment are shared with the person who sent the idea.</p>
                        )
                    )}
                    {idea.mine && REVIEWER_ROLES.includes(idea.author.role) && (
                        <p className="text-xs text-gray-500">
                            Reviewers cannot review their own ideas.
                            {idea.author.role === 'admin' ? ' Another administrator decides on this one.' : ''}
                        </p>
                    )}

                    {idea.mine && idea.feedback.length === 0 && (
                        <div>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void remove()}
                                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60 ${armedDelete ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                    }`}
                            >
                                <FaTrash className="h-3.5 w-3.5" /> {armedDelete ? 'Confirm: delete my idea' : 'Delete my idea'}
                            </button>
                            <p className="mt-1 text-xs text-gray-500">You can delete an idea until a reviewer answers it.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default IdeaDetail
