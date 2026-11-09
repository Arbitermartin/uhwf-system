// import { useEffect, useState } from 'react'
// import { Link, useParams } from 'react-router-dom'
// import { FaArrowLeft } from 'react-icons/fa'
// import { getPublicNews, longDate } from '../../services/content'
// import type { PublicNewsFull } from '../../services/content'

// const NewsArticle = () => {
//     const { id } = useParams()
//     const [post, setPost] = useState<PublicNewsFull | null>(null)
//     const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')

//     useEffect(() => {
//         const numeric = Number(id)
//         if (!Number.isInteger(numeric) || numeric <= 0) {
//             setStatus('missing')
//             return
//         }
//         let cancelled = false
//         setStatus('loading')
//         getPublicNews(numeric)
//             .then((p) => {
//                 if (cancelled) return
//                 setPost(p)
//                 setStatus('ready')
//             })
//             .catch(() => {
//                 if (!cancelled) setStatus('missing') // not found, not published, or the server is off
//             })
//         return () => {
//             cancelled = true
//         }
//     }, [id])

//     return (
//         <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
//             <Link to="/news" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-700">
//                 <FaArrowLeft className="h-3 w-3" /> All news
//             </Link>

//             {status === 'loading' && <p className="py-16 text-center text-sm text-gray-500">Loading...</p>}

//             {status === 'missing' && (
//                 <div className="py-16 text-center">
//                     <h1 className="text-2xl font-bold text-green-950">Article not found</h1>
//                     <p className="mt-2 text-gray-600">It may have been removed, or the address is wrong.</p>
//                     <Link to="/news" className="mt-6 inline-block rounded-lg bg-amber-400 px-6 py-2.5 font-semibold text-green-950 hover:bg-amber-300">
//                         See the latest news
//                     </Link>
//                 </div>
//             )}

//             {status === 'ready' && post && (
//                 <article className="mt-6">
//                     {post.publishedAt && <p className="text-sm text-gray-400">{longDate(post.publishedAt)}</p>}
//                     <h1 className="mt-1 text-3xl font-bold leading-tight text-green-950 sm:text-4xl">{post.title}</h1>
//                     {post.image && <img src={post.image} alt="" className="mt-6 max-h-[28rem] w-full rounded-xl object-cover" />}
//                     {/* The text is shown as plain text, so nothing an author types can run as code */}
//                     <div className="mt-6 space-y-4 text-lg leading-relaxed text-gray-700">
//                         {post.content.split(/\n{2,}/).map((paragraph, i) => (
//                             <p key={i} className="whitespace-pre-line">
//                                 {paragraph}
//                             </p>
//                         ))}
//                     </div>
//                 </article>
//             )}
//         </div>
//     )
// }

// export default NewsArticle

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FaArrowLeft } from 'react-icons/fa'
import { getPublicNews, longDate } from '../../services/content'
import type { PublicNewsFull } from '../../services/content'

const NewsArticle = () => {
    const { i18n } = useTranslation()
    const locale = i18n.language.startsWith('sw') ? 'sw-TZ' : 'en-GB'

    const { id } = useParams()
    const [post, setPost] = useState<PublicNewsFull | null>(null)
    const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')

    useEffect(() => {
        const numeric = Number(id)
        if (!Number.isInteger(numeric) || numeric <= 0) {
            setStatus('missing')
            return
        }
        let cancelled = false
        setStatus('loading')
        getPublicNews(numeric)
            .then((p) => {
                if (cancelled) return
                setPost(p)
                setStatus('ready')
            })
            .catch(() => {
                if (!cancelled) setStatus('missing') // not found, not published, or the server is off
            })
        return () => {
            cancelled = true
        }
    }, [id])

    return (
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <Link to="/news" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-700">
                <FaArrowLeft className="h-3 w-3" /> All news
            </Link>

            {status === 'loading' && <p className="py-16 text-center text-sm text-gray-500">Loading...</p>}

            {status === 'missing' && (
                <div className="py-16 text-center">
                    <h1 className="text-2xl font-bold text-green-950">Article not found</h1>
                    <p className="mt-2 text-gray-600">It may have been removed, or the address is wrong.</p>
                    <Link to="/news" className="mt-6 inline-block rounded-lg bg-amber-400 px-6 py-2.5 font-semibold text-green-950 hover:bg-amber-300">
                        See the latest news
                    </Link>
                </div>
            )}

            {status === 'ready' && post && (
                <article className="mt-6">
                    {post.publishedAt && <p className="text-sm text-gray-400">{longDate(post.publishedAt, locale)}</p>}
                    <h1 className="mt-1 text-3xl font-bold leading-tight text-green-950 sm:text-4xl">{post.title}</h1>
                    {post.image && <img src={post.image} alt="" className="mt-6 max-h-[28rem] w-full rounded-xl object-cover" />}
                    {/* The text is shown as plain text, so nothing an author types can run as code */}
                    <div className="mt-6 space-y-4 text-lg leading-relaxed text-gray-700">
                        {post.content.split(/\n{2,}/).map((paragraph, i) => (
                            <p key={i} className="whitespace-pre-line">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </article>
            )}
        </div>
    )
}

export default NewsArticle
