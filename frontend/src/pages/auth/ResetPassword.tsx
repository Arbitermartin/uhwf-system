import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { FaArrowLeft, FaCheck, FaCheckCircle, FaEye, FaEyeSlash, FaExclamationTriangle } from 'react-icons/fa'
import logo from '../../assets/uhwf-logo.webp'
import { api, getErrorMessage, getFieldErrors } from '../../services/api'

type Step = 'checking' | 'invalid' | 'form' | 'done'
type Form = { password: string; confirmPassword: string }
type Errors = Partial<Record<keyof Form, string>>

const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
    <li className={`flex items-center gap-2 text-xs ${ok ? 'text-green-700' : 'text-gray-500'}`}>
        <FaCheck className={`h-2.5 w-2.5 ${ok ? 'opacity-100' : 'opacity-30'}`} />
        {text}
    </li>
)

const validate = (f: Form): Errors => {
    const e: Errors = {}
    if (f.password.length < 8) e.password = 'Use at least 8 characters.'
    else if (f.password.length > 72) e.password = 'Password is too long (72 characters at most).'
    else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Use letters and numbers.'
    if (f.confirmPassword !== f.password) e.confirmPassword = 'Passwords do not match.'
    return e
}

// The page the link in the email opens: /reset-password?token=...
const ResetPassword = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()

    // The secret is kept in memory and taken out of the address bar, so it does not stay in the
    // browser history or get copied by accident when someone shares their screen or the address.
    const [token] = useState(() => searchParams.get('token') ?? '')
    const [step, setStep] = useState<Step>(token ? 'checking' : 'invalid')
    const [form, setForm] = useState<Form>({ password: '', confirmPassword: '' })
    const [errors, setErrors] = useState<Errors>({})
    const [show, setShow] = useState(false)
    const [saving, setSaving] = useState(false)
    const [serverError, setServerError] = useState('')

    useEffect(() => {
        if (searchParams.has('token')) navigate(location.pathname, { replace: true })
        // this must run once, when the page opens
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ask the server whether the link still works, before the person types a password
    useEffect(() => {
        if (!token) return
        let cancelled = false
        api
            .post<{ valid: boolean }>('/auth/reset-token/check', { token })
            .then((res) => {
                if (!cancelled) setStep(res.data.valid ? 'form' : 'invalid')
            })
            .catch(() => {
                // if the check itself fails (for example the server is off), let the person try the form
                if (!cancelled) setStep('form')
            })
        return () => {
            cancelled = true
        }
    }, [token])

    const change = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        try {
            await api.post('/auth/reset-password', { token, password: form.password })
            setForm({ password: '', confirmPassword: '' })
            setStep('done')
        } catch (err) {
            const fields = getFieldErrors(err)
            if (fields.token) {
                setStep('invalid') // the link was used or expired while the person was typing
            } else {
                setErrors({ password: fields.password })
                setServerError(getErrorMessage(err, 'Could not change the password.'))
            }
        } finally {
            setSaving(false)
        }
    }

    const field = (key: keyof Form, label: string, autoComplete: string) => (
        <div>
            <label htmlFor={key} className="mb-1 block text-xs font-medium text-gray-600">
                {label}
            </label>
            <div className="relative">
                <input
                    id={key}
                    name={key}
                    type={show ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    value={form[key]}
                    onChange={change}
                    className={`w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 ${errors[key] ? 'border-red-400' : 'border-gray-200'
                        }`}
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? 'Hide passwords' : 'Show passwords'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-green-700"
                >
                    {show ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
            {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
        </div>
    )

    return (
        <div className="min-h-screen bg-green-50 px-4 py-8 sm:py-12">
            <div className="mx-auto w-full max-w-md">
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo} alt="UHWF logo" className="h-10 w-auto" />
                        <span className="text-lg font-bold text-green-800">UHWF-TANZANIA</span>
                    </Link>
                    <Link to="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-700">
                        <FaArrowLeft className="h-3 w-3" /> Sign in
                    </Link>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    {step === 'checking' && <p className="py-8 text-center text-sm text-gray-500">Checking your link...</p>}

                    {step === 'invalid' && (
                        <div className="text-center">
                            <FaExclamationTriangle className="mx-auto h-12 w-12 text-amber-500" />
                            <h1 className="mt-4 text-xl font-bold text-green-950">This link does not work</h1>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                It has expired, it was already used, or it was replaced by a newer link. Links work for 60 minutes and
                                only once.
                            </p>
                            <Link
                                to="/forgot-password"
                                className="mt-6 block w-full rounded-lg bg-amber-400 py-2.5 text-center text-sm font-semibold text-green-950 hover:bg-amber-300"
                            >
                                Ask for a new link
                            </Link>
                        </div>
                    )}

                    {step === 'form' && (
                        <>
                            <h1 className="text-xl font-bold text-green-950">Choose a new password</h1>
                            <p className="mt-1 text-sm text-gray-500">You will be signed out of every other device.</p>

                            {serverError && (
                                <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {serverError}
                                </p>
                            )}

                            <form onSubmit={(e) => void submit(e)} noValidate className="mt-5 space-y-4">
                                {field('password', 'New password', 'new-password')}
                                <ul className="space-y-1">
                                    <Rule ok={form.password.length >= 8} text="At least 8 characters" />
                                    <Rule ok={/[A-Za-z]/.test(form.password)} text="Contains a letter" />
                                    <Rule ok={/\d/.test(form.password)} text="Contains a number" />
                                </ul>
                                {field('confirmPassword', 'Confirm new password', 'new-password')}

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full rounded-lg bg-amber-400 py-2.5 font-semibold text-green-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? 'Saving...' : 'Change password'}
                                </button>
                            </form>
                        </>
                    )}

                    {step === 'done' && (
                        <div className="text-center">
                            <FaCheckCircle className="mx-auto h-14 w-14 text-green-600" />
                            <h1 className="mt-4 text-xl font-bold text-green-950">Password changed</h1>
                            <p className="mt-2 text-sm text-gray-600">You can now sign in with your new password.</p>
                            <Link
                                to="/login"
                                className="mt-6 block w-full rounded-lg bg-amber-400 py-2.5 text-center text-sm font-semibold text-green-950 hover:bg-amber-300"
                            >
                                Go to sign in
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ResetPassword
