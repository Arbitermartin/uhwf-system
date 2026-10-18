import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaTimes, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa'
import { api, getErrorMessage } from '../services/api'

type SignupForm = {
    fullName: string
    email: string
    phone: string
    password: string
    confirmPassword: string
    terms: boolean
}

type Errors = Partial<Record<keyof SignupForm, string>>

const initialForm: SignupForm = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false,
}

const validate = (f: SignupForm): Errors => {
    const e: Errors = {}
    if (f.fullName.trim().length < 2) e.fullName = 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.'
    if (!/^[+\d\s-]{9,16}$/.test(f.phone)) e.phone = 'Enter a valid phone number.'
    if (f.password.length < 8) e.password = 'Use at least 8 characters.'
    if (f.confirmPassword !== f.password) e.confirmPassword = 'Passwords do not match.'
    if (!f.terms) e.terms = 'Please accept the terms to continue.'
    return e
}

const inputBase =
    'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-green-500'

const SignupModal = ({ onClose }: { onClose: () => void }) => {
    const navigate = useNavigate()
    const firstField = useRef<HTMLInputElement>(null)
    const [form, setForm] = useState<SignupForm>(initialForm)
    const [errors, setErrors] = useState<Errors>({})
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState('')
    const [created, setCreated] = useState(false)

    // Close on Esc, lock page scroll, focus the first field
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        firstField.current?.focus()
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = previous
        }
    }, [onClose])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
        if (errors[name as keyof SignupForm]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }))
        }
    }

    const handleSubmit = async () => {
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setLoading(true)
        setServerError('')
        try {
            await api.post('/auth/register-student', {
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                password: form.password,
            })
            setCreated(true)
        } catch (err) {
            setServerError(getErrorMessage(err, 'Could not create your account. Please try again.'))
        } finally {
            setLoading(false)
        }
    }

    const field = (key: keyof SignupForm) =>
        `${inputBase} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <div
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-green-950/60 p-4 sm:items-center"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="signup-title"
                onClick={(e) => e.stopPropagation()}
                className="my-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 id="signup-title" className="text-xl font-bold text-green-950">
                            Create your student account
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500">Takes less than a minute.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                        <FaTimes className="h-5 w-5" />
                    </button>
                </div>

                {created ? (
                    <div className="py-6 text-center">
                        <FaCheckCircle className="mx-auto h-14 w-14 text-green-600" />
                        <h3 className="mt-3 text-xl font-bold text-green-950">Account created</h3>
                        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-600">
                            Log in to continue your application: registration details, payment,
                            courses and documents.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="mt-5 rounded-lg bg-green-900 px-8 py-2.5 font-semibold text-white hover:bg-green-800"
                        >
                            Go to login
                        </button>
                    </div>
                ) : (
                    <div className="mt-5 space-y-4">
                        {serverError && (
                            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {serverError}
                            </div>
                        )}

                        <div>
                            <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-gray-600">
                                Full name
                            </label>
                            <input
                                ref={firstField}
                                id="fullName"
                                name="fullName"
                                type="text"
                                autoComplete="name"
                                value={form.fullName}
                                onChange={handleChange}
                                placeholder="Neema Mollel"
                                className={field('fullName')}
                            />
                            {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-600">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className={field('email')}
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                            </div>
                            <div>
                                <label htmlFor="phone" className="mb-1 block text-xs font-medium text-gray-600">
                                    Phone
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="+255 ..."
                                    className={field('phone')}
                                />
                                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="password" className="mb-1 block text-xs font-medium text-gray-600">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="8+ characters"
                                        className={`${field('password')} pr-10`}
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
                                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="mb-1 block text-xs font-medium text-gray-600">
                                    Confirm password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Repeat password"
                                    className={field('confirmPassword')}
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-start gap-2 text-xs text-gray-600">
                                <input
                                    type="checkbox"
                                    name="terms"
                                    checked={form.terms}
                                    onChange={handleChange}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-green-700"
                                />
                                <span>
                                    I confirm my details are correct and I agree to the UHWF terms and
                                    privacy policy.
                                </span>
                            </label>
                            {errors.terms && <p className="mt-1 text-xs text-red-600">{errors.terms}</p>}
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full rounded-lg bg-amber-400 py-2.5 font-semibold text-green-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>

                        <p className="text-center text-xs text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-green-800 hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SignupModal