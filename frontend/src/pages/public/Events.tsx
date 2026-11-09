// import { useEffect, useState } from 'react'
// import { FaMapMarkerAlt } from 'react-icons/fa'
// import { getErrorMessage } from '../../services/api'
// import { badgeParts, eventWhen, listPublicEvents } from '../../services/content'
// import type { PublicEvent } from '../../services/content'

// const Events = () => {
//     const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming')
//     const [page, setPage] = useState(1)
//     const [data, setData] = useState<{ events: PublicEvent[]; total: number; pageSize: number } | null>(null)
//     const [error, setError] = useState('')

//     useEffect(() => {
//         let cancelled = false
//         setData(null)
//         listPublicEvents(scope, page)
//             .then((res) => {
//                 if (!cancelled) {
//                     setData(res)
//                     setError('')
//                 }
//             })
//             .catch((err) => {
//                 if (!cancelled) setError(getErrorMessage(err, 'The events could not be loaded.'))
//             })
//         return () => {
//             cancelled = true
//         }
//     }, [scope, page])

//     const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

//     return (
//         <div>
//             <section className="bg-green-800 py-14">
//                 <div className="mx-auto max-w-4xl px-4 text-center">
//                     <p className="text-sm font-semibold uppercase tracking-widest text-green-300">Events</p>
//                     <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">Our Events</h1>
//                     <p className="mx-auto mt-4 max-w-2xl text-green-100">Workshops, meetings and activities of the foundation.</p>
//                 </div>
//             </section>

//             <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
//                 <div className="flex gap-2">
//                     {(['upcoming', 'past'] as const).map((s) => (
//                         <button
//                             key={s}
//                             type="button"
//                             aria-pressed={scope === s}
//                             onClick={() => {
//                                 setScope(s)
//                                 setPage(1)
//                             }}
//                             className={`rounded-full border px-5 py-2 text-sm font-medium ${scope === s ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
//                                 }`}
//                         >
//                             {s === 'upcoming' ? 'Upcoming' : 'Past'}
//                         </button>
//                     ))}
//                 </div>

//                 {error && (
//                     <p role="alert" className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
//                         {error}
//                     </p>
//                 )}
//                 {!data && !error && <p className="py-10 text-center text-sm text-gray-500">Loading...</p>}
//                 {data && data.events.length === 0 && (
//                     <div className="mt-8 rounded-xl border border-dashed border-green-200 bg-green-50 p-10 text-center">
//                         <p className="text-gray-500">{scope === 'upcoming' ? 'No upcoming events scheduled.' : 'No past events yet.'}</p>
//                         {scope === 'upcoming' && <p className="text-sm text-gray-400">Check back soon for updates.</p>}
//                     </div>
//                 )}

//                 <div className="mt-8 space-y-4">
//                     {data?.events.map((e) => {
//                         const badge = badgeParts(e.date)
//                         return (
//                             <article key={e.id} className="flex gap-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
//                                 <div
//                                     className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg text-white ${scope === 'upcoming' ? 'bg-green-700' : 'bg-gray-400'
//                                         }`}
//                                 >
//                                     <span className="text-2xl font-bold leading-none">{badge.day}</span>
//                                     <span className="text-xs font-semibold tracking-wide">{badge.month}</span>
//                                 </div>
//                                 <div className="min-w-0">
//                                     <h2 className="text-lg font-semibold text-gray-900">{e.title}</h2>
//                                     <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
//                                         <FaMapMarkerAlt className="h-3 w-3 text-green-600" />
//                                         {e.location} · {eventWhen(e)}
//                                     </p>
//                                     {e.description && <p className="mt-2 whitespace-pre-line text-gray-600">{e.description}</p>}
//                                 </div>
//                             </article>
//                         )
//                     })}
//                 </div>

//                 {data && data.total > data.pageSize && (
//                     <div className="mt-10 flex items-center justify-center gap-3 text-sm text-gray-600">
//                         <button
//                             type="button"
//                             onClick={() => setPage(page - 1)}
//                             disabled={page <= 1}
//                             className="rounded-md border border-green-200 px-4 py-2 text-green-900 hover:bg-green-50 disabled:opacity-40"
//                         >
//                             Previous
//                         </button>
//                         <span>
//                             Page {page} of {totalPages}
//                         </span>
//                         <button
//                             type="button"
//                             onClick={() => setPage(page + 1)}
//                             disabled={page >= totalPages}
//                             className="rounded-md border border-green-200 px-4 py-2 text-green-900 hover:bg-green-50 disabled:opacity-40"
//                         >
//                             Next
//                         </button>
//                     </div>
//                 )}
//             </section>
//         </div>
//     )
// }

// export default Events
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaMapMarkerAlt } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { badgeParts, eventWhen, listPublicEvents } from '../../services/content'
import type { PublicEvent } from '../../services/content'

const Events = () => {
    const { i18n } = useTranslation()
    const locale = i18n.language.startsWith('sw') ? 'sw-TZ' : 'en-GB'

    const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming')
    const [page, setPage] = useState(1)
    const [data, setData] = useState<{ events: PublicEvent[]; total: number; pageSize: number } | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        setData(null)
        listPublicEvents(scope, page)
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'The events could not be loaded.'))
            })
        return () => {
            cancelled = true
        }
    }, [scope, page])

    const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

    return (
        <div>
            <section className="bg-green-800 py-14">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-green-300">Events</p>
                    <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">Our Events</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-green-100">Workshops, meetings and activities of the foundation.</p>
                </div>
            </section>

            <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
                <div className="flex gap-2">
                    {(['upcoming', 'past'] as const).map((s) => (
                        <button
                            key={s}
                            type="button"
                            aria-pressed={scope === s}
                            onClick={() => {
                                setScope(s)
                                setPage(1)
                            }}
                            className={`rounded-full border px-5 py-2 text-sm font-medium ${scope === s ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                                }`}
                        >
                            {s === 'upcoming' ? 'Upcoming' : 'Past'}
                        </button>
                    ))}
                </div>

                {error && (
                    <p role="alert" className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}
                {!data && !error && <p className="py-10 text-center text-sm text-gray-500">Loading...</p>}
                {data && data.events.length === 0 && (
                    <div className="mt-8 rounded-xl border border-dashed border-green-200 bg-green-50 p-10 text-center">
                        <p className="text-gray-500">{scope === 'upcoming' ? 'No upcoming events scheduled.' : 'No past events yet.'}</p>
                        {scope === 'upcoming' && <p className="text-sm text-gray-400">Check back soon for updates.</p>}
                    </div>
                )}

                <div className="mt-8 space-y-4">
                    {data?.events.map((e) => {
                        const badge = badgeParts(e.date, locale)
                        return (
                            <article key={e.id} className="flex gap-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                <div
                                    className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg text-white ${scope === 'upcoming' ? 'bg-green-700' : 'bg-gray-400'
                                        }`}
                                >
                                    <span className="text-2xl font-bold leading-none">{badge.day}</span>
                                    <span className="text-xs font-semibold tracking-wide">{badge.month}</span>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-semibold text-gray-900">{e.title}</h2>
                                    <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                                        <FaMapMarkerAlt className="h-3 w-3 text-green-600" />
                                        {e.location} · {eventWhen(e, locale)}
                                    </p>
                                    {e.description && <p className="mt-2 whitespace-pre-line text-gray-600">{e.description}</p>}
                                </div>
                            </article>
                        )
                    })}
                </div>

                {data && data.total > data.pageSize && (
                    <div className="mt-10 flex items-center justify-center gap-3 text-sm text-gray-600">
                        <button
                            type="button"
                            onClick={() => setPage(page - 1)}
                            disabled={page <= 1}
                            className="rounded-md border border-green-200 px-4 py-2 text-green-900 hover:bg-green-50 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <span>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage(page + 1)}
                            disabled={page >= totalPages}
                            className="rounded-md border border-green-200 px-4 py-2 text-green-900 hover:bg-green-50 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Events
