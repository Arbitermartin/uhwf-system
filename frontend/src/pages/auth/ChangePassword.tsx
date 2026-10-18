import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaCheck, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa'
import logo from '../../assets/uhwf-logo.webp'
import { useAuth } from '../../hooks/useAuth'
import { api, getErrorMessage, getFieldErrors } from '../../services/api'
import { roleHome } from '../../services/roleHome'
import type { User } from '../../context/auth-context'

type Form = { currentPassword: string; newPassword: string; confirmPassword: string }
type Errors = Partial<Record<keyof Form, string>>

const emptyForm: Form = { currentPassword: '', newPassword: '', confirmPassword: '' }

const inputBase =
    'w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const validate = (f: Form): Errors => {
    const e: Errors = {}
    if (!f.currentPassword) e.currentPassword = 'Enter your current password.'
    if (f.newPassword.length < 8) e.newPassword = 'Use at least 8 characters.'
    else if (f.newPassword.length > 72) e.newPassword = 'Password is too long (72 characters at most).'
    else if (!/[A-Za-z]/.test(f.newPassword) || !/\d/.test(f.newPassword)) {
        e.newPassword = 'Use letters and numbers.'
    } else if (f.newPassword === f.currentPassword) {
        e.newPassword = 'Choose a password that is different from the current one.'
    }
    if (f.confirmPassword !== f.newPassword) e.confirmPassword = 'Passwords do not match.'
    return e
}

const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
    <li className={`flex items-center gap-2 text-xs ${ok ? 'text-green-700' : 'text-gray-500'}`}>
        <FaCheck className={`h-2.5 w-2.5 ${ok ? 'opacity-100' : 'opacity-30'}`} />
        {text}
    </li>
)

// standalone = the full-page version shown right after signing in with a temporary password.
// Without it, the form sits inside the dashboard (Profile menu > Change password).
const ChangePassword = ({ standalone = false }: { standalone?: boolean }) => {
    const { user, updateUser, logout } = useAuth()
    const navigate = useNavigate()

    const [form, setForm] = useState<Form>(emptyForm)
    const [errors, setErrors] = useState<Errors>({})
    const [show, setShow] = useState(false)
    const [saving, setSaving] = useState(false)
    const [serverError, setServerError] = useState('')
    const [done, setDone] = useState(false)

    const forced = !!user?.mustChangePassword

    const change = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
        setDone(false)
    }

    const submit = async () => {
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        try {
            const res = await api.post<{ user: User }>('/auth/change-password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            })
            updateUser(res.data.user)
            setForm(emptyForm)
            if (standalone && user) {
                navigate(roleHome[user.role], { replace: true })
            } else {
                setDone(true)
            }
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not change the password.'))
        } finally {
            setSaving(false)
        }
    }

    const signOut = async () => {
        await logout()
        navigate('/login', { replace: true })
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
                    className={`${inputBase} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`}
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

    const card = (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-bold text-green-950">
                {forced ? 'Choose your own password' : 'Change password'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
                {forced
                    ? 'You signed in with a temporary password. Set a new one to continue.'
                    : 'Other devices and browsers will be signed out when you change it.'}
            </p>

            {done && (
                <p role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800">
                    <FaCheckCircle className="h-4 w-4" /> Password changed.
                </p>
            )}
            {serverError && (
                <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {serverError}
                </p>
            )}

            <div className="mt-5 space-y-4">
                {field('currentPassword', forced ? 'Temporary password' : 'Current password', 'current-password')}
                {field('newPassword', 'New password', 'new-password')}
                <ul className="space-y-1">
                    <Rule ok={form.newPassword.length >= 8} text="At least 8 characters" />
                    <Rule ok={/[A-Za-z]/.test(form.newPassword)} text="Contains a letter" />
                    <Rule ok={/\d/.test(form.newPassword)} text="Contains a number" />
                </ul>
                {field('confirmPassword', 'Confirm new password', 'new-password')}
            </div>

            <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="mt-6 w-full rounded-lg bg-amber-400 py-2.5 font-semibold text-green-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {saving ? 'Saving...' : forced ? 'Set password and continue' : 'Change password'}
            </button>
        </div>
    )

    if (!standalone) return <div className="mx-auto max-w-lg">{card}</div>

    return (
        <div className="min-h-screen bg-green-50 px-4 py-8 sm:py-12">
            <div className="mx-auto w-full max-w-md">
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo} alt="UHWF logo" className="h-10 w-auto" />
                        <span className="text-lg font-bold text-green-800">UHWF-TANZANIA</span>
                    </Link>
                    <button type="button" onClick={signOut} className="text-sm text-gray-500 hover:text-green-700">
                        Log out
                    </button>
                </div>
                {card}
            </div>
        </div>
    )
}

export default ChangePassword