// import { useEffect, useState } from 'react'
// import { getErrorMessage } from '../../services/api'
// import { getCourseDetail, listMyCourses } from '../../services/student'
// import type { CourseDetail, MyCourse } from '../../services/student'
// import ModalShell from '../admin/users/ModalShell'

// const attendanceClass = (pct: number | null) =>
//     pct === null ? 'text-gray-500' : pct < 75 ? 'font-semibold text-amber-700' : 'font-semibold text-green-700'

// const CourseModal = ({ courseId, onClose }: { courseId: number; onClose: () => void }) => {
//     const [detail, setDetail] = useState<CourseDetail | null>(null)
//     const [error, setError] = useState('')

//     useEffect(() => {
//         let cancelled = false
//         getCourseDetail(courseId)
//             .then((d) => {
//                 if (!cancelled) setDetail(d)
//             })
//             .catch((err) => {
//                 if (!cancelled) setError(getErrorMessage(err, 'Could not load this course.'))
//             })
//         return () => {
//             cancelled = true
//         }
//     }, [courseId])

//     return (
//         <ModalShell
//             title={detail ? `${detail.course.code}: ${detail.course.title}` : 'Course'}
//             subtitle={detail ? `${detail.course.department} · ${detail.course.credits} credits` : undefined}
//             onClose={onClose}
//             wide
//         >
//             {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
//             {!detail && !error && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}

//             {detail && (
//                 <div className="space-y-5">
//                     <dl className="grid gap-3 rounded-lg bg-green-50 p-4 text-sm sm:grid-cols-3">
//                         <div>
//                             <dt className="text-xs text-gray-500">Lecturer</dt>
//                             <dd className="font-medium text-green-950">{detail.course.lecturer ?? 'Not assigned yet'}</dd>
//                         </div>
//                         <div>
//                             <dt className="text-xs text-gray-500">Attendance</dt>
//                             <dd className={attendanceClass(detail.attendance.pct)}>
//                                 {detail.attendance.pct === null ? 'No sessions yet' : `${detail.attendance.pct}%`}
//                             </dd>
//                         </div>
//                         <div>
//                             <dt className="text-xs text-gray-500">Sessions</dt>
//                             <dd className="font-medium text-green-950">
//                                 {detail.attendance.present} present, {detail.attendance.absent} absent
//                             </dd>
//                         </div>
//                     </dl>
//                     {detail.course.description && <p className="text-sm text-gray-700">{detail.course.description}</p>}

//                     <section>
//                         <h3 className="mb-2 text-sm font-semibold text-green-900">Announcements</h3>
//                         {detail.announcements.length === 0 ? (
//                             <p className="text-sm text-gray-500">No announcements yet.</p>
//                         ) : (
//                             <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
//                                 {detail.announcements.map((a) => (
//                                     <li key={a.id} className="p-3 text-sm">
//                                         <p className="font-medium text-green-950">{a.title}</p>
//                                         <p className="mt-0.5 whitespace-pre-wrap text-gray-700">{a.body}</p>
//                                         <p className="mt-1 text-xs text-gray-500">
//                                             {a.author} · {new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
//                                         </p>
//                                     </li>
//                                 ))}
//                             </ul>
//                         )}
//                     </section>

//                     <section>
//                         <h3 className="mb-2 text-sm font-semibold text-green-900">Assignments</h3>
//                         {detail.assignments.length === 0 ? (
//                             <p className="text-sm text-gray-500">No assignments yet.</p>
//                         ) : (
//                             <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
//                                 {detail.assignments.map((a) => (
//                                     <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
//                                         <span>
//                                             <span className="font-medium text-green-950">{a.title}</span>
//                                             <span className="block text-xs text-gray-500">
//                                                 Due {new Date(a.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
//                                             </span>
//                                         </span>
//                                         <span className="font-semibold text-green-950">
//                                             {a.score === null ? <span className="font-normal text-gray-500">Not graded yet</span> : `${a.score} / ${a.maxScore}`}
//                                         </span>
//                                     </li>
//                                 ))}
//                             </ul>
//                         )}
//                     </section>

//                     <section>
//                         <h3 className="mb-2 text-sm font-semibold text-green-900">Recent sessions</h3>
//                         {detail.sessions.length === 0 ? (
//                             <p className="text-sm text-gray-500">Your lecturer has not taken attendance yet.</p>
//                         ) : (
//                             <ul className="flex flex-wrap gap-2">
//                                 {detail.sessions.map((s) => (
//                                     <li
//                                         key={s.date}
//                                         className={`rounded px-2 py-1 text-xs font-medium ${s.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                                             }`}
//                                     >
//                                         {new Date(`${s.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}:{' '}
//                                         {s.status === 'present' ? 'Present' : 'Absent'}
//                                     </li>
//                                 ))}
//                             </ul>
//                         )}
//                     </section>
//                 </div>
//             )}
//         </ModalShell>
//     )
// }

// const StudentCourses = () => {
//     const [courses, setCourses] = useState<MyCourse[] | null>(null)
//     const [error, setError] = useState('')
//     const [openId, setOpenId] = useState<number | null>(null)

//     useEffect(() => {
//         let cancelled = false
//         listMyCourses()
//             .then((c) => {
//                 if (!cancelled) setCourses(c)
//             })
//             .catch((err) => {
//                 if (!cancelled) setError(getErrorMessage(err, 'Could not load your courses.'))
//             })
//         return () => {
//             cancelled = true
//         }
//     }, [])

//     return (
//         <div className="mx-auto max-w-5xl space-y-4">
//             <div>
//                 <h1 className="text-2xl font-bold text-green-950">My courses</h1>
//                 <p className="text-sm text-gray-500">The courses you are enrolled in. Open one to see its announcements, assignments and attendance.</p>
//             </div>

//             {error && (
//                 <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
//                     {error}
//                 </p>
//             )}
//             {!courses && !error && <p className="py-8 text-center text-sm text-gray-500">Loading your courses...</p>}
//             {courses && courses.length === 0 && (
//                 <p className="rounded-xl border border-dashed border-green-200 bg-green-50 p-8 text-center text-sm text-gray-600">
//                     You are not enrolled in any course yet.
//                 </p>
//             )}

//             <div className="grid gap-4 md:grid-cols-2">
//                 {courses?.map((c) => (
//                     <article key={c.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                         <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{c.department}</p>
//                         <h2 className="mt-1 text-lg font-bold text-green-950">
//                             {c.code} <span className="font-semibold">{c.title}</span>
//                         </h2>
//                         <p className="text-sm text-gray-500">
//                             {c.credits} credits · {c.lecturer ?? 'Lecturer not assigned yet'}
//                         </p>

//                         <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
//                             <div>
//                                 <dt className="text-xs text-gray-500">Attendance</dt>
//                                 <dd className={attendanceClass(c.attendance.pct)}>{c.attendance.pct === null ? '-' : `${c.attendance.pct}%`}</dd>
//                             </div>
//                             <div>
//                                 <dt className="text-xs text-gray-500">Average score</dt>
//                                 <dd className="font-semibold text-green-950">{c.averagePct === null ? '-' : `${c.averagePct}%`}</dd>
//                             </div>
//                             <div>
//                                 <dt className="text-xs text-gray-500">Graded</dt>
//                                 <dd className="font-semibold text-green-950">
//                                     {c.assignments.graded} of {c.assignments.total}
//                                 </dd>
//                             </div>
//                         </dl>

//                         <button
//                             type="button"
//                             onClick={() => setOpenId(c.id)}
//                             className="mt-4 w-fit rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50"
//                         >
//                             Open course
//                         </button>
//                     </article>
//                 ))}
//             </div>

//             {openId !== null && <CourseModal courseId={openId} onClose={() => setOpenId(null)} />}
//         </div>
//     )
// }

// export default StudentCourses

import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../services/api'
import { getCourseDetail, listMyCourses } from '../../services/student'
import type { CourseDetail, MyCourse } from '../../services/student'
import ModalShell from '../admin/users/ModalShell'

const attendanceClass = (pct: number | null) =>
    pct === null ? 'text-gray-500' : pct < 75 ? 'font-semibold text-amber-700' : 'font-semibold text-green-700'

const CourseModal = ({ courseId, onClose }: { courseId: number; onClose: () => void }) => {
    const [detail, setDetail] = useState<CourseDetail | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        getCourseDetail(courseId)
            .then((d) => {
                if (!cancelled) setDetail(d)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load this course.'))
            })
        return () => {
            cancelled = true
        }
    }, [courseId])

    return (
        <ModalShell
            title={detail ? `${detail.course.code}: ${detail.course.title}` : 'Course'}
            subtitle={detail ? `${detail.course.department} · ${detail.course.credits} credits` : undefined}
            onClose={onClose}
            wide
        >
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {!detail && !error && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}

            {detail && (
                <div className="space-y-5">
                    <dl className="grid gap-3 rounded-lg bg-green-50 p-4 text-sm sm:grid-cols-3">
                        <div>
                            <dt className="text-xs text-gray-500">Lecturer</dt>
                            <dd className="font-medium text-green-950">{detail.course.lecturer ?? 'Not assigned yet'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Attendance</dt>
                            <dd className={attendanceClass(detail.attendance.pct)}>
                                {detail.attendance.pct === null ? 'No sessions yet' : `${detail.attendance.pct}%`}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Sessions</dt>
                            <dd className="font-medium text-green-950">
                                {detail.attendance.present} present, {detail.attendance.absent} absent
                            </dd>
                        </div>
                    </dl>
                    {detail.course.description && <p className="text-sm text-gray-700">{detail.course.description}</p>}

                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-green-900">Announcements</h3>
                        {detail.announcements.length === 0 ? (
                            <p className="text-sm text-gray-500">No announcements yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                                {detail.announcements.map((a) => (
                                    <li key={a.id} className="p-3 text-sm">
                                        <p className="font-medium text-green-950">{a.title}</p>
                                        <p className="mt-0.5 whitespace-pre-wrap text-gray-700">{a.body}</p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {a.author} · {new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-green-900">Assignments</h3>
                        {detail.assignments.length === 0 ? (
                            <p className="text-sm text-gray-500">No assignments yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                                {detail.assignments.map((a) => (
                                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                                        <span>
                                            <span className="font-medium text-green-950">{a.title}</span>
                                            <span className="block text-xs text-gray-500">
                                                Due {new Date(a.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </span>
                                        <span className="font-semibold text-green-950">
                                            {a.score === null ? <span className="font-normal text-gray-500">Not graded yet</span> : `${a.score} / ${a.maxScore}`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-green-900">Recent sessions</h3>
                        {detail.sessions.length === 0 ? (
                            <p className="text-sm text-gray-500">Your lecturer has not taken attendance yet.</p>
                        ) : (
                            <ul className="flex flex-wrap gap-2">
                                {detail.sessions.map((s) => (
                                    <li
                                        key={s.date}
                                        className={`rounded px-2 py-1 text-xs font-medium ${s.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {new Date(`${s.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}:{' '}
                                        {s.status === 'present' ? 'Present' : 'Absent'}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            )}
        </ModalShell>
    )
}

const StudentCourses = () => {
    const [courses, setCourses] = useState<MyCourse[] | null>(null)
    const [error, setError] = useState('')
    const [openId, setOpenId] = useState<number | null>(null)

    useEffect(() => {
        let cancelled = false
        listMyCourses()
            .then((c) => {
                if (!cancelled) setCourses(c)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load your courses.'))
            })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">My courses</h1>
                <p className="text-sm text-gray-500">The courses you are enrolled in. Open one to see its announcements, assignments and attendance.</p>
            </div>

            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            {!courses && !error && <p className="py-8 text-center text-sm text-gray-500">Loading your courses...</p>}
            {courses && courses.length === 0 && (
                <p className="rounded-xl border border-dashed border-green-200 bg-green-50 p-8 text-center text-sm text-gray-600">
                    You are not enrolled in any course yet.
                </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {courses?.map((c) => (
                    <article key={c.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{c.department}</p>
                        <h2 className="mt-1 text-lg font-bold text-green-950">
                            {c.code} <span className="font-semibold">{c.title}</span>
                        </h2>
                        <p className="text-sm text-gray-500">
                            {c.credits} credits · {c.lecturer ?? 'Lecturer not assigned yet'}
                        </p>

                        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                            <div>
                                <dt className="text-xs text-gray-500">Attendance</dt>
                                <dd className={attendanceClass(c.attendance.pct)}>{c.attendance.pct === null ? '-' : `${c.attendance.pct}%`}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Average score</dt>
                                <dd className="font-semibold text-green-950">{c.averagePct === null ? '-' : `${c.averagePct}%`}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Graded</dt>
                                <dd className="font-semibold text-green-950">
                                    {c.assignments.graded} of {c.assignments.total}
                                </dd>
                            </div>
                        </dl>

                        <button
                            type="button"
                            onClick={() => setOpenId(c.id)}
                            className="mt-4 w-fit rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50"
                        >
                            Open course
                        </button>
                    </article>
                ))}
            </div>

            {openId !== null && <CourseModal courseId={openId} onClose={() => setOpenId(null)} />}
        </div>
    )
}

export default StudentCourses
