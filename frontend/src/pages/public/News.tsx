// import { useEffect, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { FaNewspaper } from 'react-icons/fa'
// import { getErrorMessage } from '../../services/api'
// import { listPublicNews, longDate } from '../../services/content'
// import type { PublicNews } from '../../services/content'
// import { useTranslation } from 'react-i18next'



// const News = () => {
//     // inside the component, next to the other useState lines:
//     const { i18n } = useTranslation()
//     const locale = i18n.language.startsWith('sw') ? 'sw-TZ' : 'en-GB'
//     const [page, setPage] = useState(1)
//     const [data, setData] = useState<{ news: PublicNews[]; total: number; pageSize: number } | null>(null)
//     const [error, setError] = useState('')

//     useEffect(() => {
//         let cancelled = false
//         listPublicNews(page)
//             .then((res) => {
//                 if (!cancelled) {
//                     setData(res)
//                     setError('')
//                 }
//             })
//             .catch((err) => {
//                 if (!cancelled) setError(getErrorMessage(err, 'The news could not be loaded.'))
//             })
//         return () => {
//             cancelled = true
//         }
//     }, [page])

//     const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

//     return (
//         <div>
//             <section className="bg-green-800 py-14">
//                 <div className="mx-auto max-w-4xl px-4 text-center">
//                     <p className="text-sm font-semibold uppercase tracking-widest text-green-300">News</p>
//                     <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">Latest News</h1>
//                     <p className="mx-auto mt-4 max-w-2xl text-green-100">Updates from the Universal Human-Wildlife Foundation.</p>
//                 </div>
//             </section>

//             <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
//                 {error && (
//                     <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
//                         {error}
//                     </p>
//                 )}
//                 {!data && !error && <p className="py-10 text-center text-sm text-gray-500">Loading...</p>}
//                 {data && data.news.length === 0 && <p className="py-10 text-center text-gray-500">No news has been published yet.</p>}

//                 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//                     {data?.news.map((n) => (
//                         <article key={n.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
//                             {n.image ? (
//                                 <img src={n.image} alt="" loading="lazy" className="h-48 w-full object-cover" />
//                             ) : (
//                                 <span className="flex h-48 w-full items-center justify-center bg-green-50 text-green-200">
//                                     <FaNewspaper className="h-10 w-10" />
//                                 </span>
//                             )}
//                             <div className="flex flex-1 flex-col p-5">
//                                 {n.publishedAt && <p className="text-sm text-gray-400">{longDate(n.publishedAt)}</p>}
//                                 <h2 className="mt-1 text-lg font-semibold text-gray-900">{n.title}</h2>
//                                 <p className="mt-2 flex-1 text-gray-600">{n.excerpt}</p>
//                                 <Link to={`/news/${n.id}`} className="mt-3 inline-block font-medium text-green-700 hover:text-green-900">
//                                     Read more →
//                                 </Link>
//                             </div>
//                         </article>
//                     ))}
//                 </div>

//                 {data && data.total > data.pageSize && (
//                     <div className="mt-10 flex items-center justify-center gap-3 text-sm text-gray-600">
//                         <button
//                             type="button"
//                             onClick={() => setPage(page - 1)}
//                             disabled={page <= 1}
//                             className="rounded-md border border-green-200 px-4 py-2 text-green-900 hover:bg-green-50 disabled:opacity-40"
//                         >
//                             Newer
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
//                             Older
//                         </button>
//                     </div>
//                 )}
//             </section>
//         </div>
//     )
// }

// export default News
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FaNewspaper } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { listPublicNews, longDate } from '../../services/content'
import type { PublicNews } from '../../services/content'

const News = () => {
    const { i18n } = useTranslation()
    const locale = i18n.language.startsWith('sw') ? 'sw-TZ' : 'en-GB'

    const [page, setPage] = useState(1)
    const [data, setData] = useState<{ news: PublicNews[]; total: number; pageSize: number } | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        listPublicNews(page)
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'The news could not be loaded.'))
            })
        return () => {
            cancelled = true
        }
    }, [page])

    const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

    return (
        <div>
            <section className="bg-green-800 py-14">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-green-300">News</p>
                    <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">Latest News</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-green-100">Updates from the Universal Human-Wildlife Foundation.</p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                {error && (
                    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}
                {!data && !error && <p className="py-10 text-center text-sm text-gray-500">Loading...</p>}
                {data && data.news.length === 0 && <p className="py-10 text-center text-gray-500">No news has been published yet.</p>}

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data?.news.map((n) => (
                        <article key={n.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                            {n.image ? (
                                <img src={n.image} alt="" loading="lazy" className="h-48 w-full object-cover" />
                            ) : (
                                <span className="flex h-48 w-full items-center justify-center bg-green-50 text-green-200">
                                    <FaNewspaper className="h-10 w-10" />
                                </span>
                            )}
                            <div className="flex flex-1 flex-col p-5">
                                {n.publishedAt && <p className="text-sm text-gray-400">{longDate(n.publishedAt, locale)}</p>}
                                <h2 className="mt-1 text-lg font-semibold text-gray-900">{n.title}</h2>
                                <p className="mt-2 flex-1 text-gray-600">{n.excerpt}</p>
                                <Link to={`/news/${n.id}`} className="mt-3 inline-block font-medium text-green-700 hover:text-green-900">
                                    Read more →
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                {data && data.total > data.pageSize && (
                    <div className="mt-10 flex items-center justify-center gap-3 text-sm text-gray-600">
                        <button
                            type="button"
                            onClick={() => setPage(page - 1)}
                            disabled={page <= 1}
                            className="rounded-md border border-green-200 px-4 py-2 text-green-900 hover:bg-green-50 disabled:opacity-40"
                        >
                            Newer
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
                            Older
                        </button>
                    </div>
                )}
            </section>
        </div>
    )
}

export default News
