import { useEffect, useState } from 'react'
import { FaBriefcase, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { closesText, jobTypeLabel, listPublicJobs } from '../../services/careers'
import type { PublicJob } from '../../services/careers'
import ApplyModal from './career/ApplyModal'

const Career = () => {
    const [jobs, setJobs] = useState<PublicJob[] | null>(null)
    const [error, setError] = useState('')
    const [openId, setOpenId] = useState<number | null>(null) // the job whose full description is shown
    const [applying, setApplying] = useState<PublicJob | null>(null)

    useEffect(() => {
        let cancelled = false
        listPublicJobs()
            .then((j) => {
                if (!cancelled) setJobs(j)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'The jobs could not be loaded right now.'))
            })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div>
            <section className="bg-green-800 py-16">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-green-300">Careers</p>
                    <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">Work With Us</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-green-100">
                        Join the team protecting Tanzania's land, wildlife and communities.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-green-800">Open positions</h2>

                {error && (
                    <p role="alert" className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}
                {!jobs && !error && <p className="py-10 text-center text-sm text-gray-500">Loading...</p>}

                {jobs && jobs.length === 0 && (
                    <div className="mt-6 rounded-xl border border-dashed border-green-200 bg-green-50 p-10 text-center">
                        <FaBriefcase className="mx-auto h-8 w-8 text-green-300" />
                        <p className="mt-3 text-gray-600">There are no open positions right now.</p>
                        <p className="mt-1 text-sm text-gray-500">
                            Please check back soon, or write to us at{' '}
                            <a href="mailto:info@uhwf.or.tz" className="font-medium text-green-700 hover:underline">
                                info@uhwf.or.tz
                            </a>
                            .
                        </p>
                    </div>
                )}

                <div className="mt-6 space-y-4">
                    {jobs?.map((j) => {
                        const expanded = openId === j.id
                        return (
                            <article key={j.id} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-semibold text-gray-900">{j.title}</h3>
                                        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                            <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-800">{jobTypeLabel[j.jobType]}</span>
                                            <span className="flex items-center gap-1">
                                                <FaMapMarkerAlt className="h-3 w-3 text-green-600" /> {j.location}
                                            </span>
                                            {j.closesOn && (
                                                <span className="flex items-center gap-1">
                                                    <FaCalendarAlt className="h-3 w-3 text-green-600" /> Apply by {closesText(j.closesOn)}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setApplying(j)}
                                        className="rounded-md bg-amber-400 px-5 py-2.5 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-300"
                                    >
                                        Apply now
                                    </button>
                                </div>

                                {/* Plain text: nothing an administrator types can run as code */}
                                <div className={`mt-4 whitespace-pre-line text-gray-600 ${expanded ? '' : 'line-clamp-3'}`}>{j.description}</div>
                                <button
                                    type="button"
                                    onClick={() => setOpenId(expanded ? null : j.id)}
                                    aria-expanded={expanded}
                                    className="mt-2 text-sm font-medium text-green-700 hover:text-green-900"
                                >
                                    {expanded ? 'Show less' : 'Read the full description'}
                                </button>
                            </article>
                        )
                    })}
                </div>
            </section>

            {applying && <ApplyModal job={applying} onClose={() => setApplying(null)} />}
        </div>
    )
}

export default Career
