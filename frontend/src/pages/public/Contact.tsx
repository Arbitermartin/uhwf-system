
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
    FaLocationDot,
    FaPhone,
    FaEnvelope,
    FaClock,
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
    FaXTwitter,
    FaWhatsapp,
    FaCircleCheck,
} from 'react-icons/fa6'
import { api, getErrorMessage, getFieldErrors } from '../../services/api'

type ContactForm = {
    name: string
    email: string
    phone: string
    subject: string
    message: string
    website: string // hidden field for bots, always empty for real visitors
}

type FormErrors = Partial<Record<keyof ContactForm, string>>

const initialForm: ContactForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    website: '',
}

type CardLine = { text?: string; textKey?: string; href?: string }

const contactCards: { titleKey: string; icon: typeof FaPhone; lines: CardLine[] }[] = [
    {
        titleKey: 'contact.visit',
        icon: FaLocationDot,
        lines: [{ textKey: 'footer.address1' }, { textKey: 'footer.address2' }],
    },
    {
        titleKey: 'contact.call',
        icon: FaPhone,
        lines: [
            { text: '+255 716 113 759', href: 'tel:+255716113759' },
            { text: '+255 733 699 520', href: 'tel:+255733699520' },
        ],
    },
    {
        titleKey: 'contact.email',
        icon: FaEnvelope,
        lines: [
            { text: 'info@uhwf.or.tz', href: 'mailto:info@uhwf.or.tz' },
            { text: 'helpdesk@uhwf.or.tz', href: 'mailto:helpdesk@uhwf.or.tz' },
        ],
    },
]

// Social network names are proper names, so they are not translated.
const socials = [
    { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61564643794385', icon: FaFacebookF },
    { label: 'Instagram', href: 'https://www.instagram.com/uhwftanzania', icon: FaInstagram },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/uhwf-tanzania-1b28bb332', icon: FaLinkedinIn },
    { label: 'X', href: 'https://x.com/Uhwf_tanzania', icon: FaXTwitter },
    { label: 'WhatsApp', href: 'https://chat.whatsapp.com/JlKM53wnVlM0yr86tVFy8D', icon: FaWhatsapp },
]

const validate = (f: ContactForm, t: TFunction): FormErrors => {
    const errors: FormErrors = {}
    if (f.name.trim().length < 2) errors.name = t('contact.errName')
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) errors.email = t('contact.errEmail')
    if (f.phone.trim() && !/^[+\d\s-]{9,16}$/.test(f.phone.trim())) errors.phone = t('contact.errPhone')
    if (f.subject.trim().length < 3) errors.subject = t('contact.errSubject')
    if (f.message.trim().length < 10) errors.message = t('contact.errMessage')
    return errors
}

const inputBase =
    'w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-green-500'

const Contact = () => {
    const { t } = useTranslation()
    const [form, setForm] = useState<ContactForm>(initialForm)
    const [errors, setErrors] = useState<FormErrors>({})
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [serverError, setServerError] = useState('')

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof ContactForm]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }))
        }
        setSent(false)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const found = validate(form, t)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setLoading(true)
        setServerError('')
        try {
            await api.post('/contact', {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                subject: form.subject.trim(),
                message: form.message.trim(),
                website: form.website,
            })
            setSent(true)
            setForm(initialForm)
        } catch (err) {
            setErrors(getFieldErrors(err) as FormErrors)
            setServerError(getErrorMessage(err, t('contact.serverFallback')))
        } finally {
            setLoading(false)
        }
    }

    const fieldClass = (key: keyof ContactForm) =>
        `${inputBase} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <div>
            {/* Header */}
            <section className="bg-green-800 py-16">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-green-300">{t('contact.eyebrow')}</p>
                    <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">{t('contact.title')}</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-green-100">{t('contact.subtitle')}</p>
                </div>
            </section>

            {/* Info cards */}
            <section className="mx-auto -mt-10 max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-4 md:grid-cols-3">
                    {contactCards.map(({ titleKey, icon: Icon, lines }) => (
                        <div key={titleKey} className="rounded-xl bg-white p-6 text-center shadow-md">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                                <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="mt-3 text-lg font-semibold text-gray-900">{t(titleKey)}</h3>
                            <div className="mt-1 space-y-0.5 text-sm text-gray-600">
                                {lines.map((line) => {
                                    const label = line.textKey ? t(line.textKey) : line.text
                                    return line.href ? (
                                        <a key={label} href={line.href} className="block hover:text-green-700">
                                            {label}
                                        </a>
                                    ) : (
                                        <p key={label}>{label}</p>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Form + side info */}
            <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-5">
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 lg:col-span-3">
                        <h2 className="text-2xl font-bold text-green-800">{t('contact.sendTitle')}</h2>
                        <p className="mt-1 text-sm text-gray-500">{t('contact.required')}</p>

                        {sent && (
                            <div
                                role="status"
                                className="mt-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
                            >
                                <FaCircleCheck className="mt-0.5 h-5 w-5 shrink-0" />
                                <p className="text-sm">{t('contact.sent')}</p>
                            </div>
                        )}

                        {serverError && (
                            <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                {serverError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                            {/* Hidden from people, but bots fill it in. Real visitors never see or reach it. */}
                            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                                <label htmlFor="website">Website</label>
                                <input
                                    id="website"
                                    name="website"
                                    type="text"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={form.website}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                                        {t('contact.fullName')}
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="John Mushi"
                                        className={fieldClass('name')}
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                                        {t('contact.emailLabel')}
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className={fieldClass('email')}
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                                </div>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                                        {t('contact.phone')}
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="+255 ..."
                                        className={fieldClass('phone')}
                                    />
                                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label htmlFor="subject" className="mb-1 block text-sm font-medium text-gray-700">
                                        {t('contact.subject')}
                                    </label>
                                    <input
                                        id="subject"
                                        name="subject"
                                        type="text"
                                        maxLength={150}
                                        value={form.subject}
                                        onChange={handleChange}
                                        placeholder={t('contact.subjectPlaceholder')}
                                        className={fieldClass('subject')}
                                    />
                                    {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
                                    {t('contact.message')}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={6}
                                    maxLength={3000}
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder={t('contact.messagePlaceholder')}
                                    className={`${fieldClass('message')} resize-y`}
                                />
                                {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg bg-green-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                                {loading ? t('contact.sending') : t('contact.send')}
                            </button>
                        </form>
                    </div>

                    <aside className="space-y-6 lg:col-span-2">
                        <div className="rounded-xl bg-green-50 p-6">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-green-800">
                                <FaClock className="h-4 w-4" /> {t('contact.helpTitle')}
                            </h3>
                            <p className="mt-2 text-sm text-gray-600">
                                {t('contact.helpPart1')}{' '}
                                <a href="mailto:helpdesk@uhwf.or.tz" className="font-medium text-green-700 hover:underline">
                                    helpdesk@uhwf.or.tz
                                </a>
                                {t('contact.helpPart2')}{' '}
                                <a href="mailto:info@uhwf.or.tz" className="font-medium text-green-700 hover:underline">
                                    info@uhwf.or.tz
                                </a>
                                {t('contact.helpPart3')}
                            </p>
                        </div>

                        <div className="rounded-xl bg-green-50 p-6">
                            <h3 className="text-lg font-semibold text-green-800">{t('contact.followTitle')}</h3>
                            <p className="mt-1 text-sm text-gray-600">{t('contact.followText')}</p>
                            <div className="mt-4 flex flex-wrap gap-3">
                                {socials.map(({ label, href, icon: Icon }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white transition-colors hover:bg-green-900"
                                    >
                                        <Icon className="h-4 w-4" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                            <iframe
                                title={t('contact.mapTitle')}
                                src="https://maps.google.com/maps?q=Ubungo,Dar+es+Salaam,Tanzania&z=14&output=embed"
                                className="h-64 w-full"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    )
}

export default Contact
