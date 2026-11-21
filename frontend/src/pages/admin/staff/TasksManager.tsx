import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { addDaysTZ } from '../../../services/lecturer'
import {
    assignTask,
    dayShort,
    deleteTask,
    listAdminTasks,
    listStaff,
    priorityLabel,
    priorityTag,
    taskStatusLabel,
    taskStatusTag,
} from '../../../services/staff'
import type { AdminTaskList, Priority, StaffOption, TaskStatus } from '../../../services/staff'
import ModalShell from '../users/ModalShell'
import TaskReviewModal from './TaskReviewModal'

const PAGE_SIZE = 10
type Tab = TaskStatus | 'all'
const tabs: { key: Tab; label: string }[] = [
    { key: 'submitted', label: 'Waiting for review' },
    { key: 'todo', label: 'To do' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'returned', label: 'Returned' },
    { key: 'done', label: 'Accepted' },
    { key: 'all', label: 'All' },
]

type Form = { assignedToId: string; title: string; priority: Priority; dueDate: string }
type Errors = Partial<Record<keyof Form, string>>
const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const AssignModal = ({ staff, onClose, onDone }: { staff: StaffOption[]; onClose: () => void; onDone: (message: string) => void }) => {
    const [form, setForm] = useState<Form>({ assignedToId: '', title: '', priority: 'medium', dueDate: addDaysTZ(7) })
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm((p) => ({ ...p, [name]: value }))
        if (errors[name as keyof Form]) setErrors((p) => ({ ...p, [name]: undefined }))
        setServerError('')
    }

    const save = async () => {
        const found: Errors = {}
        if (!form.assignedToId) found.assignedToId = 'Choose an employee.'
        if (form.title.trim().length < 3) found.title = 'Enter the task (at least 3 characters).'
        if (!form.dueDate) found.dueDate = 'Choose the due date.'
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        try {
            await assignTask({ assignedToId: Number(form.assignedToId), title: form.title.trim(), priority: form.priority, dueDate: form.dueDate })
            onDone('Task assigned. The employee was notified.')
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not assign the task.'))
            setSaving(false)
        }
    }

    const cls = (k: keyof Form) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <ModalShell title="Assign a task" onClose={onClose}>
            <div className="space-y-4">
                {serverError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}
                <div>
                    <label htmlFor="assignedToId" className="mb-1 block text-xs font-medium text-gray-600">
                        Employee
                    </label>
                    <select id="assignedToId" name="assignedToId" value={form.assignedToId} onChange={change} className={cls('assignedToId')}>
                        <option value="">Select...</option>
                        {staff.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.position})
                            </option>
                        ))}
                    </select>
                    {errors.assignedToId && <p className="mt-1 text-xs text-red-600">{errors.assignedToId}</p>}
                </div>
                <div>
                    <label htmlFor="title" className="mb-1 block text-xs font-medium text-gray-600">
                        Task
                    </label>
                    <input id="title" name="title" value={form.title} onChange={change} maxLength={150} placeholder="Prepare the monthly finance report" className={cls('title')} />
                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="priority" className="mb-1 block text-xs font-medium text-gray-600">
                            Priority
                        </label>
                        <select id="priority" name="priority" value={form.priority} onChange={change} className={cls('priority')}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="mb-1 block text-xs font-medium text-gray-600">
                            Due date
                        </label>
                        <input id="dueDate" name="dueDate" type="date" value={form.dueDate} onChange={change} className={cls('dueDate')} />
                        {errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate}</p>}
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void save()}
                        disabled={saving}
                        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                    >
                        {saving ? 'Assigning...' : 'Assign task'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

const TasksManager = () => {
    const [tab, setTab] = useState<Tab>('submitted')
    const [reviewId, setReviewId] = useState<number | null>(null)
    const [employeeId, setEmployeeId] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)
    const [data, setData] = useState<AdminTaskList | null>(null)
    const [staff, setStaff] = useState<StaffOption[]>([])
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [assigning, setAssigning] = useState(false)
    const [armedId, setArmedId] = useState<number | null>(null)
    const armTimer = useRef<number | undefined>(undefined)

    useEffect(() => {
        listStaff()
            .then(setStaff)
            .catch(() => undefined)
        return () => window.clearTimeout(armTimer.current)
    }, [])

    useEffect(() => {
        let cancelled = false
        listAdminTasks({
            status: tab === 'all' ? undefined : tab,
            employeeId: employeeId ? Number(employeeId) : undefined,
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
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the tasks.'))
            })
        return () => {
            cancelled = true
        }
    }, [tab, employeeId, page, reloadKey])

    useEffect(() => {
        if (data && data.tasks.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const refresh = () => setReloadKey((k) => k + 1)

    const remove = async (id: number) => {
        if (armedId !== id) {
            setArmedId(id)
            window.clearTimeout(armTimer.current)
            armTimer.current = window.setTimeout(() => setArmedId(null), 4000)
            return
        }
        setArmedId(null)
        try {
            await deleteTask(id)
            setNotice('Task deleted.')
            refresh()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the task.'))
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

    return (
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
                        {data && t.key !== 'all' && <span className="ml-1.5 text-xs opacity-80">{data.counts[t.key]}</span>}
                    </button>
                ))}
                <select
                    value={employeeId}
                    onChange={(e) => {
                        setEmployeeId(e.target.value)
                        setPage(1)
                    }}
                    aria-label="Filter by employee"
                    className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
                >
                    <option value="">All employees</option>
                    {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={() => {
                        setNotice('')
                        setAssigning(true)
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-1.5 text-sm font-semibold text-green-950 hover:bg-amber-300"
                >
                    <FaPlus className="h-3 w-3" /> Assign a task
                </button>
            </div>

            {notice && (
                <p role="status" className="mt-3 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
                    {notice}
                </p>
            )}
            {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <ul className="mt-3 divide-y divide-gray-100">
                {!data && !error && <li className="py-8 text-center text-sm text-gray-500">Loading...</li>}
                {data && data.tasks.length === 0 && <li className="py-8 text-center text-sm text-gray-500">No tasks here. Click "Assign a task".</li>}
                {data?.tasks.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-green-950">{t.title}</p>
                            <p className="text-xs text-gray-500">
                                {t.employee} · due {dayShort(t.dueDate)}
                                {t.overdue && <span className="font-semibold text-red-700"> (overdue)</span>} · assigned by {t.assignedBy}
                            </p>
                        </div>
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${priorityTag[t.priority]}`}>{priorityLabel[t.priority]}</span>
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${taskStatusTag[t.status]}`}>{taskStatusLabel[t.status]}</span>
                        <button
                            type="button"
                            onClick={() => setReviewId(t.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${t.status === 'submitted' ? 'bg-amber-400 text-green-950 hover:bg-amber-300' : 'border border-green-900 text-green-900 hover:bg-green-50'
                                }`}
                        >
                            {t.status === 'submitted' ? 'Review' : 'Open'}
                            {t.submissions > 0 && <span className="ml-1 opacity-70">({t.submissions} file{t.submissions === 1 ? '' : 's'})</span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => void remove(t.id)}
                            aria-label={`Delete ${t.title}`}
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium ${armedId === t.id ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                }`}
                        >
                            <FaTrash className="h-3 w-3" />
                            {armedId === t.id ? 'Confirm' : ''}
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
                        <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1} className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40">
                            Previous
                        </button>
                        <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40">
                            Next
                        </button>
                    </div>
                </div>
            )}

            {reviewId !== null && (
                <TaskReviewModal
                    taskId={reviewId}
                    onClose={() => setReviewId(null)}
                    onChanged={() => {
                        setNotice('')
                        refresh()
                    }}
                />
            )}

            {assigning && (
                <AssignModal
                    staff={staff}
                    onClose={() => setAssigning(false)}
                    onDone={(message) => {
                        setAssigning(false)
                        setNotice(message)
                        refresh()
                    }}
                />
            )}
        </section>
    )
}

export default TasksManager

