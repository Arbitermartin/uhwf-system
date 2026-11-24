import { useEffect, useRef, useState } from 'react'
import { FaArrowLeft, FaBookOpen, FaDownload, FaEdit, FaExternalLinkAlt, FaFilePdf, FaFileWord, FaPlus, FaSearch, FaTrash } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../services/api'
import { deleteNote, getNote, getNoteMeta, listNotes, noteFileLink } from '../../services/learning'
import type { NoteCard, NoteDetail, NoteMeta } from '../../services/learning'
import NoteFormModal from './learning/NoteFormModal'

const PAGE_SIZE = 12

const roleName: Record<string, string> = { lecturer: 'Lecturer', ict: 'ICT', admin: 'Administration', employee: 'Employee', student: 'Student' }

const when = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Dar_es_Salaam' })

const FileIcon = ({ name }: { name: string }) =>
    name.toLowerCase().endsWith('.pdf') ? <FaFilePdf className="h-4 w-4 text-red-600" aria-label="PDF" /> : <FaFileWord className="h-4 w-4 text-sky-700" aria-label="Word" />

// "My learning" for students, the knowledge base for staff. Lecturers, ICT and administrators also write the notes.
const LearningPage = () => {
    const { user } = useAuth()
    const isStudent = user?.role === 'student'

    const [meta, setMeta] = useState<NoteMeta | null>(null)
    const [course, setCourse] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const [data, setData] = useState<{ notes: NoteCard[]; total: number } | null>(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    const [openId, setOpenId] = useState<number | null>(null)
    const [reading, setReading] = useState<NoteDetail | null>(null)
    const [readError, setReadError] = useState('')
    const [form, setForm] = useState<{ note: NoteDetail | null } | null>(null)
    const [armed, setArmed] = useState(false)
    const armTimer = useRef<number | undefined>(undefined)

    useEffect(() => {
        getNoteMeta()
            .then(setMeta)
            .catch((err) => setError(getErrorMessage(err, 'Could not load the knowledge base.')))
        return () => window.clearTimeout(armTimer.current)
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
        listNotes({ course: course || undefined, search: search || undefined, page, pageSize: PAGE_SIZE })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the notes.'))
            })
        return () => {
            cancelled = true
        }
    }, [course, search, page, reloadKey])

    useEffect(() => {
        if (data && data.notes.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    // the note being read
    useEffect(() => {
        if (openId === null) {
            setReading(null)
            return
        }
        let cancelled = false
        setReading(null)
        setReadError('')
        getNote(openId)
            .then((n) => {
                if (!cancelled) setReading(n)
            })
            .catch((err) => {
                if (!cancelled) setReadError(getErrorMessage(err, 'Could not open this note.'))
            })
        return () => {
            cancelled = true
        }
    }, [openId, reloadKey])

    const refresh = () => setReloadKey((k) => k + 1)

    const remove = async () => {
        if (!reading) return
        if (!armed) {
            setArmed(true)
            window.clearTimeout(armTimer.current)
            armTimer.current = window.setTimeout(() => setArmed(false), 4000)
            return
        }
        try {
            await deleteNote(reading.id)
            setArmed(false)
            setOpenId(null)
            setNotice('The note was deleted.')
            refresh()
        } catch (err) {
            setReadError(getErrorMessage(err, 'Could not delete the note.'))
            setArmed(false)
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

    // ---------- reading one note ----------
    if (openId !== null) {
        return (
            <div className="mx-auto max-w-3xl space-y-4">
                <button type="button" onClick={() => setOpenId(null)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-700">
                    <FaArrowLeft className="h-3 w-3" /> Back to the list
                </button>

                {readError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{readError}</p>}
                {!reading && !readError && <p className="py-8 text-center text-sm text-gray-500">Loading...</p>}

                {reading && (
                    <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                            {reading.course ? `${reading.course.code} · ${reading.course.title}` : 'General'}
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-green-950">{reading.title}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {reading.author} ({roleName[reading.authorRole] ?? reading.authorRole}) · {when(reading.createdAt)}
                            {reading.updatedAt !== reading.createdAt && ` · updated ${when(reading.updatedAt)}`}
                        </p>

                        {/* The text is shown as plain paragraphs, so nothing an author types can run as code */}
                        <div className="mt-5 space-y-4 text-base leading-relaxed text-gray-800">
                            {reading.body.split(/\n{2,}/).map((p, i) => (
                                <p key={i} className="whitespace-pre-line">
                                    {p}
                                </p>
                            ))}
                        </div>

                        {reading.attachment && (
                            <div className="mt-6 border-t border-gray-100 pt-4">
                                <p className="flex flex-wrap items-center gap-3 text-sm">
                                    <FileIcon name={reading.attachment.name} />
                                    <span className="break-all font-medium text-green-950">{reading.attachment.name}</span>
                                    <span className="ml-auto flex gap-2">
                                        {reading.attachment.inlineViewable && (
                                            <a
                                                href={noteFileLink(reading.id, true)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-1.5 font-medium text-green-900 hover:bg-green-50"
                                            >
                                                <FaExternalLinkAlt className="h-3 w-3" /> Open
                                            </a>
                                        )}
                                        <a href={noteFileLink(reading.id)} className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-1.5 font-medium text-green-900 hover:bg-green-50">
                                            <FaDownload className="h-3 w-3" /> Download
                                        </a>
                                    </span>
                                </p>
                                {reading.attachment.inlineViewable && (
                                    <iframe title={reading.attachment.name} src={noteFileLink(reading.id, true)} className="mt-3 h-[34rem] w-full rounded-lg border border-gray-200" />
                                )}
                            </div>
                        )}

                        {reading.manageable && (
                            <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setForm({ note: reading })}
                                    className="inline-flex items-center gap-2 rounded-lg border border-amber-500 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
                                >
                                    <FaEdit className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void remove()}
                                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${armed ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                        }`}
                                >
                                    <FaTrash className="h-3.5 w-3.5" /> {armed ? 'Confirm: delete this note' : 'Delete'}
                                </button>
                            </div>
                        )}
                    </article>
                )}

                {form && meta && (
                    <NoteFormModal
                        note={form.note}
                        meta={meta}
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

    // ---------- the list ----------
    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">{isStudent ? 'My learning' : 'Knowledge base'}</h1>
                    <p className="text-sm text-gray-500">
                        {isStudent ? 'Notes and documents from your lecturers, for your courses.' : 'Learning notes and documents for every course.'}
                    </p>
                </div>
                {meta?.canWrite && (
                    <button
                        type="button"
                        onClick={() => {
                            setNotice('')
                            setForm({ note: null })
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                    >
                        <FaPlus className="h-3 w-3" /> Add a note
                    </button>
                )}
            </div>

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

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex min-w-[14rem] max-w-sm flex-1 items-center gap-2 rounded-lg bg-green-50 px-3">
                        <FaSearch className="h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search notes"
                            aria-label="Search notes"
                            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>
                    <select
                        value={course}
                        onChange={(e) => {
                            setCourse(e.target.value)
                            setPage(1)
                        }}
                        aria-label="Filter by course"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">{isStudent ? 'All my notes' : 'All courses'}</option>
                        <option value="general">General notes</option>
                        {meta?.filterCourses.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.code} {c.title}
                            </option>
                        ))}
                    </select>
                </div>

                {!data && !error && <p className="py-10 text-center text-sm text-gray-500">Loading...</p>}
                {data && data.notes.length === 0 && (
                    <div className="mt-4 rounded-xl border border-dashed border-green-200 bg-green-50 p-10 text-center">
                        <FaBookOpen className="mx-auto h-8 w-8 text-green-300" />
                        <p className="mt-3 text-gray-600">{search || course ? 'No note matches your search.' : 'There are no notes yet.'}</p>
                        {isStudent && !search && !course && <p className="mt-1 text-sm text-gray-500">Your lecturers add notes for your courses here.</p>}
                    </div>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {data?.notes.map((n) => (
                        <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                                setNotice('')
                                setOpenId(n.id)
                            }}
                            className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-green-400 hover:bg-green-50/40"
                        >
                            <span className="text-xs font-semibold uppercase tracking-wide text-green-700">{n.course ? n.course.code : 'General'}</span>
                            <span className="mt-1 font-semibold text-green-950">{n.title}</span>
                            <span className="mt-1 line-clamp-2 text-sm text-gray-600">{n.excerpt}</span>
                            <span className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                {n.attachment && <FileIcon name={n.attachment.name} />}
                                {n.author} · {when(n.createdAt)}
                            </span>
                        </button>
                    ))}
                </div>

                {data && data.total > PAGE_SIZE && (
                    <div className="mt-5 flex items-center justify-between text-sm text-gray-600">
                        <span>
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1} className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40">
                                Previous
                            </button>
                            <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {form && meta && (
                <NoteFormModal
                    note={form.note}
                    meta={meta}
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

export default LearningPage
