import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FaComment, FaLightbulb, FaPlus, FaSearch } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../services/api'
import { listIdeas } from '../../services/ideas'
import type { IdeaList } from '../../services/ideas'
import { roleLabel } from '../admin/users/userLabels'
import IdeaDetail from './ideas/IdeaDetails'
import IdeaForm from './ideas/IdeaForm'
import { REVIEWER_ROLES, statusLabel, statusTag, when } from './ideas/IdeaLabels'

const PAGE_SIZE = 10

type Scope = 'mine' | 'review'
type Filter = 'submitted' | 'under_review' | 'needs_info' | 'decided' | undefined

const filters: { key: Exclude<Filter, undefined>; label: string }[] = [
    { key: 'submitted', label: 'New' },
    { key: 'under_review', label: 'Under review' },
    { key: 'needs_info', label: 'Needs info' },
    { key: 'decided', label: 'Decided' },
]

// The innovation portal. The same page for every role: everyone shares ideas and reads the feedback.
// Administrators, ICT and employees also see "Ideas to review".
const IdeasPage = () => {
    const { user } = useAuth()
    const isReviewer = !!user && REVIEWER_ROLES.includes(user.role)
    const [searchParams, setSearchParams] = useSearchParams()

    const [scope, setScope] = useState<Scope>(isReviewer ? 'review' : 'mine')
    const [filter, setFilter] = useState<Filter>(undefined)
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    // a link in a notification looks like ...?idea=12 and opens that idea straight away
    const [openId, setOpenId] = useState<number | null>(() => {
        const n = Number(searchParams.get('idea'))
        return Number.isInteger(n) && n > 0 ? n : null
    })
    const [creating, setCreating] = useState(false)

    const [data, setData] = useState<IdeaList | null>(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    useEffect(() => {
        if (searchParams.has('idea')) setSearchParams({}, { replace: true })
        // this must run once, when the page opens
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 300)
        return () => window.clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        let cancelled = false
        listIdeas({ scope, status: filter, search: search || undefined, page, pageSize: PAGE_SIZE })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the ideas.'))
            })
        return () => {
            cancelled = true
        }
    }, [scope, filter, search, page, reloadKey])

    useEffect(() => {
        if (data && data.ideas.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const refresh = () => setReloadKey((k) => k + 1)

    if (creating) {
        return (
            <div className="mx-auto max-w-3xl">
                <IdeaForm
                    onCancel={() => setCreating(false)}
                    onSent={(message) => {
                        setCreating(false)
                        setScope('mine')
                        setFilter(undefined)
                        setNotice(message)
                        refresh()
                    }}
                />
            </div>
        )
    }

    if (openId !== null) {
        return (
            <div className="mx-auto max-w-3xl">
                <IdeaDetail
                    id={openId}
                    onBack={() => setOpenId(null)}
                    onChanged={refresh}
                    onDeleted={() => {
                        setOpenId(null)
                        setNotice('Your idea was deleted.')
                        refresh()
                    }}
                />
            </div>
        )
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

    return (
        <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">Innovation portal</h1>
                    <p className="text-sm text-gray-500">
                        {scope === 'review'
                            ? 'All ideas from students, lecturers, employees and members.'
                            : 'Share ideas that could help UHWF, and read everything the reviewers say.'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setNotice('')
                        setCreating(true)
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                >
                    <FaPlus className="h-3 w-3" /> Share an idea
                </button>
            </div>

            {isReviewer && (
                <div className="flex gap-2 border-b border-gray-200" role="tablist" aria-label="Ideas">
                    {(
                        [
                            { key: 'review', label: 'Ideas to review' },
                            { key: 'mine', label: 'My ideas' },
                        ] as const
                    ).map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={scope === t.key}
                            onClick={() => {
                                setScope(t.key)
                                setFilter(undefined)
                                setPage(1)
                                setNotice('')
                            }}
                            className={`-mb-px border-b-2 px-5 py-2.5 text-sm font-semibold ${scope === t.key ? 'border-amber-400 text-green-950' : 'border-transparent text-gray-500 hover:text-green-900'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            {notice && (
                <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
                    {notice}
                </p>
            )}
            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {scope === 'review' && data && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            aria-pressed={filter === f.key}
                            onClick={() => {
                                setFilter(filter === f.key ? undefined : f.key)
                                setPage(1)
                            }}
                            className={`rounded-xl border p-3 text-left transition-colors ${filter === f.key ? 'border-green-900 bg-green-50' : 'border-gray-200 bg-white hover:bg-green-50'
                                }`}
                        >
                            <span className="block text-xs text-gray-500">{f.label}</span>
                            <span className="block text-2xl font-bold text-green-950">{data.counts[f.key]}</span>
                        </button>
                    ))}
                </div>
            )}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex min-w-[14rem] max-w-sm items-center gap-2 rounded-lg bg-green-50 px-3">
                    <FaSearch className="h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by title"
                        aria-label="Search ideas"
                        className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                    />
                </div>

                <ul className="mt-3 divide-y divide-gray-100">
                    {!data && !error && <li className="py-8 text-center text-sm text-gray-500">Loading...</li>}
                    {data && data.ideas.length === 0 && (
                        <li className="py-8 text-center text-sm text-gray-500">
                            {scope === 'mine' ? 'You have not shared an idea yet. Click "Share an idea" to start.' : 'No ideas here.'}
                        </li>
                    )}
                    {data?.ideas.map((i) => (
                        <li key={i.id}>
                            <button
                                type="button"
                                onClick={() => {
                                    setNotice('')
                                    setOpenId(i.id)
                                }}
                                className="flex w-full items-center gap-3 px-1 py-3 text-left hover:bg-green-50"
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                                    <FaLightbulb className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-green-950">{i.title}</span>
                                    <span className="block truncate text-xs text-gray-500">
                                        {scope === 'review' && !i.mine ? `From ${i.author.name} (${roleLabel[i.author.role]}) · ` : ''}
                                        {i.category} · {when(i.createdAt)}
                                    </span>
                                </span>
                                <span className="flex items-center gap-1 text-xs text-gray-500" title="Feedback comments">
                                    <FaComment className="h-3 w-3" /> {i.feedbackCount}
                                </span>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTag[i.status]}`}>{statusLabel[i.status]}</span>
                            </button>
                        </li>
                    ))}
                </ul>

                {data && data.total > PAGE_SIZE && (
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                        <span>
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages}
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

export default IdeasPage
