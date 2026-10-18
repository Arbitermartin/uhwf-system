import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaCheckCircle, FaCopy, FaEye, FaEyeSlash, FaMagic } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { createUser, listDepartments } from '../../../services/users'
import type { CreatableRole, Department, UserCreate, UserDetail } from '../../../services/users'
import ModalShell from './ModalShell'
import { roleLabel } from './userLabels'

type Form = {
    role: CreatableRole
    fullName: string
    email: string
    phone: string
    gender: '' | 'female' | 'male'
    password: string
    staffId: string
    departmentId: string
    qualification: string
    position: string
}

type Errors = Partial<Record<keyof Form, string>>

const roleOptions: { value: CreatableRole; label: string }[] = [
    { value: 'lecturer', label: roleLabel.lecturer },
    { value: 'employee', label: roleLabel.employee },
    { value: 'ict', label: 'ICT officer' },
    { value: 'admin', label: roleLabel.admin },
]

const inputBase =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

// Unbiased random number below max, using the browser's secure random generator
const randomInt = (max: number) => {
    const buf = new Uint32Array(1)
    const limit = Math.floor(0x100000000 / max) * max
    let x: number
    do {
        crypto.getRandomValues(buf)
        x = buf[0]
    } while (x >= limit)
    return x % max
}

// 12 characters with upper case, lower case and digits. Look-alike characters (0 O 1 l I) are left out.
const generatePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghijkmnopqrstuvwxyz'
    const digits = '23456789'
    const all = upper + lower + digits
    const pick = (set: string) => set[randomInt(set.length)]
    const chars = [pick(upper), pick(lower), pick(digits)]
    while (chars.length < 12) chars.push(pick(all))
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1)
            ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    return chars.join('')
}

const validate = (f: Form): Errors => {
    const e: Errors = {}
    if (f.fullName.trim().length < 2) e.fullName = 'Enter the full name.'
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address.'
    if (f.phone.trim() && !/^[+\d\s-]{9,16}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.'
    if (f.password.length < 8) e.password = 'Use at least 8 characters.'
    else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Use letters and numbers.'
    if (f.role === 'lecturer' || f.role === 'employee') {
        if (f.staffId.trim().length < 3) e.staffId = 'Staff ID is too short.'
        if (!f.departmentId) e.departmentId = 'Choose a department.'
    }
    if (f.role === 'employee' && f.position.trim().length < 2) e.position = 'Position is too short.'
    return e
}

const AddUserModal = ({
    defaultRole,
    onClose,
    onCreated,
}: {
    defaultRole?: CreatableRole
    onClose: () => void
    onCreated: (user: UserDetail) => void
}) => {
    const [form, setForm] = useState<Form>({
        role: defaultRole ?? 'lecturer',
        fullName: '',
        email: '',
        phone: '',
        gender: '',
        password: generatePassword(),
        staffId: '',
        departmentId: '',
        qualification: '',
        position: '',
    })
    const [errors, setErrors] = useState<Errors>({})
    const [departments, setDepartments] = useState<Department[]>([])
    const [departmentsError, setDepartmentsError] = useState('')
    const [showPassword, setShowPassword] = useState(true)
    const [saving, setSaving] = useState(false)
    const [serverError, setServerError] = useState('')
    const [created, setCreated] = useState<{ user: UserDetail; password: string } | null>(null)
    const [copyNote, setCopyNote] = useState('')

    useEffect(() => {
        let cancelled = false
        listDepartments()
            .then((d) => {
                if (!cancelled) setDepartments(d)
            })
            .catch((err) => {
                if (!cancelled) setDepartmentsError(getErrorMessage(err, 'Could not load departments.'))
            })
        return () => {
            cancelled = true
        }
    }, [])

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const save = async () => {
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        const payload: UserCreate = {
            role: form.role,
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            gender: form.gender,
            password: form.password,
        }
        if (form.role === 'lecturer') {
            payload.staffId = form.staffId.trim()
            payload.departmentId = Number(form.departmentId)
            payload.qualification = form.qualification.trim()
        } else if (form.role === 'employee') {
            payload.staffId = form.staffId.trim()
            payload.departmentId = Number(form.departmentId)
            payload.position = form.position.trim()
        }

        setSaving(true)
        setServerError('')
        try {
            const user = await createUser(payload)
            setCreated({ user, password: form.password })
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not create the account.'))
        } finally {
            setSaving(false)
        }
    }

    const copyCredentials = async () => {
        if (!created) return
        try {
            await navigator.clipboard.writeText(`Email: ${created.user.email}\nPassword: ${created.password}`)
            setCopyNote('Copied.')
        } catch {
            setCopyNote('Could not copy. Select the password and copy it by hand.')
        }
    }

    const finish = () => {
        if (created) onCreated(created.user)
    }

    const cls = (key: keyof Form) => `${inputBase} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`

    const field = (key: keyof Form, label: string, type = 'text', placeholder?: string) => (
        <div>
            <label htmlFor={key} className="mb-1 block text-xs font-medium text-gray-600">
                {label}
            </label>
            <input
                id={key}
                name={key}
                type={type}
                value={form[key]}
                onChange={change}
                placeholder={placeholder}
                className={cls(key)}
            />
            {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
        </div>
    )

    const departmentField = (
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
            {departmentsError && <p className="mt-1 text-xs text-red-600">{departmentsError}</p>}
        </div>
    )

    /* ---------- Step 2: the account exists. Show the password once. ---------- */
    if (created) {
        return (
            <ModalShell title="Account created" onClose={finish}>
                <div className="text-center">
                    <FaCheckCircle className="mx-auto h-12 w-12 text-green-600" />
                    <p className="mt-3 font-semibold text-green-950">{created.user.fullName}</p>
                    <p className="text-sm text-gray-500">{roleLabel[created.user.role]}</p>
                </div>

                <dl className="mt-5 space-y-3 rounded-lg bg-green-50 p-4 text-sm">
                    <div>
                        <dt className="text-xs text-gray-500">Email (sign-in name)</dt>
                        <dd className="font-medium text-green-950">{created.user.email}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500">Temporary password</dt>
                        <dd>
                            <input
                                readOnly
                                value={created.password}
                                aria-label="Temporary password"
                                onFocus={(e) => e.currentTarget.select()}
                                className="w-full rounded-md border border-green-200 bg-white px-3 py-2 font-mono text-sm text-green-950"
                            />
                        </dd>
                    </div>
                </dl>

                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    This password is shown only now and cannot be looked up later. Share it securely, and ask the
                    user to change it after their first login.
                </p>
                {copyNote && (
                    <p role="status" className="mt-2 text-sm text-gray-600">
                        {copyNote}
                    </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={copyCredentials}
                        className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-5 py-2 text-sm font-medium text-green-900 hover:bg-green-50"
                    >
                        <FaCopy className="h-3.5 w-3.5" /> Copy
                    </button>
                    <button
                        type="button"
                        onClick={finish}
                        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                    >
                        Done
                    </button>
                </div>
            </ModalShell>
        )
    }

    /* ---------- Step 1: the form ---------- */
    return (
        <ModalShell
            title="Add user"
            subtitle="Create an account for staff. Students apply through the Admission page."
            onClose={onClose}
            wide
        >
            <div className="space-y-4">
                {serverError && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="role" className="mb-1 block text-xs font-medium text-gray-600">
                            Role
                        </label>
                        <select id="role" name="role" value={form.role} onChange={change} className={cls('role')}>
                            {roleOptions.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div />
                    {field('fullName', 'Full name', 'text', 'Juma Kimaro')}
                    {field('email', 'Email', 'email', 'name@uhwf.or.tz')}
                    {field('phone', 'Phone (optional)', 'tel', '+255 ...')}
                    <div>
                        <label htmlFor="gender" className="mb-1 block text-xs font-medium text-gray-600">
                            Gender (optional)
                        </label>
                        <select id="gender" name="gender" value={form.gender} onChange={change} className={cls('gender')}>
                            <option value="">Not set</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                        </select>
                    </div>
                </div>

                {form.role === 'lecturer' && (
                    <div className="border-t border-gray-100 pt-4">
                        <h3 className="mb-3 text-sm font-semibold text-green-900">Lecturer record</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {field('staffId', 'Staff ID', 'text', 'LEC-0002')}
                            {departmentField}
                            {field('qualification', 'Qualification (optional)', 'text', 'Masters')}
                        </div>
                    </div>
                )}

                {form.role === 'employee' && (
                    <div className="border-t border-gray-100 pt-4">
                        <h3 className="mb-3 text-sm font-semibold text-green-900">Employee record</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {field('staffId', 'Staff ID', 'text', 'EMP-0002')}
                            {departmentField}
                            {field('position', 'Position', 'text', 'Accountant')}
                        </div>
                    </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                    <label htmlFor="password" className="mb-1 block text-xs font-medium text-gray-600">
                        Temporary password
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={form.password}
                                onChange={change}
                                className={`${cls('password')} pr-10 font-mono`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-green-700"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setForm((prev) => ({ ...prev, password: generatePassword() }))
                                setErrors((prev) => ({ ...prev, password: undefined }))
                            }}
                            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50"
                        >
                            <FaMagic className="h-3.5 w-3.5" /> Generate
                        </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                    <p className="mt-1 text-xs text-gray-500">
                        A strong password is already filled in. You will see it once more after the account is created.
                    </p>
                </div>

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
                        {saving ? 'Creating...' : 'Create account'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

export default AddUserModal