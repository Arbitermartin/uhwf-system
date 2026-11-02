// import { useEffect, useState } from 'react'
// import { getErrorMessage } from '../../services/api'
// import { getResults } from '../../services/student'
// import type { Results } from '../../services/student'

// const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

// const barColor = (pct: number) => (pct < 40 ? 'bg-red-500' : pct < 60 ? 'bg-amber-500' : 'bg-green-600')

// const Summary = ({ label, value, note }: { label: string; value: string; note: string }) => (
//     <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//         <p className="text-xs text-gray-500">{label}</p>
//         <p className="mt-1 text-2xl font-bold text-green-950">{value}</p>
//         <p className="text-xs text-gray-500">{note}</p>
//     </div>
// )

// const StudentResults = () => {
//     const [data, setData] = useState<Results | null>(null)
//     const [error, setError] = useState('')

//     useEffect(() => {
//         let cancelled = false
//         getResults()
//             .then((r) => {
//                 if (!cancelled) setData(r)
//             })
//             .catch((err) => {
//                 if (!cancelled) setError(getErrorMessage(err, 'Could not load your results.'))
//             })
//         return () => {
//             cancelled = true
//         }
//     }, [])

//     return (
//         <div className="mx-auto max-w-4xl space-y-4">
//             <div>
//                 <h1 className="text-2xl font-bold text-green-950">Results</h1>
//                 <p className="text-sm text-gray-500">Your scores for every assignment, and your averages.</p>
//             </div>

//             {error && (
//                 <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
//                     {error}
//                 </p>
//             )}
//             {!data && !error && <p className="py-8 text-center text-sm text-gray-500">Loading your results...</p>}

//             {data && (
//                 <>
//                     <div className="grid gap-4 sm:grid-cols-3">
//                         <Summary
//                             label="Average score"
//                             value={data.overall.averagePct === null ? '-' : `${data.overall.averagePct}%`}
//                             note={data.overall.averagePct === null ? 'Nothing graded yet' : 'Of all graded assignments'}
//                         />
//                         <Summary
//                             label="Attendance"
//                             value={data.overall.attendancePct === null ? '-' : `${data.overall.attendancePct}%`}
//                             note={data.overall.attendancePct === null ? 'No sessions recorded yet' : 'Across all courses'}
//                         />
//                         <Summary label="Graded" value={`${data.overall.graded} of ${data.overall.total}`} note="Assignments with a score" />
//                     </div>

//                     {data.courses.length === 0 && (
//                         <p className="rounded-xl border border-dashed border-green-200 bg-green-50 p-8 text-center text-sm text-gray-600">
//                             You are not enrolled in any course yet.
//                         </p>
//                     )}

//                     {data.courses.map((c) => (
//                         <section key={c.courseId} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                             <div className="flex flex-wrap items-baseline justify-between gap-2">
//                                 <h2 className="font-semibold text-green-950">
//                                     {c.code} <span className="font-normal text-gray-700">{c.title}</span>
//                                 </h2>
//                                 <p className="text-sm text-gray-600">
//                                     Average: <strong className="text-green-950">{c.averagePct === null ? '-' : `${c.averagePct}%`}</strong>
//                                     {' · '}Attendance: <strong className="text-green-950">{c.attendancePct === null ? '-' : `${c.attendancePct}%`}</strong>
//                                 </p>
//                             </div>

//                             {c.assignments.length === 0 ? (
//                                 <p className="mt-3 text-sm text-gray-500">No assignments in this course yet.</p>
//                             ) : (
//                                 <ul className="mt-3 divide-y divide-gray-100">
//                                     {c.assignments.map((a) => {
//                                         const pastDue = new Date(a.dueDate).getTime() < Date.now()
//                                         return (
//                                             <li key={a.id} className="py-3">
//                                                 <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
//                                                     <span className="font-medium text-green-950">{a.title}</span>
//                                                     {a.score === null ? (
//                                                         <span className="text-gray-500">{pastDue ? 'Not graded yet' : `Due ${shortDate(a.dueDate)}`}</span>
//                                                     ) : (
//                                                         <span className="font-semibold text-green-950">
//                                                             {a.score} / {a.maxScore} <span className="font-normal text-gray-500">({a.pct}%)</span>
//                                                         </span>
//                                                     )}
//                                                 </div>
//                                                 {a.pct !== null && (
//                                                     <div
//                                                         className="mt-2 h-1.5 rounded bg-gray-100"
//                                                         role="progressbar"
//                                                         aria-label={`${a.title} score`}
//                                                         aria-valuenow={a.pct}
//                                                         aria-valuemin={0}
//                                                         aria-valuemax={100}
//                                                     >
//                                                         <div className={`h-1.5 rounded ${barColor(a.pct)}`} style={{ width: `${a.pct}%` }} />
//                                                     </div>
//                                                 )}
//                                             </li>
//                                         )
//                                     })}
//                                 </ul>
//                             )}
//                         </section>
//                     ))}
//                 </>
//             )}
//         </div>
//     )
// }

// export default StudentResults

import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../services/api'
import { getResults } from '../../services/student'
import type { Results } from '../../services/student'

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

const barColor = (pct: number) => (pct < 40 ? 'bg-red-500' : pct < 60 ? 'bg-amber-500' : 'bg-green-600')

const Summary = ({ label, value, note }: { label: string; value: string; note: string }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-green-950">{value}</p>
        <p className="text-xs text-gray-500">{note}</p>
    </div>
)

const StudentResults = () => {
    const [data, setData] = useState<Results | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        getResults()
            .then((r) => {
                if (!cancelled) setData(r)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load your results.'))
            })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div className="mx-auto max-w-4xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">Results</h1>
                <p className="text-sm text-gray-500">Your scores for every assignment, and your averages.</p>
            </div>

            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            {!data && !error && <p className="py-8 text-center text-sm text-gray-500">Loading your results...</p>}

            {data && (
                <>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Summary
                            label="Average score"
                            value={data.overall.averagePct === null ? '-' : `${data.overall.averagePct}%`}
                            note={data.overall.averagePct === null ? 'Nothing graded yet' : 'Of all graded assignments'}
                        />
                        <Summary
                            label="Attendance"
                            value={data.overall.attendancePct === null ? '-' : `${data.overall.attendancePct}%`}
                            note={data.overall.attendancePct === null ? 'No sessions recorded yet' : 'Across all courses'}
                        />
                        <Summary label="Graded" value={`${data.overall.graded} of ${data.overall.total}`} note="Assignments with a score" />
                    </div>

                    {data.courses.length === 0 && (
                        <p className="rounded-xl border border-dashed border-green-200 bg-green-50 p-8 text-center text-sm text-gray-600">
                            You are not enrolled in any course yet.
                        </p>
                    )}

                    {data.courses.map((c) => (
                        <section key={c.courseId} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h2 className="font-semibold text-green-950">
                                    {c.code} <span className="font-normal text-gray-700">{c.title}</span>
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Average: <strong className="text-green-950">{c.averagePct === null ? '-' : `${c.averagePct}%`}</strong>
                                    {' · '}Attendance: <strong className="text-green-950">{c.attendancePct === null ? '-' : `${c.attendancePct}%`}</strong>
                                </p>
                            </div>

                            {c.assignments.length === 0 ? (
                                <p className="mt-3 text-sm text-gray-500">No assignments in this course yet.</p>
                            ) : (
                                <ul className="mt-3 divide-y divide-gray-100">
                                    {c.assignments.map((a) => {
                                        const pastDue = new Date(a.dueDate).getTime() < Date.now()
                                        return (
                                            <li key={a.id} className="py-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                                    <span className="font-medium text-green-950">{a.title}</span>
                                                    {a.score === null ? (
                                                        <span className="text-gray-500">{pastDue ? 'Not graded yet' : `Due ${shortDate(a.dueDate)}`}</span>
                                                    ) : (
                                                        <span className="font-semibold text-green-950">
                                                            {a.score} / {a.maxScore} <span className="font-normal text-gray-500">({a.pct}%)</span>
                                                        </span>
                                                    )}
                                                </div>
                                                {a.pct !== null && (
                                                    <div
                                                        className="mt-2 h-1.5 rounded bg-gray-100"
                                                        role="progressbar"
                                                        aria-label={`${a.title} score`}
                                                        aria-valuenow={a.pct}
                                                        aria-valuemin={0}
                                                        aria-valuemax={100}
                                                    >
                                                        <div className={`h-1.5 rounded ${barColor(a.pct)}`} style={{ width: `${a.pct}%` }} />
                                                    </div>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </section>
                    ))}
                </>
            )}
        </div>
    )
}

export default StudentResults
