import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { getUser, listDepartments, updateUser } from '../../../services/users'
import type { Department, UserDetail, UserStatus, UserUpdate } from '../../../services/users'
import ModalShell from './ModalShell'
import { roleLabel } from './userLabels'

type Form = {
    fullName: string
    email: string
    phone: string
    gender: '' | 'female' | 'male'
    status: UserStatus
    regNumber: string
    programme: string
    yearOfStudy: string
    staffId: string
    departmentId: string
    qualification: string
    position: string
}

type Errors = Partial<Record<keyof Form | 'profile', string>>

const inputBase =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-500'

const toForm = (u: UserDetail): Form => ({
    fullName: u.fullName,
    email: u.email,
    phone: u.phone ?? '',
    gender: u.gender ?? '',
    status: u.status,
    regNumber: u.student?.regNumber ?? '',
    programme: u.student?.programme ?? '',
    yearOfStudy: u.student?.yearOfStudy ?? '',
    staffId: u.lecturer?.staffId ?? u.employee?.staffId ?? '',
    departmentId: String(u.lecturer?.department.id ?? u.employee?.department.id ?? ''),
    qualification: u.lecturer?.qualification ?? '',
    position: u.employee?.position ?? '',
})

const validate = (f: Form, user: UserDetail): Errors => {
    const e: Errors = {}
    if (f.fullName.trim().length < 2) e.fullName = 'Enter the full name.'
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address.'
    if (f.phone.trim() && !/^[+\d\s-]{9,16}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.'
    if (user.student && f.regNumber.trim().length < 3) e.regNumber = 'Registration number is too short.'
    if ((user.lecturer || user.employee) && f.staffId.trim().length < 3) e.staffId = 'Staff ID is too short.'
    if ((user.lecturer || user.employee) && !f.departmentId) e.departmentId = 'Choose a department.'
    if (user.employee && f.position.trim().length < 2) e.position = 'Position is too short.'
    return e
}

const UserEditModal = ({
    userId,
    currentUserId,
    onClose,
    onSaved,
}: {
    userId: number
    currentUserId: number | undefined
    onClose: () => void
    onSaved: () => void
}) => {
    const [user, setUser] = useState<UserDetail | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [form, setForm] = useState<Form | null>(null)
    const [errors, setErrors] = useState<Errors>({})
    const [loadError, setLoadError] = useState('')
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let cancelled = false
        Promise.all([getUser(userId), listDepartments()])
            .then(([u, d]) => {
                if (cancelled) return
                setUser(u)
                setDepartments(d)
                setForm(toForm(u))
            })
            .catch((err) => {
                if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this user.'))
            })
        return () => {
            cancelled = true
        }
    }, [userId])

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm((prev) => (prev ? { ...prev, [name]: value } : prev))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const save = async () => {
        if (!form || !user) return
        const found = validate(form, user)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        const payload: UserUpdate = {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            gender: form.gender,
            status: form.status,
        }
        if (user.student) {
            payload.profile = {
                regNumber: form.regNumber.trim(),
                programme: form.programme.trim(),
                yearOfStudy: form.yearOfStudy.trim(),
            }
        } else if (user.lecturer) {
            payload.profile = {
                staffId: form.staffId.trim(),
                departmentId: Number(form.departmentId),
                qualification: form.qualification.trim(),
            }
        } else if (user.employee) {
            payload.profile = {
                staffId: form.staffId.trim(),
                departmentId: Number(form.departmentId),
                position: form.position.trim(),
            }
        }

        setSaving(true)
        setServerError('')
        try {
            await updateUser(user.id, payload)
            onSaved()
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not save the changes.'))
        } finally {
            setSaving(false)
        }
    }

    const cls = (key: keyof Form) => `${inputBase} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`
    const isSelf = user?.id === currentUserId

    const field = (key: keyof Form, label: string, type = 'text') => (
        <div>
            <label htmlFor={key} className="mb-1 block text-xs font-medium text-gray-600">
                {label}
            </label>
            <input id={key} name={key} type={type} value={form?.[key] ?? ''} onChange={change} className={cls(key)} />
            {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
        </div>
    )

    const departmentField = form && (
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
    )

    return (
        <ModalShell title="Edit user" subtitle={user ? `${roleLabel[user.role]} account` : undefined} onClose={onClose} wide>
            {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
            {!form && !loadError && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}

            {form && user && (
                <div className="space-y-4">
                    {serverError && (
                        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {serverError}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        {field('fullName', 'Full name')}
                        {field('email', 'Email', 'email')}
                        {field('phone', 'Phone', 'tel')}
                        <div>
                            <label htmlFor="gender" className="mb-1 block text-xs font-medium text-gray-600">
                                Gender
                            </label>
                            <select id="gender" name="gender" value={form.gender} onChange={change} className={cls('gender')}>
                                <option value="">Not set</option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className="mb-1 block text-xs font-medium text-gray-600">
                                Account status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={form.status}
                                onChange={change}
                                disabled={isSelf}
                                className={cls('status')}
                            >
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                            </select>
                            {isSelf && <p className="mt-1 text-xs text-gray-500">You cannot change your own status.</p>}
                        </div>
                        <div>
                            <p className="mb-1 text-xs font-medium text-gray-600">Role</p>
                            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{roleLabel[user.role]}</p>
                            <p className="mt-1 text-xs text-gray-500">The role cannot be changed here.</p>
                        </div>
                    </div>

                    {user.student && (
                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="mb-3 text-sm font-semibold text-green-900">Student record</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {field('regNumber', 'Registration number')}
                                {field('programme', 'Programme')}
                                {field('yearOfStudy', 'Year of study')}
                            </div>
                        </div>
                    )}

                    {user.role === 'student' && !user.student && (
                        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
                            This student has no registration number yet. It is assigned when the application is approved.
                        </p>
                    )}

                    {user.lecturer && (
                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="mb-3 text-sm font-semibold text-green-900">Lecturer record</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {field('staffId', 'Staff ID')}
                                {departmentField}
                                {field('qualification', 'Qualification')}
                            </div>
                        </div>
                    )}

                    {user.employee && (
                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="mb-3 text-sm font-semibold text-green-900">Employee record</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {field('staffId', 'Staff ID')}
                                {departmentField}
                                {field('position', 'Position')}
                            </div>
                        </div>
                    )}

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
                            onClick={save}
                            disabled={saving}
                            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </div>
            )}
        </ModalShell>
    )
}

export default UserEditModal