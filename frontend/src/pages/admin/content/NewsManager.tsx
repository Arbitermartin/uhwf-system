import { useEffect, useRef, useState } from 'react'
import { FaEdit, FaEye, FaEyeSlash, FaImage, FaPlus, FaSearch, FaTrash } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import { deleteNews, getNews, listNews, shortDate, updateNews } from '../../../services/content'
import type { NewsList, NewsRow } from '../../../services/content'
import NewsFormModal from './NewsFormModal'

const PAGE_SIZE = 10

type Tab = 'all' | 'published' | 'draft'

const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'published', label: 'Published' },
    { key: 'draft', label: 'Drafts' },
]

const NewsManager = () => {
    const [tab, setTab] = useState<Tab>('all')
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const [data, setData] = useState<NewsList | null>(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [form, setForm] = useState<{ id: number | null } | null>(null)
    const [armedId, setArmedId] = useState<number | null>(null)
    const armTimer = useRef<number | undefined>(undefined)

    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 300)
        return () => window.clearTimeout(t)
    }, [searchInput])

    useEffect(() => () => window.clearTimeout(armTimer.current), [])

    useEffect(() => {
        let cancelled = false
        listNews({ status: tab === 'all' ? undefined : tab, search: search || undefined, page, pageSize: PAGE_SIZE })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the news.'))
            })
        return () => {
            cancelled = true
        }
    }, [tab, search, page, reloadKey])

    useEffect(() => {
        if (data && data.news.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const refresh = () => setReloadKey((k) => k + 1)

    const togglePublish = async (row: NewsRow) => {
        setNotice('')
        try {
            // the list holds only a short preview, so the full text is loaded first
            const full = await getNews(row.id)
            await updateNews(row.id, { title: full.title, content: full.content, publish: !row.published })
            setNotice(row.published ? 'Unpublished. It is hidden from the website.' : 'Published on the website.')
            refresh()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not change the article.'))
        }
    }

    const remove = async (row: NewsRow) => {
        if (armedId !== row.id) {
            setArmedId(row.id)
            window.clearTimeout(armTimer.current)
            armTimer.current = window.setTimeout(() => setArmedId(null), 4000)
            return
        }
        setArmedId(null)
        try {
            await deleteNews(row.id)
            setNotice('News post deleted.')
            refresh()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the article.'))
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">Articles shown on the home page and the News page of the public website.</p>
                <button
                    type="button"
                    onClick={() => {
                        setNotice('')
                        setForm({ id: null })
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                >
                    <FaPlus className="h-3 w-3" /> Write news
                </button>
            </div>

            {notice && (
                <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
                    {notice}
                </p>
            )}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            aria-pressed={tab === t.key}
                            onClick={() => {
                                setTab(t.key)
                                setPage(1)
                                setNotice('')
                            }}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t.key ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                                }`}
                        >
                            {t.label}
                            {data && <span className="ml-1.5 text-xs opacity-80">{data.counts[t.key]}</span>}
                        </button>
                    ))}
                    <div className="ml-auto flex min-w-[14rem] items-center gap-2 rounded-lg bg-green-50 px-3">
                        <FaSearch className="h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by title"
                            aria-label="Search news"
                            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[40rem] text-left text-sm">
                        <thead>
                            <tr className="text-xs text-gray-500">
                                <th className="py-2 font-normal">Article</th>
                                <th className="py-2 font-normal">Status</th>
                                <th className="py-2 font-normal">Published</th>
                                <th className="py-2 font-normal">Author</th>
                                <th className="py-2 text-right font-normal">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data && !error && (
                                <tr>
                                    <td colSpan={5} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            )}
                            {data && data.news.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        No articles here. Click "Write news" to add the first one.
                                    </td>
                                </tr>
                            )}
                            {data?.news.map((n) => (
                                <tr key={n.id} className="border-t border-gray-100">
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            {n.image ? (
                                                <img src={n.image} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
                                            ) : (
                                                <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded bg-green-50 text-green-300">
                                                    <FaImage className="h-4 w-4" />
                                                </span>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-green-950">{n.title}</p>
                                                <p className="line-clamp-1 text-xs text-gray-500">{n.excerpt}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <span
                                            className={`rounded px-2 py-0.5 text-xs font-medium ${n.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {n.published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="py-3 text-gray-600">{n.publishedAt ? shortDate(n.publishedAt) : '-'}</td>
                                    <td className="py-3 text-gray-600">{n.author}</td>
                                    <td className="py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void togglePublish(n)}
                                                aria-label={n.published ? `Unpublish ${n.title}` : `Publish ${n.title}`}
                                                title={n.published ? 'Unpublish' : 'Publish'}
                                                className="rounded-md border border-green-900 p-2 text-green-900 hover:bg-green-50"
                                            >
                                                {n.published ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNotice('')
                                                    setForm({ id: n.id })
                                                }}
                                                aria-label={`Edit ${n.title}`}
                                                title="Edit"
                                                className="rounded-md border border-amber-500 p-2 text-amber-700 hover:bg-amber-50"
                                            >
                                                <FaEdit className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void remove(n)}
                                                aria-label={`Delete ${n.title}`}
                                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium ${armedId === n.id ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                                    }`}
                                            >
                                                <FaTrash className="h-3.5 w-3.5" />
                                                {armedId === n.id ? 'Confirm' : ''}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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

            {form && (
                <NewsFormModal
                    newsId={form.id}
                    onClose={() => setForm(null)}
                    onSaved={(message) => {
                        setForm(null)
                        setNotice(message)
                        refresh()
                    }}
                />
            )}
        </div>
    )
}

export default NewsManager
