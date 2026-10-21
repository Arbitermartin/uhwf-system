import { useEffect, useState } from 'react'
import { FaEdit, FaExclamationTriangle, FaPlus, FaSearch, FaTrash } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { deleteCourse, listCourses } from '../../services/courses'
import type { CourseList, CourseRow } from '../../services/courses'
import { listDepartments } from '../../services/users'
import type { Department } from '../../services/users'
import CourseFormModal from './courses/CourseFormModal'
import ModalShell from './users/ModalShell'

const PAGE_SIZE = 10

type Tab = 'all' | 'active' | 'inactive'

const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Open' },
    { key: 'inactive', label: 'Hidden' },
]

const DeleteCourseModal = ({
    course,
    onClose,
    onDeleted,
}: {
    course: CourseRow
    onClose: () => void
    onDeleted: () => void
}) => {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const confirm = async () => {
        setBusy(true)
        setError('')
        try {
            await deleteCourse(course.id)
            onDeleted()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the course.'))
            setBusy(false)
        }
    }

    return (
        <ModalShell title="Delete course?" onClose={onClose}>
            <div className="flex gap-3 rounded-lg bg-red-50 p-3 text-red-800">
                <FaExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="text-sm">
                    <p className="font-semibold">
                        {course.code} · {course.title}
                    </p>
                    <p>{course.department.name}</p>
                </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
                This permanently deletes the course. If students or lecturers already use it, deleting is refused, and you
                should hide it instead (Edit, then turn off "Open for students to choose").
            </p>
            {error && (
                <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => void confirm()}
                    disabled={busy}
                    className="rounded-lg bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                >
                    {busy ? 'Deleting...' : 'Delete course'}
                </button>
            </div>
        </ModalShell>
    )
}

const CoursesPage = () => {
    const [tab, setTab] = useState<Tab>('all')
    const [departmentId, setDepartmentId] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const [data, setData] = useState<CourseList | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    const [form, setForm] = useState<{ course: CourseRow | null } | null>(null)
    const [deleting, setDeleting] = useState<CourseRow | null>(null)

    useEffect(() => {
        listDepartments()
            .then(setDepartments)
            .catch(() => undefined) // the filter just stays empty
    }, [reloadKey])

    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 300)
        return () => window.clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        let cancelled = false
        listCourses({
            search: search || undefined,
            departmentId: departmentId ? Number(departmentId) : undefined,
            status: tab === 'all' ? undefined : tab,
            page,
            pageSize: PAGE_SIZE,
        })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the courses.'))
            })
        return () => {
            cancelled = true
        }
    }, [search, departmentId, tab, page, reloadKey])

    useEffect(() => {
        if (data && data.courses.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const refresh = () => setReloadKey((k) => k + 1)
    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
    const from = data && data.total > 0 ? (data.page - 1) * PAGE_SIZE + 1 : 0
    const to = data ? Math.min(data.page * PAGE_SIZE, data.total) : 0

    return (
        <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">Courses</h1>
                    <p className="text-sm text-gray-500">The courses students choose from, and the lecturer who teaches each one.</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setNotice('')
                        setForm({ course: null })
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                >
                    <FaPlus className="h-3 w-3" /> Add course
                </button>
            </div>

            {notice && (
                <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
                    {notice}
                </p>
            )}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
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
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
                                }`}
                        >
                            {t.label}
                            {data && <span className="ml-1.5 text-xs opacity-80">{data.counts[t.key]}</span>}
                        </button>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex min-w-[14rem] max-w-sm flex-1 items-center gap-2 rounded-lg bg-green-50 px-3">
                        <FaSearch className="h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search code or title"
                            aria-label="Search courses"
                            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>
                    <select
                        value={departmentId}
                        onChange={(e) => {
                            setDepartmentId(e.target.value)
                            setPage(1)
                        }}
                        aria-label="Filter by department"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All departments</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                </div>

                {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[46rem] text-left text-sm">
                        <thead>
                            <tr className="text-xs text-gray-500">
                                <th className="py-2 font-normal">Course</th>
                                <th className="py-2 font-normal">Department</th>
                                <th className="py-2 font-normal">Taught by</th>
                                <th className="py-2 font-normal">Credits</th>
                                <th className="py-2 font-normal">Students</th>
                                <th className="py-2 font-normal">Status</th>
                                <th className="py-2 text-right font-normal">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data && !error && (
                                <tr>
                                    <td colSpan={7} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        Loading courses...
                                    </td>
                                </tr>
                            )}
                            {data && data.courses.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        No courses found.
                                    </td>
                                </tr>
                            )}
                            {data?.courses.map((c) => (
                                <tr key={c.id} className="border-t border-gray-100">
                                    <td className="py-3">
                                        <p className="font-medium text-green-950">
                                            <span className="font-semibold">{c.code}</span> {c.title}
                                        </p>
                                    </td>
                                    <td className="py-3 text-gray-600">{c.department.name}</td>
                                    <td className="py-3 text-gray-600">
                                        {c.lecturer ? c.lecturer.name : <span className="text-amber-700">Not assigned</span>}
                                    </td>
                                    <td className="py-3 text-gray-600">{c.credits}</td>
                                    <td className="py-3 text-gray-600" title={`${c.enrolled} enrolled, ${c.chosenByApplicants} applications`}>
                                        {c.enrolled} <span className="text-xs text-gray-400">({c.chosenByApplicants} applied)</span>
                                    </td>
                                    <td className="py-3">
                                        <span
                                            className={`rounded px-2 py-0.5 text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {c.isActive ? 'Open' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNotice('')
                                                    setForm({ course: c })
                                                }}
                                                aria-label={`Edit ${c.code}`}
                                                title="Edit"
                                                className="rounded-md border border-amber-500 p-2 text-amber-700 hover:bg-amber-50"
                                            >
                                                <FaEdit className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleting(c)}
                                                aria-label={`Delete ${c.code}`}
                                                title="Delete"
                                                className="rounded-md border border-red-600 p-2 text-red-700 hover:bg-red-50"
                                            >
                                                <FaTrash className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data && data.total > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                        <p>
                            Showing {from} to {to} of {data.total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="px-2 py-1.5">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages}
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {form && (
                <CourseFormModal
                    course={form.course}
                    onClose={() => setForm(null)}
                    onSaved={(message) => {
                        setForm(null)
                        setNotice(message)
                        refresh()
                    }}
                />
            )}

            {deleting && (
                <DeleteCourseModal
                    course={deleting}
                    onClose={() => setDeleting(null)}
                    onDeleted={() => {
                        setDeleting(null)
                        setNotice('Course deleted.')
                        refresh()
                    }}
                />
            )}
        </div>
    )
}

export default CoursesPage
