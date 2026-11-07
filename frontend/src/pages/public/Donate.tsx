import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaCheck, FaCopy, FaHandHoldingHeart, FaMobileAlt, FaUniversity } from 'react-icons/fa'
import type { IconType } from 'react-icons'

type Detail = { label: string; value: string; copy?: boolean }

type Method = {
    id: string
    title: string
    note: string
    icon: IconType
    details: Detail[]
}

// PLACEHOLDERS: replace every value below with UHWF's real payment details.
const PAYMENT_METHODS: Method[] = [
    {
        id: 'mpesa',
        title: 'M-Pesa',
        note: 'Open M-Pesa, choose Lipa na M-Pesa, then Paybill or send to the number below.',
        icon: FaMobileAlt,
        details: [
            { label: 'Account name', value: 'Universal Human-Wildlife Foundation' },
            { label: 'Number', value: '000000', copy: true },
        ],
    },
    {
        id: 'tigo',
        title: 'Mixx by Yas (Tigo Pesa)',
        note: 'Choose Pay Bill or Send Money and enter the number below.',
        icon: FaMobileAlt,
        details: [
            { label: 'Account name', value: 'Universal Human-Wildlife Foundation' },
            { label: 'Number', value: '000000', copy: true },
        ],
    },
    {
        id: 'airtel',
        title: 'Airtel Money',
        note: 'Choose Make Payments or Send Money and enter the number below.',
        icon: FaMobileAlt,
        details: [
            { label: 'Account name', value: 'Universal Human-Wildlife Foundation' },
            { label: 'Number', value: '000000', copy: true },
        ],
    },
    {
        id: 'bank',
        title: 'Bank transfer',
        note: 'Use your bank app, a branch, or an agent.',
        icon: FaUniversity,
        details: [
            { label: 'Bank', value: 'Bank name here' },
            { label: 'Account name', value: 'Universal Human-Wildlife Foundation' },
            { label: 'Account number', value: '0000000000', copy: true },
            { label: 'Branch', value: 'Branch name here' },
        ],
    },
]

const CONTACT_EMAIL = 'info@uhwf.or.tz'
const PRESETS = [10000, 20000, 50000, 100000]
const MIN_AMOUNT = 1000
const MAX_AMOUNT = 50000000

const tzs = (n: number) => `TZS ${n.toLocaleString('en-US')}`

const Donate = () => {
    const [preset, setPreset] = useState<number | null>(20000)
    const [custom, setCustom] = useState('')
    const [amountError, setAmountError] = useState('')
    const [methodId, setMethodId] = useState(PAYMENT_METHODS[0].id)
    const [copied, setCopied] = useState('')
    const [copyError, setCopyError] = useState('')
    const timer = useRef<number | undefined>(undefined)

    useEffect(() => () => window.clearTimeout(timer.current), [])

    const method = PAYMENT_METHODS.find((m) => m.id === methodId) ?? PAYMENT_METHODS[0]

    // The custom box wins when it has something in it
    const customNumber = custom ? Number(custom) : null
    const amount = customNumber ?? preset

    const choosePreset = (n: number) => {
        setPreset(n)
        setCustom('')
        setAmountError('')
    }

    const changeCustom = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 9)
        setCustom(digits)
        setPreset(null)
        if (!digits) return setAmountError('')
        const n = Number(digits)
        if (n < MIN_AMOUNT) setAmountError(`The smallest gift is ${tzs(MIN_AMOUNT)}.`)
        else if (n > MAX_AMOUNT) setAmountError(`For gifts above ${tzs(MAX_AMOUNT)}, please contact us.`)
        else setAmountError('')
    }

    const validAmount = amount !== null && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT

    const copy = async (key: string, value: string) => {
        setCopyError('')
        try {
            await navigator.clipboard.writeText(value)
            setCopied(key)
            window.clearTimeout(timer.current)
            timer.current = window.setTimeout(() => setCopied(''), 2000)
        } catch {
            setCopyError('Could not copy. Please select the number and copy it yourself.')
        }
    }

    return (
        <div>
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-r from-green-50 via-lime-50 to-green-100">
                <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-200/40" />
                <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
                    <h1 className="text-4xl font-extrabold text-green-950 sm:text-5xl">Donate</h1>
                    <p className="mt-3 max-w-xl text-lg text-gray-700">
                        Support land use planning, wildlife conservation and community work across Tanzania. Every
                        gift helps.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-5xl space-y-10 px-4 py-14 sm:px-6 lg:px-8">
                {/* Step 1: amount */}
                <section aria-labelledby="amount-title">
                    <h2 id="amount-title" className="text-2xl font-bold text-green-900">
                        1. Choose an amount
                    </h2>
                    <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {PRESETS.map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => choosePreset(n)}
                                aria-pressed={preset === n && !custom}
                                className={`rounded-xl border px-4 py-4 text-center font-semibold transition-colors ${preset === n && !custom
                                    ? 'border-green-900 bg-green-900 text-white'
                                    : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
                                    }`}
                            >
                                {tzs(n)}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 max-w-sm">
                        <label htmlFor="custom" className="mb-1 block text-sm font-medium text-gray-700">
                            Or enter your own amount (TZS)
                        </label>
                        <input
                            id="custom"
                            inputMode="numeric"
                            autoComplete="off"
                            value={custom ? Number(custom).toLocaleString('en-US') : ''}
                            onChange={(e) => changeCustom(e.target.value)}
                            placeholder="For example 35,000"
                            className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-green-500 ${amountError ? 'border-red-400' : 'border-gray-200'
                                }`}
                        />
                        {amountError && <p className="mt-1 text-xs text-red-600">{amountError}</p>}
                    </div>
                </section>

                {/* Step 2: method */}
                <section aria-labelledby="method-title">
                    <h2 id="method-title" className="text-2xl font-bold text-green-900">
                        2. Choose how to pay
                    </h2>
                    <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

                    <div className="mt-6 flex flex-wrap gap-2">
                        {PAYMENT_METHODS.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setMethodId(m.id)}
                                aria-pressed={methodId === m.id}
                                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${methodId === m.id
                                    ? 'border-green-900 bg-green-900 text-white'
                                    : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
                                    }`}
                            >
                                <m.icon className="h-3.5 w-3.5" /> {m.title}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800">
                                <method.icon className="h-6 w-6" />
                            </span>
                            <div>
                                <h3 className="text-lg font-bold text-green-950">{method.title}</h3>
                                <p className="mt-1 text-sm text-gray-600">{method.note}</p>
                            </div>
                        </div>

                        <dl className="mt-5 divide-y divide-gray-100">
                            {method.details.map((d) => {
                                const key = `${method.id}-${d.label}`
                                return (
                                    <div key={key} className="flex flex-wrap items-center justify-between gap-2 py-3">
                                        <dt className="text-sm text-gray-500">{d.label}</dt>
                                        <dd className="flex items-center gap-3">
                                            <span className="font-semibold text-green-950">{d.value}</span>
                                            {d.copy && (
                                                <button
                                                    type="button"
                                                    onClick={() => void copy(key, d.value)}
                                                    aria-label={`Copy ${d.label}`}
                                                    className="inline-flex items-center gap-1.5 rounded-md border border-green-900 px-2.5 py-1 text-xs font-medium text-green-900 hover:bg-green-50"
                                                >
                                                    {copied === key ? (
                                                        <>
                                                            <FaCheck className="h-3 w-3" /> Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaCopy className="h-3 w-3" /> Copy
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </dd>
                                    </div>
                                )
                            })}
                        </dl>
                        {copyError && <p className="mt-2 text-xs text-red-600">{copyError}</p>}

                        <div
                            role="status"
                            className={`mt-5 rounded-xl p-4 text-sm ${validAmount ? 'bg-amber-50 text-amber-950' : 'bg-gray-50 text-gray-600'
                                }`}
                        >
                            {validAmount ? (
                                <>
                                    You are giving <strong>{tzs(amount)}</strong>. Pay this amount with the details
                                    above, and write <strong>Donation</strong> as the reference.
                                </>
                            ) : (
                                'Choose an amount above to see what to pay.'
                            )}
                        </div>
                    </div>
                </section>

                {/* Step 3: after paying */}
                <section
                    aria-labelledby="after-title"
                    className="rounded-2xl border border-green-200 bg-green-50 p-6"
                >
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400 text-green-950">
                            <FaHandHoldingHeart className="h-6 w-6" />
                        </span>
                        <div>
                            <h2 id="after-title" className="text-xl font-bold text-green-950">
                                3. After you pay
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-gray-700">
                                Keep the payment message from your phone or bank. If you would like a receipt, or
                                want to give a larger gift or support a particular project, write to us at{' '}
                                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-green-800 underline">
                                    {CONTACT_EMAIL}
                                </a>{' '}
                                or use the{' '}
                                <Link to="/contact" className="font-semibold text-green-800 underline">
                                    contact page
                                </Link>
                                .
                            </p>
                            <p className="mt-3 text-sm font-medium text-green-900">Thank you for standing with UHWF.</p>
                        </div>
                    </div>
                </section>

                <p className="text-center text-xs text-gray-500">
                    Only send money to the details shown on this page, and never share your PIN with anyone. UHWF
                    will never ask for it.
                </p>
            </div>
        </div>
    )
}

export default Donate