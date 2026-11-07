import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../../services/api'
import { shortDate } from '../../services/content'
import { decideIdea, getIdea, listIdeas, releaseIdea, startReview } from '../../services/innovationReview'
import type { IdeaFull, IdeaRow, IdeaStatus } from '../../services/innovationReview'
import ModalShell from '../admin/users/ModalShell'
import Pager from '../../components/pager'

const CATEGORY: Record<string, string> = {
    climate: 'Climate change', waste: 'Waste management', trees: 'Trees and conservation', land: 'Land use planning',
    wildlife: 'Wildlife and people', community: 'Community', technology: 'Technology', other: 'Something else',
}
const STAGE: Record<string, string> = { idea: 'Just an idea', prototype: 'Prototype or plan', running: 'Already running' }
const LABEL: Record<IdeaStatus, string> = {
    received: 'New', reviewing: 'In review', shortlisted: 'Shortlisted', rejected: 'Rejected',
}
const TAG: Record<IdeaStatus, string> = {
    received: 'bg-amber-100 text-amber-900', reviewing: 'bg-sky-100 text-sky-900',
    shortlisted: 'bg-green-100 text-green-800', rejected: 'bg-gray-100 text-gray-600',
}

const TABS: { id: '' | IdeaStatus; label: string }[] = [
    { id: '', label: 'All' }, { id: 'received', label: 'New' }, { id: 'reviewing', label: 'In review' },
    { id: 'shortlisted', label: 'Shortlisted' }, { id: 'rejected', label: 'Rejected' },
]

const IdeaModal = ({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) => {
    const [idea, setIdea] = useState<IdeaFull | null>(null)
    const [note, setNote] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let cancelled = false
        getIdea(id)
            .then((i) => !cancelled && setIdea(i))
            .catch((err) => !cancelled && setError(getErrorMessage(err, 'Could not load this idea.')))
        return () => {
            cancelled = true
        }
    }, [id])

    const run = async (action: () => Promise<IdeaFull>) => {
        setBusy(true)
        setError('')
        try {
            setIdea(await action())
            onChanged()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not save. Please try again.'))
        } finally {
            setBusy(false)
        }
    }

    const btn = 'rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60'

    return (
        <ModalShell title="Innovation idea" onClose={onClose} wide>
            {!idea && !error && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}
            {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            {idea && (
                <div className="space-y-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-green-950">{idea.title}</h3>
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${TAG[idea.status]}`}>{LABEL[idea.status]}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            {CATEGORY[idea.category] ?? idea.category} · {STAGE[idea.stage] ?? idea.stage} · sent {shortDate(idea.createdAt)}
                        </p>
                    </div>

                    <p className="whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">{idea.description}</p>

                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        {[
                            ['Name', idea.fullName], ['Email', idea.email], ['Phone', idea.phone ?? 'Not given'],
                            ['Region', idea.region], ['Who benefits', idea.beneficiaries ?? 'Not given'],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <dt className="text-xs text-gray-500">{k}</dt>
                                <dd className="break-words font-medium text-green-950">{v}</dd>
                            </div>
                        ))}
                        <div>
                            <dt className="text-xs text-gray-500">Link</dt>
                            <dd className="break-all font-medium">
                                {idea.link && /^https?:\/\//i.test(idea.link) ? (
                                    <a href={idea.link} target="_blank" rel="noopener noreferrer" className="text-green-800 underline">{idea.link}</a>
                                ) : 'Not given'}
                            </dd>
                        </div>
                    </dl>

                    {idea.status === 'reviewing' && !idea.canDecide && (
                        <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
                            {idea.reviewer ?? 'A colleague'} is reviewing this idea.
                        </p>
                    )}

                    {(idea.status === 'shortlisted' || idea.status === 'rejected') && (
                        <div className="rounded-lg border border-gray-200 p-3 text-sm">
                            <p className="text-xs text-gray-500">
                                Decision by {idea.reviewer ?? 'a reviewer'}{idea.reviewedAt ? `, ${shortDate(idea.reviewedAt)}` : ''}
                            </p>
                            <p className="mt-1 whitespace-pre-line text-gray-800">{idea.reviewNote || 'No note.'}</p>
                        </div>
                    )}

                    {idea.canStart && (
                        <button type="button" disabled={busy} onClick={() => void run(() => startReview(idea.id))}
                            className={`${btn} bg-amber-400 text-green-950 hover:bg-amber-300`}>
                            {busy ? 'Please wait...' : 'Start review'}
                        </button>
                    )}

                    {idea.canDecide && idea.status === 'reviewing' && (
                        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
                            <label htmlFor="note" className="block text-sm font-medium text-green-950">Your note</label>
                            <textarea id="note" rows={3} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)}
                                placeholder="Why this idea is promising, or why it cannot go forward."
                                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                            <p className="text-xs text-gray-600">A note is needed when you reject (at least 10 characters).</p>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" disabled={busy} onClick={() => void run(() => decideIdea(idea.id, 'shortlisted', note))}
                                    className={`${btn} bg-green-700 text-white hover:bg-green-800`}>Shortlist</button>
                                <button type="button" disabled={busy} onClick={() => void run(() => decideIdea(idea.id, 'rejected', note))}
                                    className={`${btn} border border-red-300 bg-white text-red-700 hover:bg-red-50`}>Reject</button>
                                {idea.canRelease && (
                                    <button type="button" disabled={busy} onClick={() => void run(() => releaseIdea(idea.id))}
                                        className={`${btn} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}>Release to the list</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </ModalShell>
    )
}

const InnovationReview = () => {
    const [tab, setTab] = useState<'' | IdeaStatus>('')
    const [q, setQ] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [ideas, setIdeas] = useState<IdeaRow[]>([])
    const [total, setTotal] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [counts, setCounts] = useState({ all: 0, received: 0, reviewing: 0, shortlisted: 0, rejected: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [openId, setOpenId] = useState<number | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const r = await listIdeas({ status: tab || undefined, search: search || undefined, page })
            setIdeas(r.ideas); setTotal(r.total); setPageSize(r.pageSize); setCounts(r.counts); setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load the ideas.'))
        } finally {
            setLoading(false)
        }
    }, [tab, search, page])

    useEffect(() => { void load() }, [load])

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">Innovation ideas</h1>
                <p className="text-sm text-gray-500">
                    Ideas sent by visitors. Start a review to take an idea, then shortlist or reject it with a note.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                    <button key={t.id || 'all'} type="button" aria-pressed={tab === t.id}
                        onClick={() => { setTab(t.id); setPage(1) }}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t.id ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 bg-white text-green-900 hover:bg-green-50'}`}>
                        {t.label} ({counts[t.id || 'all']})
                    </button>
                ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()) }} className="flex gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by idea or name"
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <button type="submit" className="rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50">Search</button>
            </form>

            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading ? <p className="p-6 text-center text-sm text-gray-500">Loading...</p>
                    : total === 0 ? <p className="p-6 text-center text-sm text-gray-500">No ideas here yet.</p>
                        : (
                            <ul className="divide-y divide-gray-100">
                                {ideas.map((i) => (
                                    <li key={i.id} className="flex flex-wrap items-center gap-3 p-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-green-950">{i.title}</p>
                                            <p className="truncate text-xs text-gray-500">
                                                {i.fullName} · {i.region} · {CATEGORY[i.category] ?? i.category} · {shortDate(i.createdAt)}
                                            </p>
                                            {i.reviewer && <p className="text-xs text-gray-500">Reviewer: {i.mine ? 'you' : i.reviewer}</p>}
                                        </div>
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${TAG[i.status]}`}>{LABEL[i.status]}</span>
                                        <button type="button" onClick={() => setOpenId(i.id)} aria-label={`Open ${i.title}`}
                                            className="rounded-md border border-green-900 px-3 py-1.5 text-xs font-medium text-green-900 hover:bg-green-50">
                                            {i.canStart ? 'Review' : 'Open'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
            </section>

            <Pager page={page} total={total} pageSize={pageSize} onChange={setPage} />

            {openId !== null && <IdeaModal id={openId} onClose={() => setOpenId(null)} onChanged={() => void load()} />}
        </div>
    )
}

export default InnovationReview