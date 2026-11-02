import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa'
import TimetableView from '../../components/TimetableView'
import { getErrorMessage } from '../../services/api'
import { addSlot, deleteSlot, getOverview, listTimetable, updateSlot } from '../../services/lecturer'
import type { LecturerCourse } from '../../services/lecturer'
import { weekdayNames } from '../../services/timetable'
import type { Slot } from '../../services/timetable'
import ModalShell from '../admin/users/ModalShell'

type Form = { courseId: string; weekday: string; startTime: string; endTime: string; room: string }
type Errors = Partial<Record<keyof Form, string>>

const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const SlotModal = ({
    courses,
    slot,
    onClose,
    onSaved,
}: {
    courses: LecturerCourse[]
    slot: Slot | null
    onClose: () => void
    onSaved: (message: string) => void
}) => {
    const [form, setForm] = useState<Form>({
        courseId: String(slot?.courseId ?? courses[0]?.id ?? ''),
        weekday: String(slot?.weekday ?? 1),
        startTime: slot?.startTime ?? '08:00',
        endTime: slot?.endTime ?? '10:00',
        room: slot?.room ?? '',
    })
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const save = async () => {
        const found: Errors = {}
        if (!form.courseId) found.courseId = 'Choose the course.'
        if (!form.startTime) found.startTime = 'Choose the start time.'
        if (!form.endTime) found.endTime = 'Choose the end time.'
        else if (form.startTime && form.endTime <= form.startTime) found.endTime = 'The end time must be after the start time.'
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        const data = {
            weekday: Number(form.weekday),
            startTime: form.startTime,
            endTime: form.endTime,
            room: form.room.trim(),
        }
        try {
            if (slot) await updateSlot(slot.id, data)
            else await addSlot(Number(form.courseId), data)
            onSaved(slot ? 'Class time updated.' : 'Class time added.')
        } catch (err) {
            setServerError(getErrorMessage(err, 'Could not save the class time.'))
            setSaving(false)
        }
    }

    const cls = (k: keyof Form) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <ModalShell title={slot ? 'Edit class time' : 'Add class time'} onClose={onClose}>
            <div className="space-y-4">
                {serverError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}
                <div>
                    <label htmlFor="courseId" className="mb-1 block text-xs font-medium text-gray-600">
                        Course
                    </label>
                    <select id="courseId" name="courseId" value={form.courseId} onChange={change} disabled={!!slot} className={`${cls('courseId')} disabled:bg-gray-100`}>
                        {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.code} {c.title}
                            </option>
                        ))}
                    </select>
                    {slot && <p className="mt-1 text-xs text-gray-500">The course of a class time cannot be changed. Delete it and add a new one.</p>}
                    {errors.courseId && <p className="mt-1 text-xs text-red-600">{errors.courseId}</p>}
                </div>
                <div>
                    <label htmlFor="weekday" className="mb-1 block text-xs font-medium text-gray-600">
                        Day
                    </label>
                    <select id="weekday" name="weekday" value={form.weekday} onChange={change} className={cls('weekday')}>
                        {weekdayNames.map((n, i) => (
                            <option key={n} value={i + 1}>
                                {n}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="startTime" className="mb-1 block text-xs font-medium text-gray-600">
                            Starts
                        </label>
                        <input id="startTime" name="startTime" type="time" value={form.startTime} onChange={change} className={cls('startTime')} />
                        {errors.startTime && <p className="mt-1 text-xs text-red-600">{errors.startTime}</p>}
                    </div>
                    <div>
                        <label htmlFor="endTime" className="mb-1 block text-xs font-medium text-gray-600">
                            Ends
                        </label>
                        <input id="endTime" name="endTime" type="time" value={form.endTime} onChange={change} className={cls('endTime')} />
                        {errors.endTime && <p className="mt-1 text-xs text-red-600">{errors.endTime}</p>}
                    </div>
                </div>
                <div>
                    <label htmlFor="room" className="mb-1 block text-xs font-medium text-gray-600">
                        Room (optional)
                    </label>
                    <input id="room" name="room" value={form.room} onChange={change} maxLength={40} placeholder="Room 3" className={cls('room')} />
                </div>
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
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

const LecturerTimetable = () => {
    const [slots, setSlots] = useState<Slot[] | null>(null)
    const [courses, setCourses] = useState<LecturerCourse[]>([])
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [modal, setModal] = useState<{ slot: Slot | null } | null>(null)
    const [armedId, setArmedId] = useState<number | null>(null)

    const load = useCallback(async () => {
        try {
            const [s, o] = await Promise.all([listTimetable(), getOverview()])
            setSlots(s)
            setCourses(o.courses)
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load your timetable.'))
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    // The "Confirm" state of a delete button goes back after 4 seconds
    useEffect(() => {
        if (armedId === null) return
        const t = window.setTimeout(() => setArmedId(null), 4000)
        return () => window.clearTimeout(t)
    }, [armedId])

    const remove = async (slot: Slot) => {
        if (armedId !== slot.id) {
            setArmedId(slot.id)
            return
        }
        setArmedId(null)
        try {
            await deleteSlot(slot.id)
            setNotice('Class time deleted.')
            await load()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the class time.'))
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">Timetable</h1>
                    <p className="text-sm text-gray-500">The weekly times of your courses. Your students see them in their own timetable.</p>
                </div>
                <button
                    type="button"
                    disabled={courses.length === 0}
                    onClick={() => {
                        setNotice('')
                        setModal({ slot: null })
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-50"
                >
                    <FaPlus className="h-3 w-3" /> Add class time
                </button>
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
            {slots && courses.length === 0 && (
                <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                    No courses are assigned to you yet, so there is nothing to schedule. Ask the administrator to assign you to a course.
                </p>
            )}
            {!slots && !error && <p className="py-8 text-center text-sm text-gray-500">Loading your timetable...</p>}

            {slots && courses.length > 0 && (
                <TimetableView
                    slots={slots}
                    emptyText="You have not set any class times yet. Click Add class time."
                    renderActions={(s) => (
                        <span className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setNotice('')
                                    setModal({ slot: s })
                                }}
                                aria-label={`Edit ${s.courseCode} class time`}
                                title="Edit"
                                className="rounded-md border border-amber-500 p-1.5 text-amber-700 hover:bg-amber-50"
                            >
                                <FaEdit className="h-3 w-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => void remove(s)}
                                aria-label={`Delete ${s.courseCode} class time`}
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${armedId === s.id ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                    }`}
                            >
                                <FaTrash className="h-3 w-3" />
                                {armedId === s.id ? 'Confirm' : ''}
                            </button>
                        </span>
                    )}
                />
            )}

            {modal && (
                <SlotModal
                    courses={courses}
                    slot={modal.slot}
                    onClose={() => setModal(null)}
                    onSaved={(message) => {
                        setModal(null)
                        setNotice(message)
                        void load()
                    }}
                />
            )}
        </div>
    )
}

export default LecturerTimetable
