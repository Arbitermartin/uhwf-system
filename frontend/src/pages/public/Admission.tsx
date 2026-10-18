// import { useState } from 'react'
// import { FaCheckCircle, FaClock, FaLock } from 'react-icons/fa'
// import SignupModal from '../../components/SignupModal'

// // Edit these dates to open or close admission.
// // Later, the administrator will control this from the admin dashboard (Settings).
// const admission = {
//     intake: '2026/2027',
//     opensOn: '2026-09-01',
//     closesOn: '2026-11-30',
// }

// type Status = 'open' | 'upcoming' | 'closed'

// const getStatus = (): Status => {
//     const now = new Date()
//     if (now < new Date(`${admission.opensOn}T00:00:00`)) return 'upcoming'
//     if (now > new Date(`${admission.closesOn}T23:59:59`)) return 'closed'
//     return 'open'
// }

// const formatDate = (iso: string) =>
//     new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
//         day: 'numeric',
//         month: 'short',
//         year: 'numeric',
//     })

// const steps = [
//     { title: 'Create account', text: 'Short popup form', onPage: true },
//     { title: 'Self registration', text: 'Your personal details' },
//     { title: 'Payment', text: 'Pay before choosing courses' },
//     { title: 'Choose courses', text: 'Pick what you want to learn' },
//     { title: 'Requirements', text: 'Upload your documents' },
//     { title: 'Submit and wait', text: 'The administrator approves you' },
// ]

// const Admission = () => {
//     const [modalOpen, setModalOpen] = useState(false)
//     const status = getStatus()

//     const banner = {
//         open: {
//             box: 'bg-green-100 text-green-900',
//             dot: 'bg-green-600',
//             title: 'Registration is open',
//             text: `${admission.intake} intake · closes ${formatDate(admission.closesOn)}`,
//         },
//         upcoming: {
//             box: 'bg-amber-100 text-amber-900',
//             dot: 'bg-amber-600',
//             title: 'Registration opens soon',
//             text: `${admission.intake} intake · opens ${formatDate(admission.opensOn)}`,
//         },
//         closed: {
//             box: 'bg-amber-100 text-amber-900',
//             dot: 'bg-amber-600',
//             title: 'Registration is closed',
//             text: `Applications for ${admission.intake} have ended. Check back for the next intake.`,
//         },
//     }[status]

//     return (
//         <div>
//             {/* Hero */}
//             <section className="relative overflow-hidden bg-gradient-to-r from-green-50 via-lime-50 to-green-100">
//                 <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-200/40" />
//                 <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
//                     <h1 className="text-4xl font-extrabold text-green-950 sm:text-5xl">Admission</h1>
//                     <p className="mt-3 max-w-xl text-lg text-gray-700">
//                         Apply to study with UHWF. Create your student account here, then finish
//                         your application from your dashboard.
//                     </p>

//                     <div
//                         className={`mt-6 flex max-w-lg items-center gap-3 rounded-xl px-4 py-3 ${banner.box}`}
//                         role="status"
//                     >
//                         <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${banner.dot}`} />
//                         <div>
//                             <p className="font-semibold">{banner.title}</p>
//                             <p className="text-sm">{banner.text}</p>
//                         </div>
//                     </div>

//                     {status === 'open' ? (
//                         <button
//                             type="button"
//                             onClick={() => setModalOpen(true)}
//                             className="mt-6 rounded-lg bg-amber-400 px-8 py-3 font-semibold text-green-950 shadow-sm transition-colors hover:bg-amber-300"
//                         >
//                             Apply now
//                         </button>
//                     ) : (
//                         <button
//                             type="button"
//                             disabled
//                             className="mt-6 inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-200 px-8 py-3 font-semibold text-gray-500"
//                         >
//                             {status === 'upcoming' ? <FaClock className="h-4 w-4" /> : <FaLock className="h-4 w-4" />}
//                             {status === 'upcoming' ? 'Not open yet' : 'Registration closed'}
//                         </button>
//                     )}
//                 </div>
//             </section>

//             {/* How to apply */}
//             <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
//                 <h2 className="text-2xl font-bold text-green-900">How to apply</h2>
//                 <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

//                 <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//                     {steps.map((s, i) => (
//                         <div
//                             key={s.title}
//                             className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm"
//                         >
//                             <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 font-bold text-green-950">
//                                 {i + 1}
//                             </div>
//                             <h3 className="mt-3 font-bold text-green-950">{s.title}</h3>
//                             <p className="mt-1 text-sm text-gray-500">{s.text}</p>
//                             <span
//                                 className={`mt-3 inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-medium ${s.onPage ? 'bg-amber-400 text-green-950' : 'bg-green-100 text-green-800'
//                                     }`}
//                             >
//                                 {!s.onPage && <FaCheckCircle className="h-3 w-3" />}
//                                 {s.onPage ? 'On this page' : 'In your dashboard'}
//                             </span>
//                         </div>
//                     ))}
//                 </div>

//                 <p className="mt-6 text-sm text-gray-500">
//                     Student accounts only. Staff accounts are created by the administrator.
//                 </p>
//             </section>

//             {modalOpen && status === 'open' && <SignupModal onClose={() => setModalOpen(false)} />}
//         </div>
//     )
// }

// export default Admission
import { useEffect, useState } from 'react'
import { FaCheckCircle, FaClock, FaLock } from 'react-icons/fa'
import SignupModal from '../../components/SignupModal'
import { api } from '../../services/api'

type Status = 'open' | 'upcoming' | 'closed'

type AdmissionInfo = {
    intake: string
    opensOn: string
    closesOn: string
    status: Status
}

const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })

const steps = [
    { title: 'Create account', text: 'Short popup form', onPage: true },
    { title: 'Self registration', text: 'Your personal details' },
    { title: 'Payment', text: 'Pay before choosing courses' },
    { title: 'Choose courses', text: 'Pick what you want to learn' },
    { title: 'Requirements', text: 'Upload your documents' },
    { title: 'Submit and wait', text: 'The administrator approves you' },
]

const Admission = () => {
    const [modalOpen, setModalOpen] = useState(false)
    const [info, setInfo] = useState<AdmissionInfo | null>(null)
    const [loadFailed, setLoadFailed] = useState(false)

    useEffect(() => {
        api
            .get<AdmissionInfo>('/admission')
            .then((res) => setInfo(res.data))
            .catch(() => setLoadFailed(true))
    }, [])

    const status: Status | 'loading' | 'error' = loadFailed ? 'error' : info ? info.status : 'loading'

    const banner = (() => {
        if (status === 'open' && info) {
            return {
                box: 'bg-green-100 text-green-900',
                dot: 'bg-green-600',
                title: 'Registration is open',
                text: `${info.intake} intake · closes ${formatDate(info.closesOn)}`,
            }
        }
        if (status === 'upcoming' && info) {
            return {
                box: 'bg-amber-100 text-amber-900',
                dot: 'bg-amber-600',
                title: 'Registration opens soon',
                text: `${info.intake} intake · opens ${formatDate(info.opensOn)}`,
            }
        }
        if (status === 'closed' && info) {
            return {
                box: 'bg-amber-100 text-amber-900',
                dot: 'bg-amber-600',
                title: 'Registration is closed',
                text: `Applications for ${info.intake} have ended. Check back for the next intake.`,
            }
        }
        if (status === 'error') {
            return {
                box: 'bg-red-100 text-red-900',
                dot: 'bg-red-600',
                title: 'Could not load admission details',
                text: 'Please check your connection and try again later.',
            }
        }
        return {
            box: 'bg-gray-100 text-gray-700',
            dot: 'bg-gray-400',
            title: 'Checking admission status...',
            text: 'Just a moment.',
        }
    })()

    const buttonLabel =
        status === 'upcoming' ? 'Not open yet' : status === 'closed' ? 'Registration closed' : 'Unavailable'

    return (
        <div>
            <section className="relative overflow-hidden bg-gradient-to-r from-green-50 via-lime-50 to-green-100">
                <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-200/40" />
                <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
                    <h1 className="text-4xl font-extrabold text-green-950 sm:text-5xl">Admission</h1>
                    <p className="mt-3 max-w-xl text-lg text-gray-700">
                        Apply to study with UHWF. Create your student account here, then finish
                        your application from your dashboard.
                    </p>

                    <div
                        className={`mt-6 flex max-w-lg items-center gap-3 rounded-xl px-4 py-3 ${banner.box}`}
                        role="status"
                    >
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${banner.dot}`} />
                        <div>
                            <p className="font-semibold">{banner.title}</p>
                            <p className="text-sm">{banner.text}</p>
                        </div>
                    </div>

                    {status === 'open' ? (
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="mt-6 rounded-lg bg-amber-400 px-8 py-3 font-semibold text-green-950 shadow-sm transition-colors hover:bg-amber-300"
                        >
                            Apply now
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled
                            className="mt-6 inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-200 px-8 py-3 font-semibold text-gray-500"
                        >
                            {status === 'upcoming' ? <FaClock className="h-4 w-4" /> : <FaLock className="h-4 w-4" />}
                            {buttonLabel}
                        </button>
                    )}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-green-900">How to apply</h2>
                <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {steps.map((s, i) => (
                        <div
                            key={s.title}
                            className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm"
                        >
                            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 font-bold text-green-950">
                                {i + 1}
                            </div>
                            <h3 className="mt-3 font-bold text-green-950">{s.title}</h3>
                            <p className="mt-1 text-sm text-gray-500">{s.text}</p>
                            <span
                                className={`mt-3 inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-medium ${s.onPage ? 'bg-amber-400 text-green-950' : 'bg-green-100 text-green-800'
                                    }`}
                            >
                                {!s.onPage && <FaCheckCircle className="h-3 w-3" />}
                                {s.onPage ? 'On this page' : 'In your dashboard'}
                            </span>
                        </div>
                    ))}
                </div>

                <p className="mt-6 text-sm text-gray-500">
                    Student accounts only. Staff accounts are created by the administrator.
                </p>
            </section>

            {modalOpen && status === 'open' && <SignupModal onClose={() => setModalOpen(false)} />}
        </div>
    )
}

export default Admission