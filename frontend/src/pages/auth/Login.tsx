import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa'
import logo from '../../assets/uhwf-logo.webp'
import heroImage from '../../assets/conservation.webp'
import { getErrorMessage } from '../../services/api'
import { roleHome } from '../../services/roleHome'

type LoginForm = {
    identifier: string
    password: string
    remember: boolean
}

type LoginErrors = Partial<Record<'identifier' | 'password', string>>

const inputBase =
    'w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-green-500'

const Login = () => {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [form, setForm] = useState<LoginForm>({
        identifier: '',
        password: '',
        remember: false,
    })
    const [errors, setErrors] = useState<LoginErrors>({})
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState('')

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
        if (name in errors) {
            setErrors((prev) => ({ ...prev, [name]: undefined }))
        }
    }
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        const found: LoginErrors = {}
        if (form.identifier.trim().length < 3) found.identifier = 'Enter your email.'
        if (form.password.length < 6) found.password = 'Password must be at least 6 characters.'
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setLoading(true)
        setServerError('')
        try {
            const user = await login(form.identifier.trim(), form.password)
            // A temporary password must be replaced before anything else
            navigate(user.mustChangePassword ? '/change-password' : roleHome[user.role], { replace: true })
        } catch (err) {
            setServerError(getErrorMessage(err, 'Could not sign in. Please try again.'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            {/* Left: brand panel (desktop only) */}
            <div className="relative hidden lg:block">
                <img
                    src={heroImage}
                    alt="Environment conservation in Tanzania"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-green-950/75" />
                <div className="relative flex h-full flex-col justify-between p-12 text-white">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={logo} alt="UHWF logo" className="h-12 w-auto" />
                        <span className="text-xl font-bold">UHWF-TANZANIA</span>
                    </Link>
                    <div>
                        <h2 className="text-4xl font-bold leading-tight">
                            United for a sustainable future
                        </h2>
                        <p className="mt-4 max-w-md text-green-100">
                            Sign in to access your UHWF account and continue working to
                            protect Tanzania's land, wildlife and communities.
                        </p>
                    </div>
                    <p className="text-sm text-green-200/70">
                        © {new Date().getFullYear()} UHWF-TANZANIA
                    </p>
                </div>
            </div>

            {/* Right: form */}
            <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
                <div className="mx-auto w-full max-w-md">
                    <Link
                        to="/"
                        className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-700"
                    >
                        <FaArrowLeft className="h-3 w-3" /> Back to website
                    </Link>

                    {/* Logo shown on mobile only */}
                    <div className="mb-6 flex items-center gap-2 lg:hidden">
                        <img src={logo} alt="UHWF logo" className="h-10 w-auto" />
                        <span className="text-lg font-bold text-green-800">UHWF-TANZANIA</span>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
                    <p className="mt-2 text-gray-500">Sign in to your account to continue.</p>

                    {serverError && (
                        <div
                            role="alert"
                            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                        <div>
                            <label
                                htmlFor="identifier"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Email or Username
                            </label>
                            <input
                                id="identifier"
                                name="identifier"
                                type="text"
                                autoComplete="username"
                                value={form.identifier}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className={`${inputBase} ${errors.identifier ? 'border-red-400' : 'border-gray-200'}`}
                            />
                            {errors.identifier && (
                                <p className="mt-1 text-xs text-red-600">{errors.identifier}</p>
                            )}
                        </div>

                        <div>
                            <div className="mb-1 flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-green-700 hover:text-green-900"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={`${inputBase} pr-12 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
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
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                            )}
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={form.remember}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 accent-green-700"
                            />
                            Remember me
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-green-700 hover:text-green-900">
                            Register now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login