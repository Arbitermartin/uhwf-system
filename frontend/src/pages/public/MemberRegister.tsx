import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FaCheck, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../services/api'
import { memberInterests, registerMember } from '../../services/member'
import type { InterestKey, RegisterMemberReply } from '../../services/member'

type Form = {
    fullName: string
    email: string
    phone: string
    gender: '' | 'female' | 'male'
    region: string
    password: string
    confirmPassword: string
}
type Errors = Partial<Record<keyof Form | 'agree', string>>

const empty: Form = { fullName: '', email: '', phone: '', gender: '', region: '', password: '', confirmPassword: '' }

const inputBase = 'w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-green-500'

const benefits = [
    'News and updates about the foundation’s work',
    'Invitations to events and workshops',
    'A way to support land use planning and wildlife conservation',
    'Your own member page, with your member number',
]

const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
    <li className={`flex items-center gap-2 text-xs ${ok ? 'text-green-700' : 'text-gray-500'}`}>
        <FaCheck className={`h-2.5 w-2.5 ${ok ? 'opacity-100' : 'opacity-30'}`} />
        {text}
    </li>
)

const validate = (f: Form, agree: boolean): Errors => {
    const e: Errors = {}
    if (f.fullName.trim().length < 2) e.fullName = 'Please enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address.'
    if (f.phone.trim() && !/^[+\d\s-]{9,16}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.'
    if (f.password.length < 8) e.password = 'Use at least 8 characters.'
    else if (f.password.length > 72) e.password = 'Password is too long (72 characters at most).'
    else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Use letters and numbers.'
    if (f.confirmPassword !== f.password) e.confirmPassword = 'Passwords do not match.'
    if (!agree) e.agree = 'Please confirm this to continue.'
    return e
}

const MemberRegister = () => {
    const [form, setForm] = useState<Form>(empty)
    const [interests, setInterests] = useState<InterestKey[]>([])
    const [newsletter, setNewsletter] = useState(true)
    const [agree, setAgree] = useState(false)
    const [website, setWebsite] = useState('') // the hidden field for bots
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [sending, setSending] = useState(false)
    const [done, setDone] = useState<RegisterMemberReply | null>(null)

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Errors]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const toggleInterest = (key: InterestKey) =>
        setInterests((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        const found = validate(form, agree)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSending(true)
        setServerError('')
        try {
            const reply = await registerMember({
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                gender: form.gender,
                region: form.region.trim(),
                interests,
                newsletter,
                password: form.password,
                agree,
                website,
            })
            setForm(empty)
            setDone(reply)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not register you. Please try again.'))
        } finally {
            setSending(false)
        }
    }

    const cls = (k: keyof Errors) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <div>
            <section className="bg-green-800 py-14">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-green-300">Membership</p>
                    <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">Become a Member</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-green-100">
                        Join the people who stand with Tanzania’s land, wildlife and communities.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
                {done ? (
                    <div className="mx-auto max-w-lg rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                        <FaCheckCircle className="mx-auto h-16 w-16 text-green-600" />
                        <h2 className="mt-4 text-2xl font-bold text-green-950">Welcome to UHWF</h2>
                        <p className="mt-2 text-gray-600">{done.message}</p>
                        {done.memberNumber && (
                            <p className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-gray-600">
                                Your member number
                                <span className="mt-1 block text-2xl font-bold tracking-wide text-green-900">{done.memberNumber}</span>
                            </p>
                        )}
                        {done.welcomeEmail && <p className="mt-4 text-sm text-gray-500">We also sent a welcome message to your email.</p>}
                        <Link
                            to="/login"
                            className="mt-6 inline-block w-full rounded-lg bg-amber-400 py-3 font-semibold text-green-950 transition-colors hover:bg-amber-300"
                        >
                            Sign in to your member page
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-10 lg:grid-cols-5">
                        <aside className="lg:col-span-2">
                            <h2 className="text-2xl font-bold text-green-800">Why join?</h2>
                            <ul className="mt-5 space-y-3">
                                {benefits.map((b) => (
                                    <li key={b} className="flex items-start gap-3 text-gray-700">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                                            <FaCheck className="h-2.5 w-2.5" />
                                        </span>
                                        {b}
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-6 text-sm text-gray-500">
                                Already a member?{' '}
                                <Link to="/login" className="font-medium text-green-800 hover:underline">
                                    Sign in
                                </Link>
                                . Want to study with us? See{' '}
                                <Link to="/admission" className="font-medium text-green-800 hover:underline">
                                    Admission
                                </Link>
                                .
                            </p>
                        </aside>

                        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 lg:col-span-3">
                            <h2 className="text-2xl font-bold text-green-800">Register</h2>
                            <p className="mt-1 text-sm text-gray-500">Fields marked with * are required.</p>

                            {serverError && (
                                <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    {serverError}
                                </div>
                            )}

                            <form onSubmit={(e) => void submit(e)} noValidate className="mt-6 space-y-5">
                                {/* Hidden from people, but bots fill it in. Real visitors never see or reach it. */}
                                <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                                    <label htmlFor="website">Website</label>
                                    <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700">
                                            Full name *
                                        </label>
                                        <input id="fullName" name="fullName" autoComplete="name" value={form.fullName} onChange={change} className={cls('fullName')} />
                                        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                                            Email *
                                        </label>
                                        <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} placeholder="you@example.com" className={cls('email')} />
                                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-3">
                                    <div>
                                        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                                            Phone
                                        </label>
                                        <input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={change} placeholder="+255 ..." className={cls('phone')} />
                                        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="gender" className="mb-1 block text-sm font-medium text-gray-700">
                                            Gender
                                        </label>
                                        <select id="gender" name="gender" value={form.gender} onChange={change} className={cls('gender')}>
                                            <option value="">Prefer not to say</option>
                                            <option value="female">Female</option>
                                            <option value="male">Male</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="region" className="mb-1 block text-sm font-medium text-gray-700">
                                            Region or city
                                        </label>
                                        <input id="region" name="region" value={form.region} onChange={change} maxLength={80} placeholder="Arusha" className={cls('region')} />
                                    </div>
                                </div>

                                <fieldset>
                                    <legend className="mb-2 text-sm font-medium text-gray-700">What interests you? (optional)</legend>
                                    <div className="flex flex-wrap gap-2">
                                        {memberInterests.map((i) => {
                                            const on = interests.includes(i.key)
                                            return (
                                                <button
                                                    key={i.key}
                                                    type="button"
                                                    aria-pressed={on}
                                                    onClick={() => toggleInterest(i.key)}
                                                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${on ? 'border-green-800 bg-green-800 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                                                        }`}
                                                >
                                                    {i.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </fieldset>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                                            Password *
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                value={form.password}
                                                onChange={change}
                                                className={`${cls('password')} pr-11`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((s) => !s)}
                                                aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-green-700"
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
                                            Confirm password *
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            value={form.confirmPassword}
                                            onChange={change}
                                            className={cls('confirmPassword')}
                                        />
                                        {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                                    </div>
                                </div>
                                <ul className="-mt-2 flex flex-wrap gap-x-5 gap-y-1">
                                    <Rule ok={form.password.length >= 8} text="At least 8 characters" />
                                    <Rule ok={/[A-Za-z]/.test(form.password)} text="Contains a letter" />
                                    <Rule ok={/\d/.test(form.password)} text="Contains a number" />
                                </ul>

                                <label className="flex items-start gap-3 text-sm text-gray-700">
                                    <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="mt-0.5 h-4 w-4 accent-green-700" />
                                    Send me news and updates by email.
                                </label>

                                <div>
                                    <label className="flex items-start gap-3 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={agree}
                                            onChange={(e) => {
                                                setAgree(e.target.checked)
                                                setErrors((prev) => ({ ...prev, agree: undefined }))
                                            }}
                                            className="mt-0.5 h-4 w-4 accent-green-700"
                                        />
                                        <span>I confirm that these details are correct, and I agree to be contacted by UHWF about my membership. *</span>
                                    </label>
                                    {errors.agree && <p className="mt-1 text-xs text-red-600">{errors.agree}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full rounded-lg bg-amber-400 px-6 py-3 font-semibold text-green-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                >
                                    {sending ? 'Registering...' : 'Become a member'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

export default MemberRegister
