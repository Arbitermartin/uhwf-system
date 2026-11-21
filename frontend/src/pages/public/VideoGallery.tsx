
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
    FaSearch,
    FaPlay,
    FaTimes,
    FaVideoSlash,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { listPublicVideos } from '../../services/videos'
import type { PublicVideo, VideoCategory } from '../../services/videos'

type Category = VideoCategory
type Video = PublicVideo

const categories: ('All' | Category)[] = ['All', 'Conservation', 'Community', 'Research', 'Events']

// Background colour shown while the YouTube picture loads
const thumbBg: Record<Category, string> = {
    Conservation: 'bg-green-200',
    Community: 'bg-amber-100',
    Research: 'bg-emerald-200',
    Events: 'bg-lime-200',
}

const PAGE_SIZE = 6

const formatDate = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })

const thumbUrl = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`

const Thumbnail = ({
    video,
    className,
    big = false,
}: {
    video: Video
    className: string
    big?: boolean
}) => (
    <div className={`relative overflow-hidden ${thumbBg[video.category] ?? 'bg-green-200'} ${className}`}>
        {video.youtubeId && (
            <img
                src={thumbUrl(video.youtubeId)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
            />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
            <span
                className={`flex items-center justify-center rounded-full bg-amber-400 text-green-950 shadow-md transition-transform group-hover:scale-110 ${big ? 'h-16 w-16' : 'h-11 w-11'
                    }`}
            >
                <FaPlay className={big ? 'ml-1 h-6 w-6' : 'ml-0.5 h-4 w-4'} />
            </span>
        </div>
        {!big && video.duration && (
            <span className="absolute bottom-2 right-2 rounded bg-green-950 px-1.5 py-0.5 text-xs text-white">
                {video.duration}
            </span>
        )}
    </div>
)

const VideoModal = ({ video, onClose }: { video: Video; onClose: () => void }) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = previous
        }
    }, [onClose])

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={video.title}
        >
            <div
                className="w-full max-w-3xl overflow-hidden rounded-xl bg-white"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-3">
                    <h3 className="font-semibold text-green-950">{video.title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close video"
                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    >
                        <FaTimes className="h-5 w-5" />
                    </button>
                </div>

                <div className="aspect-video bg-black">
                    {video.youtubeId ? (
                        <iframe
                            className="h-full w-full"
                            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                            title={video.title}
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                            allowFullScreen
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-300">
                            <FaVideoSlash className="h-10 w-10" />
                            <p className="text-sm">This video is not available yet.</p>
                        </div>
                    )}
                </div>

                <div className="px-5 py-4">
                    {video.description && <p className="text-sm text-gray-600">{video.description}</p>}
                    <p className="mt-2 text-xs text-gray-400">
                        {video.category} · {formatDate(video.date)}
                        {video.duration ? ` · ${video.duration}` : ''}
                    </p>
                </div>
            </div>
        </div>
    )
}

const VideoGallery = () => {
    const [videos, setVideos] = useState<Video[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [category, setCategory] = useState<'All' | Category>('All')
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [active, setActive] = useState<Video | null>(null)

    useEffect(() => {
        let cancelled = false
        listPublicVideos()
            .then((list) => {
                if (!cancelled) setVideos(list)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'The videos could not be loaded.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    const featured = videos.find((v) => v.featured)

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return videos
            .filter((v) => category === 'All' || v.category === category)
            .filter(
                (v) =>
                    !q ||
                    v.title.toLowerCase().includes(q) ||
                    v.description.toLowerCase().includes(q),
            )
            .sort((a, b) => b.date.localeCompare(a.date))
    }, [videos, category, query])

    // Show the featured block only when no filter or search is active
    const showFeatured = !!featured && category === 'All' && !query.trim()
    const list = showFeatured ? filtered.filter((v) => v.id !== featured!.id) : filtered

    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
    const current = Math.min(page, totalPages)
    const visible = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

    const changeCategory = (c: 'All' | Category) => {
        setCategory(c)
        setPage(1)
    }

    const changeQuery = (e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value)
        setPage(1)
    }

    return (
        <div>
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-r from-green-50 via-lime-50 to-green-100">
                <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-200/40" />
                <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
                    <h1 className="text-4xl font-extrabold text-green-950 sm:text-5xl">
                        Video Gallery
                    </h1>
                    <p className="mt-3 max-w-xl text-lg text-gray-700">
                        Watch our work in the field, with communities, and in research.
                    </p>

                    <div className="mt-6 flex max-w-md items-center gap-3 rounded-lg border border-green-200 bg-white px-4 shadow-sm focus-within:ring-2 focus-within:ring-green-500">
                        <FaSearch className="h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={changeQuery}
                            placeholder="Search videos"
                            aria-label="Search videos"
                            className="w-full bg-transparent py-3 text-gray-900 outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                {/* Category filters */}
                <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => changeCategory(c)}
                            aria-pressed={category === c}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${category === c
                                ? 'border-green-900 bg-green-900 text-white'
                                : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
                                }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {/* Featured */}
                {showFeatured && featured && (
                    <button
                        type="button"
                        onClick={() => setActive(featured)}
                        className="group mt-8 grid w-full gap-6 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md md:grid-cols-5"
                    >
                        <div className="relative md:col-span-3">
                            <Thumbnail video={featured} className="aspect-video rounded-xl" big />
                            <span className="absolute left-3 top-3 rounded bg-amber-400 px-2.5 py-1 text-xs font-bold text-green-950">
                                Featured
                            </span>
                        </div>
                        <div className="flex flex-col justify-center md:col-span-2">
                            <span className="w-fit rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                {featured.category}
                            </span>
                            <h2 className="mt-3 text-2xl font-bold leading-snug text-green-950">
                                {featured.title}
                            </h2>
                            {featured.description && <p className="mt-2 text-gray-600">{featured.description}</p>}
                            <p className="mt-2 text-sm text-gray-400">
                                {formatDate(featured.date)}
                                {featured.duration ? ` · ${featured.duration}` : ''}
                            </p>
                            <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-green-950 group-hover:bg-amber-300">
                                <FaPlay className="h-3 w-3" /> Watch now
                            </span>
                        </div>
                    </button>
                )}

                {/* Grid */}
                <div className="mt-12 text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-green-900">
                        {showFeatured ? 'Latest Videos' : 'Results'}
                    </h2>
                    <div className="mx-auto mt-2 h-1 w-14 rounded bg-amber-400 sm:mx-0" />
                </div>

                {loading ? (
                    <p className="mt-8 py-10 text-center text-sm text-gray-500">Loading the videos...</p>
                ) : error ? (
                    <p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">
                        {error}
                    </p>
                ) : visible.length === 0 ? (
                    <div className="mt-8 rounded-xl border border-dashed border-green-200 bg-green-50 p-12 text-center">
                        <FaVideoSlash className="mx-auto h-10 w-10 text-green-300" />
                        <p className="mt-4 text-gray-600">
                            {videos.length === 0 ? 'No videos have been published yet.' : 'No videos found.'}
                        </p>
                        <p className="text-sm text-gray-400">
                            {videos.length === 0
                                ? 'Please check back soon.'
                                : 'Try another category or a different search.'}
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {visible.map((v) => (
                            <button
                                key={v.id}
                                type="button"
                                onClick={() => setActive(v)}
                                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-shadow hover:shadow-md"
                            >
                                <Thumbnail video={v} className="aspect-video" />
                                <div className="p-4">
                                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                        {v.category}
                                    </span>
                                    <h3 className="mt-2 font-bold leading-snug text-green-950">
                                        {v.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">{formatDate(v.date)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav
                        className="mt-10 flex items-center justify-center gap-2"
                        aria-label="Pagination"
                    >
                        <button
                            type="button"
                            onClick={() => setPage(current - 1)}
                            disabled={current === 1}
                            aria-label="Previous page"
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-green-200 text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <FaChevronLeft className="h-3 w-3" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setPage(n)}
                                aria-current={n === current ? 'page' : undefined}
                                className={`h-9 w-9 rounded-md text-sm font-medium ${n === current
                                    ? 'bg-green-900 text-white'
                                    : 'border border-green-200 text-green-900 hover:bg-green-50'
                                    }`}
                            >
                                {n}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setPage(current + 1)}
                            disabled={current === totalPages}
                            aria-label="Next page"
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-green-200 text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <FaChevronRight className="h-3 w-3" />
                        </button>
                    </nav>
                )}
            </section>

            {active && <VideoModal video={active} onClose={() => setActive(null)} />}
        </div>
    )
}

export default VideoGallery