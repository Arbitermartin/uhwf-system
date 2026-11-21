import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../../../services/api'
import { dayShort, listMyTasks, priorityLabel, priorityTag, startMyTask, taskStatusLabel, taskStatusTag } from '../../../services/staff'
import type { MyTask } from '../../../services/staff'
import TaskDetailModal from './TaskDetailModal'

type Filter = 'open' | 'done' | 'all'

const TasksPanel = ({ compact, onChanged }: { compact?: boolean; onChanged?: () => void }) => {
    const [filter, setFilter] = useState<Filter>('open')
    const [tasks, setTasks] = useState<MyTask[] | null>(null)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState<number | null>(null)
    const [openId, setOpenId] = useState<number | null>(null)

    const load = useCallback(async () => {
        try {
            setTasks(await listMyTasks(compact ? 'open' : filter))
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load your tasks.'))
        }
    }, [filter, compact])

    useEffect(() => {
        void load()
    }, [load])

    const start = async (task: MyTask) => {
        setBusyId(task.id)
        setError('')
        try {
            await startMyTask(task.id)
            await load()
            onChanged?.()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not start the task.'))
        } finally {
            setBusyId(null)
        }
    }

    const changed = () => {
        void load()
        onChanged?.()
    }

    const shown = compact ? (tasks ?? []).slice(0, 4) : (tasks ?? [])

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-green-950">My tasks</h2>
                    <p className="text-sm text-gray-500">Assigned to you by your supervisor. Hand in your work as a Word or PDF file.</p>
                </div>
                {compact && (
                    <Link to="/employee/tasks" className="shrink-0 text-sm font-medium text-green-800 hover:underline">
                        View all
                    </Link>
                )}
            </div>

            {!compact && (
                <div className="mt-3 flex gap-2">
                    {(['open', 'done', 'all'] as const).map((f) => (
                        <button
                            key={f}
                            type="button"
                            aria-pressed={filter === f}
                            onClick={() => setFilter(f)}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${filter === f ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                                }`}
                        >
                            {f === 'open' ? 'Open' : f === 'done' ? 'Accepted' : 'All'}
                        </button>
                    ))}
                </div>
            )}

            {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <ul className="mt-2 divide-y divide-gray-100">
                {!tasks && !error && <li className="py-6 text-center text-sm text-gray-500">Loading...</li>}
                {tasks && tasks.length === 0 && (
                    <li className="py-6 text-center text-sm text-gray-500">{filter === 'done' && !compact ? 'No accepted tasks yet.' : 'No open tasks. Well done.'}</li>
                )}
                {shown.map((t) => (
                    <li key={t.id} className="py-3">
                        <div className="flex items-start justify-between gap-3">
                            <p className={`font-medium ${t.status === 'done' ? 'text-gray-500' : 'text-green-950'}`}>{t.title}</p>
                            <span className={`shrink-0 rounded px-2.5 py-0.5 text-xs font-semibold ${priorityTag[t.priority]}`}>{priorityLabel[t.priority]}</span>
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-gray-500">
                            <span>
                                Due {dayShort(t.dueDate)}
                                {t.overdue && <span className="font-semibold text-red-700"> (overdue)</span>} · From {t.from}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${taskStatusTag[t.status]}`}>{taskStatusLabel[t.status]}</span>
                            {t.comments > 0 && (
                                <span className="text-xs font-medium text-purple-800">
                                    {t.comments} comment{t.comments === 1 ? '' : 's'}
                                </span>
                            )}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {t.status === 'todo' && (
                                <button
                                    type="button"
                                    disabled={busyId === t.id}
                                    onClick={() => void start(t)}
                                    className="rounded-lg border border-green-900 px-4 py-1.5 text-sm font-medium text-green-900 hover:bg-green-50 disabled:opacity-50"
                                >
                                    Start
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setOpenId(t.id)}
                                className={`rounded-lg px-4 py-1.5 text-sm font-medium ${t.status === 'in_progress' || t.status === 'returned'
                                    ? 'bg-amber-400 font-semibold text-green-950 hover:bg-amber-300'
                                    : 'border border-green-900 text-green-900 hover:bg-green-50'
                                    }`}
                            >
                                {t.status === 'in_progress' || t.status === 'returned' ? 'Hand in work' : t.status === 'todo' ? 'Open' : 'View'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {openId !== null && <TaskDetailModal taskId={openId} onClose={() => setOpenId(null)} onChanged={changed} />}
        </section>
    )
}

export default TasksPanel
