import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../services/api'
import {
    addDaysTZ,
    createAssignment,
    dayTZ,
    deleteAssignment,
    updateAssignment,
} from '../../services/lecturer'
import type { AssignmentRow } from '../../services/lecturer'
import ModalShell from '../admin/users/ModalShell'

type Form = { title: string; description: string; dueDate: string; maxScore: string }
type Errors = Partial<Record<keyof Form, string>>

const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const validate = (f: Form): Errors => {
    const e: Errors = {}
    if (f.title.trim().length < 3) e.title = 'Enter a title (at least 3 characters).'
    if (!f.dueDate) e.dueDate = 'Choose the due date.'
    const max = Number(f.maxScore)
    if (!f.maxScore.trim() || !Number.isInteger(max) || max < 1 || max > 1000) e.maxScore = 'Enter a whole number from 1 to 1000.'
    return e
}

const AssignmentModal = ({
    courseCode,
    assignment,
    onClose,
    onSave,
}: {
    courseCode: string
    assignment: AssignmentRow | null
    onClose: () => void
    onSave: (data: { title: string; description: string; dueDate: string; maxScore: number }) => Promise<void>
}) => {
    const [form, setForm] = useState<Form>({
        title: assignment?.title ?? '',
        description: assignment?.description ?? '',
        dueDate: assignment ? dayTZ(assignment.dueDate) : addDaysTZ(7),
        maxScore: assignment ? String(assignment.maxScore) : '20',
    })
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)

    const change = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const save = async () => {
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return
        setSaving(true)
        setServerError('')
        try {
            await onSave({
                title: form.title.trim(),
                description: form.description.trim(),
                dueDate: form.dueDate,
                maxScore: Number(form.maxScore),
            })
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not save the assignment.'))
            setSaving(false)
        }
    }

    const cls = (k: keyof Form) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <ModalShell title={assignment ? 'Edit assignment' : 'New assignment'} subtitle={courseCode} onClose={onClose}>
            <div className="space-y-4">
                {serverError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}
                <div>
                    <label htmlFor="title" className="mb-1 block text-xs font-medium text-gray-600">
                        Title
                    </label>
                    <input id="title" name="title" value={form.title} onChange={change} maxLength={120} placeholder="Field report 1" className={cls('title')} />
                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </div>
                <div>
                    <label htmlFor="description" className="mb-1 block text-xs font-medium text-gray-600">
                        Instructions (optional)
                    </label>
                    <textarea id="description" name="description" rows={3} value={form.description} onChange={change} maxLength={1000} className={`${cls('description')} resize-none`} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="dueDate" className="mb-1 block text-xs font-medium text-gray-600">
                            Due date
                        </label>
                        <input id="dueDate" name="dueDate" type="date" value={form.dueDate} onChange={change} className={cls('dueDate')} />
                        {errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate}</p>}
                    </div>
                    <div>
                        <label htmlFor="maxScore" className="mb-1 block text-xs font-medium text-gray-600">
                            Maximum score
                        </label>
                        <input id="maxScore" name="maxScore" inputMode="numeric" value={form.maxScore} onChange={change} className={cls('maxScore')} />
                        {errors.maxScore && <p className="mt-1 text-xs text-red-600">{errors.maxScore}</p>}
                    </div>
                </div>
                {!assignment && <p className="text-xs text-gray-500">The students of this course get a notification about the new assignment.</p>}
                <div className="flex justify-end gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void save()}
                        disabled={saving}
                        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : assignment ? 'Save changes' : 'Create assignment'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

const AssignmentsPanel = ({
    courseId,
    courseCode,
    assignments,
    onChanged,
}: {
    courseId: number
    courseCode: string
    assignments: AssignmentRow[]
    onChanged: () => void
}) => {
    const [modal, setModal] = useState<{ assignment: AssignmentRow | null } | null>(null)
    const [armedId, setArmedId] = useState<number | null>(null)
    const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null)
    const armTimer = useRef<number | undefined>(undefined)

    useEffect(() => () => window.clearTimeout(armTimer.current), [])

    const remove = async (a: AssignmentRow) => {
        if (armedId !== a.id) {
            setArmedId(a.id)
            window.clearTimeout(armTimer.current)
            armTimer.current = window.setTimeout(() => setArmedId(null), 4000)
            return
        }
        setArmedId(null)
        try {
            await deleteAssignment(a.id)
            setNote({ text: 'Assignment deleted.', bad: false })
            onChanged()
        } catch (err) {
            setNote({ text: getErrorMessage(err, 'Could not delete the assignment.'), bad: true })
        }
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-green-950">Assignments</h2>
                    <p className="text-xs text-gray-500">{courseCode}</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setNote(null)
                        setModal({ assignment: null })
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-green-950 hover:bg-amber-300"
                >
                    <FaPlus className="h-3 w-3" /> New
                </button>
            </div>

            {note && (
                <p
                    role={note.bad ? 'alert' : 'status'}
                    className={`mt-3 rounded-lg px-3 py-2 text-sm ${note.bad ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}
                >
                    {note.text}
                </p>
            )}

            <ul className="mt-2 divide-y divide-gray-100">
                {assignments.length === 0 && <li className="py-6 text-center text-sm text-gray-500">No assignments yet.</li>}
                {assignments.map((a) => {
                    const pastDue = new Date(a.dueDate).getTime() < Date.now()
                    const pct = a.enrolled > 0 ? Math.round((a.graded / a.enrolled) * 100) : 0
                    return (
                        <li key={a.id} className="py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium text-green-950">
                                    {a.title} <span className="text-xs font-normal text-gray-500">(out of {a.maxScore})</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    {pastDue && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">Past due</span>}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNote(null)
                                            setModal({ assignment: a })
                                        }}
                                        aria-label={`Edit ${a.title}`}
                                        title="Edit"
                                        className="rounded-md border border-amber-500 p-1.5 text-amber-700 hover:bg-amber-50"
                                    >
                                        <FaEdit className="h-3 w-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void remove(a)}
                                        aria-label={`Delete ${a.title}`}
                                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${armedId === a.id ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                            }`}
                                    >
                                        <FaTrash className="h-3 w-3" />
                                        {armedId === a.id ? 'Confirm' : ''}
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Due {new Date(a.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
                                {a.graded} of {a.enrolled} graded
                            </p>
                            {a.description && <p className="mt-1 text-xs text-gray-600">{a.description}</p>}
                            <div className="mt-2 h-1.5 rounded bg-gray-100" role="progressbar" aria-label="Graded" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                                <div className="h-1.5 rounded bg-green-900" style={{ width: `${pct}%` }} />
                            </div>
                        </li>
                    )
                })}
            </ul>

            {modal && (
                <AssignmentModal
                    courseCode={courseCode}
                    assignment={modal.assignment}
                    onClose={() => setModal(null)}
                    onSave={async (data) => {
                        if (modal.assignment) await updateAssignment(modal.assignment.id, data)
                        else await createAssignment(courseId, data)
                        setNote({ text: modal.assignment ? 'Assignment updated.' : 'Assignment created. The students were notified.', bad: false })
                        setModal(null)
                        onChanged()
                    }}
                />
            )}
        </section>
    )
}

export default AssignmentsPanel
