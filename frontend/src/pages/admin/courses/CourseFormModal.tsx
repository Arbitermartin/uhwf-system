import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { createCourse, listLecturerOptions, updateCourse } from '../../../services/courses'
import type { CourseInput, CourseRow, LecturerOption } from '../../../services/courses'
import { listDepartments } from '../../../services/users'
import type { Department } from '../../../services/users'
import ModalShell from '../users/ModalShell'

type Form = {
    code: string
    title: string
    description: string
    credits: string
    departmentId: string
    lecturerId: string
    isActive: boolean
}
type Errors = Partial<Record<keyof Form, string>>

const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const toForm = (c: CourseRow | null): Form => ({
    code: c?.code ?? '',
    title: c?.title ?? '',
    description: c?.description ?? '',
    credits: c ? String(c.credits) : '3',
    departmentId: c ? String(c.department.id) : '',
    lecturerId: c?.lecturer ? String(c.lecturer.id) : '',
    isActive: c?.isActive ?? true,
})

const validate = (f: Form): Errors => {
    const e: Errors = {}
    if (!/^[A-Za-z0-9]{3,12}$/.test(f.code.trim())) e.code = 'Use 3 to 12 letters or digits, for example WLM101.'
    if (f.title.trim().length < 3) e.title = 'Enter the course title.'
    const credits = Number(f.credits)
    if (!f.credits.trim() || !Number.isInteger(credits) || credits < 1 || credits > 20) {
        e.credits = 'Enter a whole number from 1 to 20.'
    }
    if (!f.departmentId) e.departmentId = 'Choose a department.'
    return e
}

// One window for both "Add course" (course = null) and "Edit course".
const CourseFormModal = ({
    course,
    onClose,
    onSaved,
}: {
    course: CourseRow | null
    onClose: () => void
    onSaved: (message: string) => void
}) => {
    const [form, setForm] = useState<Form>(toForm(course))
    const [errors, setErrors] = useState<Errors>({})
    const [departments, setDepartments] = useState<Department[]>([])
    const [lecturers, setLecturers] = useState<LecturerOption[]>([])
    const [optionsError, setOptionsError] = useState('')
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let cancelled = false
        Promise.all([listDepartments(), listLecturerOptions()])
            .then(([d, l]) => {
                if (cancelled) return
                setDepartments(d)
                setLecturers(l)
            })
            .catch((err) => {
                if (!cancelled) setOptionsError(getErrorMessage(err, 'Could not load departments and lecturers.'))
            })
        return () => {
            cancelled = true
        }
    }, [])

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const save = async () => {
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        const data: CourseInput = {
            code: form.code.trim().toUpperCase(),
            title: form.title.trim(),
            description: form.description.trim(),
            credits: Number(form.credits),
            departmentId: Number(form.departmentId),
            lecturerId: form.lecturerId ? Number(form.lecturerId) : null,
            isActive: form.isActive,
        }

        setSaving(true)
        setServerError('')
        try {
            const saved = course ? await updateCourse(course.id, data) : await createCourse(data)
            onSaved(course ? `Course ${saved.code} updated.` : `Course ${saved.code} created.`)
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not save the course.'))
        } finally {
            setSaving(false)
        }
    }

    const cls = (key: keyof Form) => `${inputBase} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <ModalShell title={course ? `Edit ${course.code}` : 'Add course'} onClose={onClose} wide>
            <div className="space-y-4">
                {(serverError || optionsError) && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError || optionsError}
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <label htmlFor="code" className="mb-1 block text-xs font-medium text-gray-600">
                            Course code
                        </label>
                        <input id="code" name="code" value={form.code} onChange={change} placeholder="WLM101" maxLength={12} className={cls('code')} />
                        {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="title" className="mb-1 block text-xs font-medium text-gray-600">
                            Title
                        </label>
                        <input id="title" name="title" value={form.title} onChange={change} placeholder="Wildlife management basics" maxLength={120} className={cls('title')} />
                        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="mb-1 block text-xs font-medium text-gray-600">
                        Description (optional)
                    </label>
                    <textarea id="description" name="description" rows={3} value={form.description} onChange={change} maxLength={1000} className={`${cls('description')} resize-none`} />
                    {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <label htmlFor="credits" className="mb-1 block text-xs font-medium text-gray-600">
                            Credits
                        </label>
                        <input id="credits" name="credits" inputMode="numeric" value={form.credits} onChange={change} className={cls('credits')} />
                        {errors.credits && <p className="mt-1 text-xs text-red-600">{errors.credits}</p>}
                    </div>
                    <div>
                        <label htmlFor="departmentId" className="mb-1 block text-xs font-medium text-gray-600">
                            Department
                        </label>
                        <select id="departmentId" name="departmentId" value={form.departmentId} onChange={change} className={cls('departmentId')}>
                            <option value="">Select...</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                        {errors.departmentId && <p className="mt-1 text-xs text-red-600">{errors.departmentId}</p>}
                    </div>
                    <div>
                        <label htmlFor="lecturerId" className="mb-1 block text-xs font-medium text-gray-600">
                            Taught by
                        </label>
                        <select id="lecturerId" name="lecturerId" value={form.lecturerId} onChange={change} className={cls('lecturerId')}>
                            <option value="">Not assigned</option>
                            {lecturers.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name} ({l.staffId})
                                </option>
                            ))}
                        </select>
                        {errors.lecturerId && <p className="mt-1 text-xs text-red-600">{errors.lecturerId}</p>}
                    </div>
                </div>

                <label className="flex items-start gap-3 rounded-lg bg-green-50 p-3 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 accent-green-700"
                    />
                    <span>
                        <span className="font-medium text-green-950">Open for students to choose</span>
                        <span className="block text-xs text-gray-600">
                            Turn this off to hide the course from new applicants. Students already enrolled keep it.
                        </span>
                    </span>
                </label>

                <div className="flex justify-end gap-3 pt-2">
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
                        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : course ? 'Save changes' : 'Create course'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

export default CourseFormModal
