// import { Link } from 'react-router-dom'
// import type { IconType } from 'react-icons'
// import {
//     FaBriefcase,
//     FaBinoculars,
//     FaMicroscope,
//     FaUsers,
//     FaMapMarkerAlt,
//     FaArrowRight,
//     FaLeaf,
//     FaChartLine,
//     FaHeart,
// } from 'react-icons/fa'

// type Job = {
//     id: number
//     title: string
//     location: string
//     type: 'Full-time' | 'Contract' | 'Part-time' | 'Internship'
//     description: string
//     icon: IconType
// }

// // Leave empty to show "No open positions". Later this will come from the backend.
// const jobs: Job[] = [
//     {
//         id: 1,
//         title: 'Conservation Field Officer',
//         location: 'Arusha',
//         type: 'Full-time',
//         description:
//             'Join our field team to support wildlife monitoring, anti-poaching efforts, and habitat protection across northern Tanzania.',
//         icon: FaBinoculars,
//     },
//     {
//         id: 2,
//         title: 'Research Assistant (Human-Wildlife Conflict)',
//         location: 'Dar es Salaam',
//         type: 'Contract',
//         description:
//             'Support research and data analysis to understand and reduce human-wildlife conflict in local communities.',
//         icon: FaMicroscope,
//     },
//     {
//         id: 3,
//         title: 'Community Outreach Coordinator',
//         location: 'Remote / Hybrid',
//         type: 'Full-time',
//         description:
//             'Lead community engagement and education initiatives that promote coexistence between people and wildlife.',
//         icon: FaUsers,
//     },
// ]

// const benefits: { title: string; text: string; icon: IconType }[] = [
//     {
//         title: 'Impact',
//         text: "Make a tangible difference for Tanzania's wildlife and ecosystems.",
//         icon: FaLeaf,
//     },
//     {
//         title: 'Growth',
//         text: 'Opportunities for learning, development, and career growth.',
//         icon: FaChartLine,
//     },
//     {
//         title: 'Community',
//         text: 'Work alongside passionate people and local communities.',
//         icon: FaUsers,
//     },
//     {
//         title: 'Purpose',
//         text: 'Be part of a mission-driven organization that values integrity and sustainability.',
//         icon: FaHeart,
//     },
// ]

// const SectionTitle = ({ children }: { children: string }) => (
//     <div className="text-center">
//         <h2 className="text-2xl font-bold text-green-900 sm:text-3xl">{children}</h2>
//         <div className="mx-auto mt-2 h-1 w-14 rounded bg-amber-400" />
//     </div>
// )

// const Career = () => {
//     return (
//         <div>
//             {/* Hero */}
//             <section className="relative overflow-hidden bg-gradient-to-r from-green-50 via-lime-50 to-green-100">
//                 {/* soft decorative circles */}
//                 <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-200/40" />
//                 <div className="pointer-events-none absolute -bottom-32 right-40 h-72 w-72 rounded-full bg-lime-200/40" />

//                 <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
//                     <h1 className="text-4xl font-extrabold text-green-950 sm:text-5xl lg:text-6xl">
//                         Join Our Mission
//                     </h1>
//                     <p className="mt-4 max-w-xl text-lg text-gray-700">
//                         Build a career that protects wildlife and empowers communities in
//                         Tanzania.
//                     </p>
//                     <a
//                         href="#openings"
//                         className="mt-7 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-semibold text-green-950 shadow-sm transition-colors hover:bg-amber-300"
//                     >
//                         <FaBriefcase className="h-4 w-4" />
//                         View Open Positions
//                     </a>
//                 </div>
//             </section>

//             {/* Openings + Why work with us */}
//             <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
//                 <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
//                     {/* Current openings */}
//                     <div id="openings" className="scroll-mt-24">
//                         <SectionTitle>Current Openings</SectionTitle>

//                         {jobs.length === 0 ? (
//                             <div className="mt-10 rounded-xl border border-dashed border-green-200 bg-green-50 p-10 text-center">
//                                 <FaBriefcase className="mx-auto h-10 w-10 text-green-300" />
//                                 <p className="mt-4 text-gray-600">
//                                     There are no open positions right now.
//                                 </p>
//                                 <p className="text-sm text-gray-400">
//                                     Please check back soon, or send us your CV at{' '}
//                                     <a
//                                         href="mailto:info@uhwf.or.tz"
//                                         className="font-medium text-green-700 hover:underline"
//                                     >
//                                         info@uhwf.or.tz
//                                     </a>
//                                     .
//                                 </p>
//                             </div>
//                         ) : (
//                             <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
//                                 {jobs.map(({ id, title, location, type, description, icon: Icon }) => (
//                                     <article
//                                         key={id}
//                                         className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
//                                     >
//                                         <div className="flex items-center gap-3">
//                                             <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800">
//                                                 <Icon className="h-6 w-6" />
//                                             </div>
//                                             <h3 className="text-lg font-bold leading-snug text-green-950">
//                                                 {title}
//                                             </h3>
//                                         </div>

//                                         <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
//                                             <span className="flex items-center gap-1.5 text-gray-700">
//                                                 <FaMapMarkerAlt className="h-3.5 w-3.5 text-green-800" />
//                                                 {location}
//                                             </span>
//                                             <span className="rounded-md bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
//                                                 {type}
//                                             </span>
//                                         </div>

//                                         <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
//                                             {description}
//                                         </p>

//                                         <Link
//                                             to={`/career/apply/${id}`}
//                                             className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-300"
//                                         >
//                                             Apply Now <FaArrowRight className="h-3.5 w-3.5" />
//                                         </Link>
//                                     </article>
//                                 ))}
//                             </div>
//                         )}
//                     </div>

//                     {/* Why work with us */}
//                     <aside className="lg:border-l lg:border-gray-200 lg:pl-8">
//                         <SectionTitle>Why Work With Us</SectionTitle>
//                         <ul className="mt-8 space-y-1">
//                             {benefits.map(({ title, text, icon: Icon }, i) => (
//                                 <li
//                                     key={title}
//                                     className={`flex items-start gap-4 py-4 ${i < benefits.length - 1 ? 'border-b border-gray-200' : ''
//                                         }`}
//                                 >
//                                     <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800">
//                                         <Icon className="h-5 w-5" />
//                                     </div>
//                                     <div>
//                                         <h3 className="font-bold text-green-950">{title}</h3>
//                                         <p className="mt-0.5 text-sm leading-snug text-gray-600">{text}</p>
//                                     </div>
//                                 </li>
//                             ))}
//                         </ul>
//                     </aside>
//                 </div>
//             </section>
//         </div>
//     )
// }

// export default Career
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
