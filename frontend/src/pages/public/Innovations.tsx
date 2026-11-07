import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import type { IconType } from 'react-icons'
import {
    FaCheckCircle,
    FaClipboardList,
    FaGlobeAfrica,
    FaHandshake,
    FaLaptopCode,
    FaLightbulb,
    FaMapMarkedAlt,
    FaPaperPlane,
    FaPaw,
    FaRecycle,
    FaSearch,
    FaTree,
    FaUsers,
} from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../services/api'
import { submitInnovation } from '../../services/innovations'

type Category = { id: string; title: string; text: string; icon: IconType }

const CATEGORIES: Category[] = [
    { id: 'climate', title: 'Climate change', text: 'Adapting to heat, drought and floods.', icon: FaGlobeAfrica },
    { id: 'waste', title: 'Waste management', text: 'Sorting, recycling and clean communities.', icon: FaRecycle },
    { id: 'trees', title: 'Trees and conservation', text: 'Planting and protecting forests.', icon: FaTree },
    { id: 'land', title: 'Land use planning', text: 'Fair and sustainable use of land.', icon: FaMapMarkedAlt },
    { id: 'wildlife', title: 'Wildlife and people', text: 'Living safely beside wildlife.', icon: FaPaw },
    { id: 'community', title: 'Community', text: 'Ideas that bring people together.', icon: FaUsers },
    { id: 'technology', title: 'Technology', text: 'Apps, tools and smart solutions.', icon: FaLaptopCode },
    { id: 'other', title: 'Something else', text: 'Surprise us with a new angle.', icon: FaLightbulb },
]

const STEPS = [
    { title: 'Share your idea', text: 'Fill in the short form below. It takes about five minutes.', icon: FaPaperPlane },
    { title: 'We read it', text: 'The UHWF team reviews every idea we receive.', icon: FaSearch },
    { title: 'We get in touch', text: 'If we want to know more, we contact you by email or phone.', icon: FaClipboardList },
    { title: 'Grow together', text: 'Where possible, we connect good ideas with partners and advice.', icon: FaHandshake },
]

const STAGES = [
    { id: 'idea', label: 'Just an idea' },
    { id: 'prototype', label: 'I have a prototype or a plan' },
    { id: 'running', label: 'It is already running' },
]

const REGIONS = [
    'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma', 'Kilimanjaro',
    'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Mjini Magharibi', 'Morogoro', 'Mtwara', 'Mwanza', 'Njombe',
    'Pemba North', 'Pemba South', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe',
    'Tabora', 'Tanga', 'Unguja North', 'Unguja South', 'Outside Tanzania',
]

type Form = {
    fullName: string
    email: string
    phone: string
    region: string
    category: string
    title: string
    description: string
    stage: string
    beneficiaries: string
    link: string
    consent: boolean
    website: string
}
type Errors = Partial<Record<keyof Form, string>>

const emptyForm: Form = {
    fullName: '', email: '', phone: '', region: '', category: '', title: '', description: '',
    stage: '', beneficiaries: '', link: '', consent: false, website: '',
}

const PHONE = /^[+\d\s-]{9,16}$/
const EMAIL = /^\S+@\S+\.\S+$/
const MAX_DESC = 2000

const inputBase =
    'w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-green-500'
const cls = (error?: string) => `${inputBase} ${error ? 'border-red-400' : 'border-gray-200'}`

const Field = ({
    id,
    label,
    error,
    hint,
    children,
}: {
    id: string
    label: string
    error?: string
    hint?: string
    children: ReactNode
}) => (
    <div>
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
            {label}
        </label>
        {children}
        {error ? (
            <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : (
            hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>
        )}
    </div>
)

const validate = (f: Form): Errors => {
    const e: Errors = {}
    if (f.fullName.trim().length < 2) e.fullName = 'Enter your full name.'
    if (!EMAIL.test(f.email.trim())) e.email = 'Enter a valid email address.'
    if (f.phone.trim() && !PHONE.test(f.phone.trim())) e.phone = 'Enter a valid phone number.'
    if (!f.region) e.region = 'Choose your region.'
    if (!f.category) e.category = 'Choose a category.'
    if (f.title.trim().length < 5) e.title = 'Give your idea a title (at least 5 characters).'
    if (f.description.trim().length < 50) e.description = 'Describe your idea in at least 50 characters.'
    if (!f.stage) e.stage = 'Choose the stage.'
    if (f.link.trim() && !/^https?:\/\/\S+$/i.test(f.link.trim())) e.link = 'The link must start with http:// or https://'
    if (!f.consent) e.consent = 'Please agree so we can contact you.'
    return e
}

const Innovations = () => {
    const formRef = useRef<HTMLElement>(null)
    const [form, setForm] = useState<Form>(emptyForm)
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [loading, setLoading] = useState(false)
    const [reference, setReference] = useState<number | null>(null)

    const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    const pickCategory = (id: string) => {
        setForm((prev) => ({ ...prev, category: id }))
        setErrors((prev) => ({ ...prev, category: undefined }))
        scrollToForm()
    }

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        const next = e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : value
        setForm((prev) => ({ ...prev, [name]: next }))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setLoading(true)
        setServerError('')
        try {
            const res = await submitInnovation({
                ...form,
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                title: form.title.trim(),
                description: form.description.trim(),
                beneficiaries: form.beneficiaries.trim(),
                link: form.link.trim(),
            })
            setReference(res.id)
            setForm(emptyForm)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not send your idea. Please try again.'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700">
                <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-amber-400/20" />
                <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-green-500/20" />
                <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-green-950">
                        <FaLightbulb className="h-3.5 w-3.5" /> Innovations
                    </span>
                    <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                        Your idea can change Tanzania
                    </h1>
                    <p className="mt-3 text-xl font-semibold text-amber-300">Wazo lako linaweza kubadilisha Tanzania.</p>
                    <p className="mt-5 max-w-2xl text-lg text-green-50">
                        Do you have a bright idea for land, wildlife, climate, waste or your community? Tell us about it.
                        Shiriki wazo lako la kibunifu nasi.
                    </p>
                    <button
                        type="button"
                        onClick={scrollToForm}
                        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-8 py-3 font-semibold text-green-950 shadow-sm transition-colors hover:bg-amber-300"
                    >
                        <FaPaperPlane className="h-4 w-4" /> Share your idea
                    </button>
                </div>
            </section>

            {/* Categories */}
            <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-green-900">What kind of idea do you have?</h2>
                <div className="mt-2 h-1 w-14 rounded bg-amber-400" />
                <p className="mt-3 text-gray-600">Choose a topic and we will take you to the form.</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {CATEGORIES.map(({ id, title, text, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => pickCategory(id)}
                            className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-800 transition-colors group-hover:bg-amber-400 group-hover:text-green-950">
                                <Icon className="h-6 w-6" />
                            </span>
                            <h3 className="mt-4 font-bold text-green-950">{title}</h3>
                            <p className="mt-1 text-sm text-gray-600">{text}</p>
                        </button>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="bg-green-50 py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-green-900">How it works</h2>
                    <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

                    <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {STEPS.map(({ title, text, icon: Icon }, i) => (
                            <li key={title} className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
                                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 font-bold text-green-950">
                                    {i + 1}
                                </span>
                                <Icon className="mx-auto mt-4 h-6 w-6 text-green-700" />
                                <h3 className="mt-3 font-bold text-green-950">{title}</h3>
                                <p className="mt-1 text-sm text-gray-600">{text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Form */}
            <section ref={formRef} id="share-idea" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-14 sm:px-6">
                <h2 className="text-2xl font-bold text-green-900">Share your idea</h2>
                <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

                {reference !== null ? (
                    <div role="status" className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
                        <FaCheckCircle className="mx-auto h-12 w-12 text-green-600" />
                        <h3 className="mt-4 text-2xl font-bold text-green-950">Asante sana! Thank you!</h3>
                        <p className="mt-2 text-gray-700">Your idea was received. The UHWF team will read it carefully.</p>
                        {reference > 0 && (
                            <p className="mt-4 text-sm text-gray-600">
                                Your reference:{' '}
                                <strong className="text-green-900">UHWF-INN-{String(reference).padStart(4, '0')}</strong>
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={() => setReference(null)}
                            className="mt-6 rounded-lg bg-amber-400 px-6 py-2.5 font-semibold text-green-950 hover:bg-amber-300"
                        >
                            Share another idea
                        </button>
                    </div>
                ) : (
                    <form onSubmit={submit} noValidate className="mt-8 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                        {serverError && (
                            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {serverError}
                            </p>
                        )}

                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field id="fullName" label="Full name" error={errors.fullName}>
                                <input id="fullName" name="fullName" autoComplete="name" value={form.fullName} onChange={change} maxLength={100} className={cls(errors.fullName)} />
                            </Field>
                            <Field id="email" label="Email" error={errors.email}>
                                <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} maxLength={150} className={cls(errors.email)} />
                            </Field>
                            <Field id="phone" label="Phone (optional)" error={errors.phone}>
                                <input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={change} placeholder="+255 ..." className={cls(errors.phone)} />
                            </Field>
                            <Field id="region" label="Region" error={errors.region}>
                                <select id="region" name="region" value={form.region} onChange={change} className={cls(errors.region)}>
                                    <option value="">Choose your region</option>
                                    {REGIONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <Field id="category" label="Topic" error={errors.category}>
                            <select id="category" name="category" value={form.category} onChange={change} className={cls(errors.category)}>
                                <option value="">Choose a topic</option>
                                {CATEGORIES.map((c) => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </Field>

                        <Field id="title" label="Name of your idea" error={errors.title}>
                            <input id="title" name="title" value={form.title} onChange={change} maxLength={120} placeholder="For example: Plastic bottles turned into tree pots" className={cls(errors.title)} />
                        </Field>

                        <Field
                            id="description"
                            label="Describe your idea"
                            error={errors.description}
                            hint={`What problem does it solve and how does it work? ${form.description.length} of ${MAX_DESC} characters (at least 50).`}
                        >
                            <textarea id="description" name="description" rows={6} value={form.description} onChange={change} maxLength={MAX_DESC} className={`${cls(errors.description)} resize-y`} />
                        </Field>

                        <Field id="stage" label="Where is your idea now?" error={errors.stage}>
                            <select id="stage" name="stage" value={form.stage} onChange={change} className={cls(errors.stage)}>
                                <option value="">Choose the stage</option>
                                {STAGES.map((s) => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </Field>

                        <Field id="beneficiaries" label="Who will benefit? (optional)">
                            <input id="beneficiaries" name="beneficiaries" value={form.beneficiaries} onChange={change} maxLength={300} placeholder="For example: farmers in my village" className={cls()} />
                        </Field>

                        <Field id="link" label="Link to a photo, video or document (optional)" error={errors.link}>
                            <input id="link" name="link" type="url" value={form.link} onChange={change} maxLength={300} placeholder="https://" className={cls(errors.link)} />
                        </Field>

                        {/* Trap for spam robots. People never see or fill this. */}
                        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                            <label htmlFor="website">Leave this empty</label>
                            <input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={change} />
                        </div>

                        <div>
                            <label className="flex items-start gap-3 text-sm text-gray-600">
                                <input type="checkbox" name="consent" checked={form.consent} onChange={change} className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-green-700" />
                                <span>
                                    I agree that UHWF may keep my details and contact me about my idea. I understand
                                    my name and idea will not be shown publicly without my permission.
                                </span>
                            </label>
                            {errors.consent && <p className="mt-1 text-xs text-red-600">{errors.consent}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-semibold text-green-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FaPaperPlane className="h-4 w-4" /> {loading ? 'Sending...' : 'Send my idea'}
                        </button>
                    </form>
                )}
            </section>
        </div>
    )
}

export default Innovations