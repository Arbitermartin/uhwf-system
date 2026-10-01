import { useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
    FaUserGraduate,
    FaChalkboardTeacher,
    FaBriefcase,
    FaEye,
    FaEyeSlash,
    FaArrowLeft,
    FaCheck,
    FaCheckCircle,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'
import logo from '../../assets/uhwf-logo.webp'

type Role = 'student' | 'lecturer' | 'employee'

type RegisterForm = {
    role: Role | ''
    firstName: string
    lastName: string
    email: string
    phone: string
    gender: string
    idNumber: string
    unit: string
    extra: string
    password: string
    confirmPassword: string
    terms: boolean
}

type Errors = Partial<Record<keyof RegisterForm, string>>

type RoleField = {
    label: string
    placeholder?: string
    options?: string[] // if present, rendered as a dropdown
}

type RoleConfig = {
    label: string
    description: string
    icon: IconType
    idNumber: RoleField
    unit: RoleField
    extra: RoleField
}

const roleConfig: Record<Role, RoleConfig> = {
    student: {
        label: 'Student',
        description: 'Enroll in courses and track your learning.',
        icon: FaUserGraduate,
        idNumber: { label: 'Registration Number', placeholder: 'e.g. UHWF/2026/001' },
        unit: { label: 'Programme / Course of Study', placeholder: 'e.g. Wildlife Management' },
        extra: {
            label: 'Year of Study',
            options: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Other'],
        },
    },
    lecturer: {
        label: 'Lecturer',
        description: 'Teach courses and manage your students.',
        icon: FaChalkboardTeacher,
        idNumber: { label: 'Staff ID', placeholder: 'e.g. LEC-0012' },
        unit: { label: 'Department', placeholder: 'e.g. Land Use Planning' },
        extra: {
            label: 'Highest Qualification',
            options: ['Diploma', 'Bachelor', 'Masters', 'PhD', 'Other'],
        },
    },
    employee: {
        label: 'Employee',
        description: 'UHWF staff and administrative personnel.',
        icon: FaBriefcase,
        idNumber: { label: 'Staff ID', placeholder: 'e.g. EMP-0045' },
        unit: { label: 'Department / Unit', placeholder: 'e.g. Finance' },
        extra: { label: 'Position / Job Title', placeholder: 'e.g. Accountant' },
    },
}

const initialForm: RegisterForm = {
    role: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    idNumber: '',
    unit: '',
    extra: '',
    password: '',
    confirmPassword: '',
    terms: false,
}

const steps = ['Account Type', 'Your Details', 'Security']

const inputBase =
    'w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-green-500'

const passwordScore = (p: string) =>
    [
        p.length >= 8,
        /[a-z]/.test(p) && /[A-Z]/.test(p),
        /\d/.test(p),
        /[^A-Za-z0-9]/.test(p),
    ].filter(Boolean).length

const strengthLabel = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColor = ['bg-gray-200', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-600']

const validateStep = (step: number, f: RegisterForm): Errors => {
    const e: Errors = {}

    if (step === 0) {
        if (!f.role) e.role = 'Please choose an account type.'
    }

    if (step === 1) {
        if (f.firstName.trim().length < 2) e.firstName = 'Enter your first name.'
        if (f.lastName.trim().length < 2) e.lastName = 'Enter your last name.'
        if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.'
        if (!/^[+\d\s-]{9,16}$/.test(f.phone)) e.phone = 'Enter a valid phone number.'
        if (!f.gender) e.gender = 'Select your gender.'
        if (f.idNumber.trim().length < 3) e.idNumber = 'This field is required.'
        if (f.unit.trim().length < 2) e.unit = 'This field is required.'
        if (!f.extra.trim()) e.extra = 'This field is required.'
    }

    if (step === 2) {
        if (f.password.length < 8) e.password = 'Use at least 8 characters.'
        else if (passwordScore(f.password) < 3)
            e.password = 'Mix upper and lower case letters with numbers.'
        if (f.confirmPassword !== f.password) e.confirmPassword = 'Passwords do not match.'
        if (!f.terms) e.terms = 'You must accept the terms to continue.'
    }

    return e
}

const Field = ({
    id,
    label,
    error,
    children,
}: {
    id: string
    label: string
    error?: string
    children: ReactNode
}) => (
    <div>
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
            {label}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
)

const Register = () => {
    const [step, setStep] = useState(0)
    const [form, setForm] = useState<RegisterForm>(initialForm)
    const [errors, setErrors] = useState<Errors>({})
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [serverError, setServerError] = useState('')

    const config = form.role ? roleConfig[form.role] : null

    const setField = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked
        setField(
            name as keyof RegisterForm,
            (type === 'checkbox' ? checked : value) as never,
        )
    }

    const chooseRole = (role: Role) => {
        // Reset role-specific answers when the role changes
        setForm((prev) => ({ ...prev, role, idNumber: '', unit: '', extra: '' }))
        setErrors({})
    }

    const next = () => {
        const found = validateStep(step, form)
        setErrors(found)
        if (Object.keys(found).length === 0) setStep((s) => s + 1)
    }

    const back = () => {
        setErrors({})
        setStep((s) => s - 1)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const found = validateStep(2, form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setLoading(true)
        setServerError('')
        try {
            // TODO: connect to backend, e.g.
            // await axios.post('/api/auth/register', { ...form, confirmPassword: undefined, terms: undefined })
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setDone(true)
        } catch {
            setServerError('Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const cls = (key: keyof RegisterForm) =>
        `${inputBase} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`

    const renderRoleField = (key: 'idNumber' | 'unit' | 'extra') => {
        const def = config![key]
        return (
            <Field id={key} label={`${def.label} *`} error={errors[key]}>
                {def.options ? (
                    <select id={key} name={key} value={form[key]} onChange={handleChange} className={cls(key)}>
                        <option value="">Select...</option>
                        {def.options.map((o) => (
                            <option key={o} value={o}>
                                {o}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        id={key}
                        name={key}
                        type="text"
                        value={form[key]}
                        onChange={handleChange}
                        placeholder={def.placeholder}
                        className={cls(key)}
                    />
                )}
            </Field>
        )
    }

    const score = passwordScore(form.password)

    return (
        <div className="min-h-screen bg-green-50 px-4 py-8 sm:py-12">
            <div className="mx-auto w-full max-w-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo} alt="UHWF logo" className="h-10 w-auto" />
                        <span className="text-lg font-bold text-green-800">UHWF-TANZANIA</span>
                    </Link>
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-700"
                    >
                        <FaArrowLeft className="h-3 w-3" /> Back to website
                    </Link>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-md sm:p-10">
                    {done ? (
                        <div className="py-6 text-center">
                            <FaCheckCircle className="mx-auto h-16 w-16 text-green-600" />
                            <h1 className="mt-4 text-2xl font-bold text-gray-900">
                                Registration submitted
                            </h1>
                            <p className="mx-auto mt-2 max-w-md text-gray-600">
                                Thank you, {form.firstName}. Your {config?.label.toLowerCase()} account
                                request has been received. You can now sign in.
                            </p>
                            <Link
                                to="/login"
                                className="mt-6 inline-block rounded-lg bg-green-700 px-8 py-3 font-semibold text-white hover:bg-green-800"
                            >
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Join UHWF in three quick steps.
                            </p>

                            {/* Step indicator */}
                            <ol className="mt-6 flex items-center">
                                {steps.map((label, i) => (
                                    <li key={label} className="flex flex-1 items-center last:flex-none">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${i < step
                                                        ? 'bg-green-700 text-white'
                                                        : i === step
                                                            ? 'bg-green-100 text-green-800 ring-2 ring-green-600'
                                                            : 'bg-gray-100 text-gray-400'
                                                    }`}
                                            >
                                                {i < step ? <FaCheck className="h-3 w-3" /> : i + 1}
                                            </span>
                                            <span
                                                className={`hidden text-sm font-medium sm:inline ${i <= step ? 'text-green-800' : 'text-gray-400'
                                                    }`}
                                            >
                                                {label}
                                            </span>
                                        </div>
                                        {i < steps.length - 1 && (
                                            <div
                                                className={`mx-3 h-0.5 flex-1 ${i < step ? 'bg-green-600' : 'bg-gray-200'}`}
                                            />
                                        )}
                                    </li>
                                ))}
                            </ol>

                            {serverError && (
                                <div
                                    role="alert"
                                    className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                                >
                                    {serverError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate className="mt-8">
                                {/* STEP 1: role */}
                                {step === 0 && (
                                    <div>
                                        <p className="mb-4 text-sm font-medium text-gray-700">
                                            I am registering as a...
                                        </p>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            {(Object.keys(roleConfig) as Role[]).map((r) => {
                                                const { label, description, icon: Icon } = roleConfig[r]
                                                const active = form.role === r
                                                return (
                                                    <button
                                                        key={r}
                                                        type="button"
                                                        onClick={() => chooseRole(r)}
                                                        aria-pressed={active}
                                                        className={`rounded-xl border-2 p-5 text-left transition ${active
                                                                ? 'border-green-600 bg-green-50'
                                                                : 'border-gray-200 hover:border-green-300'
                                                            }`}
                                                    >
                                                        <Icon
                                                            className={`h-7 w-7 ${active ? 'text-green-700' : 'text-gray-400'}`}
                                                        />
                                                        <p className="mt-3 font-semibold text-gray-900">{label}</p>
                                                        <p className="mt-1 text-xs text-gray-500">{description}</p>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {errors.role && (
                                            <p className="mt-3 text-sm text-red-600">{errors.role}</p>
                                        )}
                                        <p className="mt-5 text-xs text-gray-400">
                                            ICT and Administrator accounts are created by the system
                                            administrator and cannot be self-registered.
                                        </p>
                                    </div>
                                )}

                                {/* STEP 2: details */}
                                {step === 1 && config && (
                                    <div className="space-y-5">
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <Field id="firstName" label="First Name *" error={errors.firstName}>
                                                <input
                                                    id="firstName"
                                                    name="firstName"
                                                    type="text"
                                                    autoComplete="given-name"
                                                    value={form.firstName}
                                                    onChange={handleChange}
                                                    className={cls('firstName')}
                                                />
                                            </Field>
                                            <Field id="lastName" label="Last Name *" error={errors.lastName}>
                                                <input
                                                    id="lastName"
                                                    name="lastName"
                                                    type="text"
                                                    autoComplete="family-name"
                                                    value={form.lastName}
                                                    onChange={handleChange}
                                                    className={cls('lastName')}
                                                />
                                            </Field>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <Field id="email" label="Email *" error={errors.email}>
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    autoComplete="email"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    placeholder="you@example.com"
                                                    className={cls('email')}
                                                />
                                            </Field>
                                            <Field id="phone" label="Phone *" error={errors.phone}>
                                                <input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    autoComplete="tel"
                                                    value={form.phone}
                                                    onChange={handleChange}
                                                    placeholder="+255 ..."
                                                    className={cls('phone')}
                                                />
                                            </Field>
                                        </div>

                                        <Field id="gender" label="Gender *" error={errors.gender}>
                                            <select
                                                id="gender"
                                                name="gender"
                                                value={form.gender}
                                                onChange={handleChange}
                                                className={cls('gender')}
                                            >
                                                <option value="">Select...</option>
                                                <option value="female">Female</option>
                                                <option value="male">Male</option>
                                            </select>
                                        </Field>

                                        <div className="border-t border-gray-100 pt-5">
                                            <p className="mb-4 text-sm font-semibold text-green-800">
                                                {config.label} information
                                            </p>
                                            <div className="grid gap-5 sm:grid-cols-2">
                                                {renderRoleField('idNumber')}
                                                {renderRoleField('unit')}
                                            </div>
                                            <div className="mt-5">{renderRoleField('extra')}</div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: security */}
                                {step === 2 && (
                                    <div className="space-y-5">
                                        <Field id="password" label="Password *" error={errors.password}>
                                            <div className="relative">
                                                <input
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    autoComplete="new-password"
                                                    value={form.password}
                                                    onChange={handleChange}
                                                    className={`${cls('password')} pr-12`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-green-700"
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                            {form.password && (
                                                <div className="mt-2">
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4].map((n) => (
                                                            <div
                                                                key={n}
                                                                className={`h-1.5 flex-1 rounded ${n <= score ? strengthColor[score] : 'bg-gray-200'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Strength: {strengthLabel[score]}
                                                    </p>
                                                </div>
                                            )}
                                        </Field>

                                        <Field
                                            id="confirmPassword"
                                            label="Confirm Password *"
                                            error={errors.confirmPassword}
                                        >
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                value={form.confirmPassword}
                                                onChange={handleChange}
                                                className={cls('confirmPassword')}
                                            />
                                        </Field>

                                        <p className="text-xs text-gray-400">
                                            Use at least 8 characters, with upper and lower case letters
                                            and a number.
                                        </p>

                                        <div>
                                            <label className="flex items-start gap-2 text-sm text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    name="terms"
                                                    checked={form.terms}
                                                    onChange={handleChange}
                                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-green-700"
                                                />
                                                <span>
                                                    I confirm that the information I provided is correct and I
                                                    agree to the UHWF terms and privacy policy.
                                                </span>
                                            </label>
                                            {errors.terms && (
                                                <p className="mt-1 text-xs text-red-600">{errors.terms}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="mt-8 flex items-center justify-between">
                                    {step > 0 ? (
                                        <button
                                            type="button"
                                            onClick={back}
                                            className="rounded-lg border border-gray-200 px-6 py-2.5 font-medium text-gray-600 hover:bg-gray-50"
                                        >
                                            Back
                                        </button>
                                    ) : (
                                        <span />
                                    )}

                                    {step < 2 ? (
                                        <button
                                            type="button"
                                            onClick={next}
                                            className="rounded-lg bg-green-700 px-8 py-2.5 font-semibold text-white hover:bg-green-800"
                                        >
                                            Continue
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="rounded-lg bg-green-700 px-8 py-2.5 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {loading ? 'Creating account...' : 'Create Account'}
                                        </button>
                                    )}
                                </div>
                            </form>

                            <p className="mt-8 text-center text-sm text-gray-500">
                                Already have an account?{' '}
                                <Link to="/login" className="font-semibold text-green-700 hover:text-green-900">
                                    Sign in
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Register