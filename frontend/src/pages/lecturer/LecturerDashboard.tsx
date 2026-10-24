// import { useState } from 'react'
// import type { ReactNode } from 'react'
// import { Link } from 'react-router-dom'
// import {
//     FaBook,
//     FaUsers,
//     FaPencilAlt,
//     FaClipboardCheck,
//     FaExclamationTriangle,
//     FaSearch,
//     FaCheckDouble,
//     FaEnvelope,
// } from 'react-icons/fa'
// import { useAuth } from '../../hooks/useAuth'
// import { useStoredState } from '../../hooks/useStoredState'
// import {
//     AT_RISK_ATTENDANCE,
//     AT_RISK_GRADE,
//     GRADE_MAX,
//     assignments,
//     initialAnnouncements,
//     initialGrades,
//     lecturerCourses,
//     students,
// } from '../../data/lecturer'
// import type { Announcement } from '../../data/lecturer'

// type Mark = 'P' | 'A'
// type Status = 'At risk' | 'Not graded' | 'On track'

// const statusClass: Record<Status, string> = {
//     'At risk': 'bg-red-100 text-red-800',
//     'Not graded': 'bg-amber-100 text-amber-900',
//     'On track': 'bg-green-100 text-green-800',
// }

// const getStatus = (attendancePct: number, grade: string): Status => {
//     const g = grade.trim()
//     if (attendancePct < AT_RISK_ATTENDANCE || (g !== '' && Number(g) < AT_RISK_GRADE)) {
//         return 'At risk'
//     }
//     return g === '' ? 'Not graded' : 'On track'
// }

// const isValidGrade = (v: string) => {
//     const t = v.trim()
//     return t === '' || (!Number.isNaN(Number(t)) && Number(t) >= 0 && Number(t) <= GRADE_MAX)
// }

// // Local date as yyyy-mm-dd (toISOString would use UTC and can be off by a day)
// const localISODate = () => {
//     const d = new Date()
//     const mm = String(d.getMonth() + 1).padStart(2, '0')
//     const dd = String(d.getDate()).padStart(2, '0')
//     return `${d.getFullYear()}-${mm}-${dd}`
// }

// const initials = (name: string) =>
//     name
//         .split(' ')
//         .map((p) => p[0])
//         .join('')

// const StatCard = ({
//     label,
//     value,
//     note,
//     icon,
//     highlight,
//     valueClass = 'text-green-950',
// }: {
//     label: string
//     value: string
//     note: string
//     icon: ReactNode
//     highlight?: boolean
//     valueClass?: string
// }) => (
//     <div
//         className={`rounded-xl border bg-white p-4 shadow-sm ${highlight ? 'border-amber-400' : 'border-gray-200'
//             }`}
//     >
//         <p className="flex items-center gap-1.5 text-xs text-gray-500">
//             {icon} {label}
//         </p>
//         <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
//         <p className="text-xs text-gray-500">{note}</p>
//     </div>
// )

// const GradeInput = ({
//     label,
//     value,
//     onCommit,
// }: {
//     label: string
//     value: string
//     onCommit: (v: string) => void
// }) => {
//     const [text, setText] = useState(value)
//     const bad = !isValidGrade(text)

//     return (
//         <input
//             type="text"
//             inputMode="decimal"
//             value={text}
//             aria-label={label}
//             aria-invalid={bad}
//             title={bad ? `Enter a number from 0 to ${GRADE_MAX}` : undefined}
//             onChange={(e) => {
//                 const v = e.target.value
//                 setText(v)
//                 if (isValidGrade(v)) onCommit(v.trim()) // only valid grades are saved
//             }}
//             className={`h-8 w-14 rounded-md border text-center text-sm text-green-950 outline-none focus:ring-2 focus:ring-green-500 ${bad ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
//                 }`}
//         />
//     )
// }

// const LecturerDashboard = () => {
//     const { user } = useAuth()
//     const base = `uhwf_lecturer_${user?.email ?? 'guest'}`
//     const today = localISODate()

//     const [attendance, setAttendance] = useStoredState<Record<string, Mark>>(`${base}_attendance`, {})
//     const [grades, setGrades] = useStoredState<Record<string, string>>(`${base}_grades`, initialGrades)
//     const [announcements, setAnnouncements] = useStoredState<Announcement[]>(
//         `${base}_announcements`,
//         initialAnnouncements,
//     )

//     const [courseCode, setCourseCode] = useState(lecturerCourses[0].code)
//     const [query, setQuery] = useState('')
//     const [marks, setMarks] = useState<Record<string, Mark>>(attendance)
//     const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null)
//     const [draft, setDraft] = useState('')
//     const [draftError, setDraftError] = useState('')

//     const course = lecturerCourses.find((c) => c.code === courseCode) ?? lecturerCourses[0]
//     const courseStudents = students.filter((s) => course.studentIds.includes(s.id))
//     const q = query.trim().toLowerCase()
//     const visible = courseStudents.filter(
//         (s) => !q || `${s.name} ${s.reg}`.toLowerCase().includes(q),
//     )

//     const markKey = (id: number) => `${today}:${course.code}:${id}`
//     const gradeKey = (id: number) => `${course.code}:${id}`
//     const gradeOf = (id: number) => grades[gradeKey(id)] ?? ''

//     const present = courseStudents.filter((s) => marks[markKey(s.id)] === 'P').length
//     const absent = courseStudents.filter((s) => marks[markKey(s.id)] === 'A').length
//     const atRisk = courseStudents.filter(
//         (s) => getStatus(s.attendancePct, gradeOf(s.id)) === 'At risk',
//     ).length

//     const totalStudents = lecturerCourses.reduce((sum, c) => sum + c.enrolled, 0)
//     const toGrade = assignments.reduce((sum, a) => sum + a.toGrade, 0)
//     const courseAnnouncements = announcements.filter((a) => a.courseCode === course.code)
//     const courseAssignments = assignments

//     const todayLabel = new Date().toLocaleDateString('en-GB', {
//         weekday: 'short',
//         day: 'numeric',
//         month: 'short',
//         year: 'numeric',
//     })

//     const switchCourse = (code: string) => {
//         setCourseCode(code)
//         setQuery('')
//         setNote(null)
//     }

//     const setMark = (id: number, value: Mark) => {
//         setMarks((prev) => ({ ...prev, [markKey(id)]: value }))
//         setNote(null)
//     }

//     const markAllPresent = () => {
//         setMarks((prev) => {
//             const next = { ...prev }
//             courseStudents.forEach((s) => {
//                 next[markKey(s.id)] = 'P'
//             })
//             return next
//         })
//         setNote(null)
//     }

//     const saveAttendance = () => {
//         if (present + absent === 0) {
//             setNote({ text: 'Mark attendance for at least one student first.', bad: true })
//             return
//         }
//         // TODO: await axios.post('/api/attendance', { course: course.code, date: today, marks })
//         setAttendance(marks)
//         setNote({ text: `Attendance saved for ${course.code}, ${todayLabel}.`, bad: false })
//     }

//     const postAnnouncement = () => {
//         const text = draft.trim()
//         if (text.length < 5) {
//             setDraftError('Write at least 5 characters.')
//             return
//         }
//         // TODO: await axios.post('/api/announcements', { courseCode: course.code, text })
//         // The server should also create a notification for every enrolled student.
//         setAnnouncements((prev) => [
//             { id: Date.now(), courseCode: course.code, text, postedAt: new Date().toISOString() },
//             ...prev,
//         ])
//         setDraft('')
//         setDraftError('')
//     }

//     const formatDate = (iso: string) =>
//         new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

//     return (
//         <div className="mx-auto max-w-5xl space-y-4">
//             {/* Heading */}
//             <div className="flex flex-wrap items-center justify-between gap-3">
//                 <div>
//                     <h1 className="text-2xl font-bold text-green-950">Lecturer dashboard</h1>
//                     <p className="text-sm text-gray-500">
//                         Take attendance, grade work and message students in your courses.
//                     </p>
//                 </div>
//                 <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-900">
//                     {todayLabel}
//                 </span>
//             </div>

//             {/* Stats */}
//             <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
//                 <StatCard
//                     label="My courses"
//                     value={String(lecturerCourses.length)}
//                     note="This semester"
//                     icon={<FaBook className="h-3 w-3" />}
//                 />
//                 <StatCard
//                     label="Students"
//                     value={String(totalStudents)}
//                     note="Across courses"
//                     icon={<FaUsers className="h-3 w-3" />}
//                 />
//                 <StatCard
//                     label="To grade"
//                     value={String(toGrade)}
//                     note="Submissions"
//                     icon={<FaPencilAlt className="h-3 w-3" />}
//                     highlight
//                     valueClass="text-amber-700"
//                 />
//                 <StatCard
//                     label="Attendance"
//                     value="91%"
//                     note="This week (sample)"
//                     icon={<FaClipboardCheck className="h-3 w-3" />}
//                 />
//                 <StatCard
//                     label="At risk"
//                     value={String(atRisk)}
//                     note="In this course"
//                     icon={<FaExclamationTriangle className="h-3 w-3" />}
//                     valueClass="text-red-800"
//                 />
//             </div>

//             {/* Course tabs */}
//             <div className="flex flex-wrap gap-2">
//                 {lecturerCourses.map((c) => (
//                     <button
//                         key={c.code}
//                         type="button"
//                         onClick={() => switchCourse(c.code)}
//                         aria-pressed={c.code === course.code}
//                         className={`rounded-lg border px-4 py-2 text-left text-sm transition-colors ${c.code === course.code
//                             ? 'border-green-900 bg-green-900 text-white'
//                             : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
//                             }`}
//                     >
//                         <span className="block font-semibold">{c.code}</span>
//                         <span className="block text-xs opacity-80">{c.enrolled} students</span>
//                     </button>
//                 ))}
//             </div>

//             {/* Students */}
//             <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                 <div className="flex flex-wrap items-start justify-between gap-3">
//                     <div>
//                         <h2 className="font-semibold text-green-950">
//                             {course.code} · {course.title}
//                         </h2>
//                         <p className="text-xs text-gray-500">
//                             Showing {visible.length} of {course.enrolled} enrolled students (sample list)
//                         </p>
//                     </div>
//                     <div className="flex gap-2">
//                         <button
//                             type="button"
//                             onClick={markAllPresent}
//                             className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-1.5 text-sm text-green-900 hover:bg-green-50"
//                         >
//                             <FaCheckDouble className="h-3.5 w-3.5" /> Mark all present
//                         </button>
//                         <button
//                             type="button"
//                             onClick={saveAttendance}
//                             className="rounded-lg bg-amber-400 px-4 py-1.5 text-sm font-semibold text-green-950 hover:bg-amber-300"
//                         >
//                             Save attendance
//                         </button>
//                     </div>
//                 </div>

//                 <div className="mt-3 flex max-w-xs items-center gap-2 rounded-lg bg-green-50 px-3">
//                     <FaSearch className="h-3.5 w-3.5 text-gray-400" />
//                     <input
//                         type="text"
//                         value={query}
//                         onChange={(e) => setQuery(e.target.value)}
//                         placeholder="Search by name or reg. number"
//                         aria-label="Search students"
//                         className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
//                     />
//                 </div>

//                 {note && (
//                     <p
//                         role="status"
//                         className={`mt-3 rounded-lg px-3 py-2 text-sm ${note.bad ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
//                             }`}
//                     >
//                         {note.text}
//                     </p>
//                 )}

//                 <div className="mt-3 overflow-x-auto">
//                     <table className="w-full min-w-[34rem] text-left text-sm">
//                         <thead>
//                             <tr className="text-xs text-gray-500">
//                                 <th className="py-2 font-normal">Student</th>
//                                 <th className="py-2 font-normal">Overall</th>
//                                 <th className="py-2 font-normal">Today</th>
//                                 <th className="py-2 font-normal">Task 1 /{GRADE_MAX}</th>
//                                 <th className="py-2 font-normal">Status</th>
//                                 <th className="py-2" />
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {visible.length === 0 && (
//                                 <tr>
//                                     <td colSpan={6} className="border-t border-gray-100 py-4 text-gray-500">
//                                         No students match your search.
//                                     </td>
//                                 </tr>
//                             )}
//                             {visible.map((s) => {
//                                 const mark = marks[markKey(s.id)]
//                                 const status = getStatus(s.attendancePct, gradeOf(s.id))
//                                 return (
//                                     <tr key={s.id} className="border-t border-gray-100">
//                                         <td className="py-2.5">
//                                             <div className="flex items-center gap-2.5">
//                                                 <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-200 text-xs font-semibold text-green-950">
//                                                     {initials(s.name)}
//                                                 </span>
//                                                 <div>
//                                                     <p className="font-medium text-green-950">{s.name}</p>
//                                                     <p className="text-xs text-gray-500">{s.reg}</p>
//                                                 </div>
//                                             </div>
//                                         </td>
//                                         <td
//                                             className={`py-2.5 ${s.attendancePct < AT_RISK_ATTENDANCE ? 'text-red-800' : 'text-gray-700'
//                                                 }`}
//                                         >
//                                             {s.attendancePct}%
//                                         </td>
//                                         <td className="whitespace-nowrap py-2.5">
//                                             <button
//                                                 type="button"
//                                                 onClick={() => setMark(s.id, 'P')}
//                                                 aria-pressed={mark === 'P'}
//                                                 className={`rounded-l-md border px-3 py-1 text-xs ${mark === 'P'
//                                                     ? 'border-green-600 bg-green-100 font-semibold text-green-800'
//                                                     : 'border-gray-200 bg-white text-gray-700 hover:bg-green-50'
//                                                     }`}
//                                             >
//                                                 Present
//                                             </button>
//                                             <button
//                                                 type="button"
//                                                 onClick={() => setMark(s.id, 'A')}
//                                                 aria-pressed={mark === 'A'}
//                                                 className={`rounded-r-md border border-l-0 px-3 py-1 text-xs ${mark === 'A'
//                                                     ? 'border-red-500 bg-red-100 font-semibold text-red-800'
//                                                     : 'border-gray-200 bg-white text-gray-700 hover:bg-red-50'
//                                                     }`}
//                                             >
//                                                 Absent
//                                             </button>
//                                         </td>
//                                         <td className="py-2.5">
//                                             <GradeInput
//                                                 key={`${course.code}-${s.id}`}
//                                                 label={`Task 1 grade for ${s.name}`}
//                                                 value={gradeOf(s.id)}
//                                                 onCommit={(v) =>
//                                                     setGrades((prev) => ({ ...prev, [gradeKey(s.id)]: v }))
//                                                 }
//                                             />
//                                         </td>
//                                         <td className="py-2.5">
//                                             <span
//                                                 className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass[status]}`}
//                                             >
//                                                 {status}
//                                             </span>
//                                         </td>
//                                         <td className="py-2.5 text-right">
//                                             <Link
//                                                 to="/lecturer/messages"
//                                                 aria-label={`Message ${s.name}`}
//                                                 className="inline-flex rounded-md border border-gray-200 p-2 text-green-900 hover:bg-green-50"
//                                             >
//                                                 <FaEnvelope className="h-3.5 w-3.5" />
//                                             </Link>
//                                         </td>
//                                     </tr>
//                                 )
//                             })}
//                         </tbody>
//                     </table>
//                 </div>

//                 <p className="mt-3 text-xs text-gray-500">
//                     Today: {present} present, {absent} absent, {courseStudents.length - present - absent} not marked
//                 </p>
//             </section>

//             {/* Assignments + announcements */}
//             <div className="grid gap-4 lg:grid-cols-2">
//                 <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                     <h2 className="font-semibold text-green-950">Assignments</h2>
//                     <ul className="mt-2 divide-y divide-gray-100">
//                         {courseAssignments.map((a) => (
//                             <li key={a.id} className="py-3">
//                                 <div className="flex items-center justify-between gap-2">
//                                     <p className="text-sm font-medium text-green-950">
//                                         {a.title} <span className="text-xs font-normal text-gray-500">({a.courseCode})</span>
//                                     </p>
//                                     <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
//                                         {a.toGrade} to grade
//                                     </span>
//                                 </div>
//                                 <p className="text-xs text-gray-500">
//                                     Due {a.due} · {a.submitted} of {a.total} submitted
//                                 </p>
//                                 <div className="mt-2 h-1.5 rounded bg-gray-100">
//                                     <div
//                                         className="h-1.5 rounded bg-green-900"
//                                         style={{ width: `${(a.submitted / a.total) * 100}%` }}
//                                     />
//                                 </div>
//                             </li>
//                         ))}
//                     </ul>
//                 </section>

//                 <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                     <h2 className="font-semibold text-green-950">Announcement</h2>
//                     <p className="text-xs text-gray-500">Posts to the students of {course.code}.</p>
//                     <textarea
//                         value={draft}
//                         onChange={(e) => {
//                             setDraft(e.target.value)
//                             setDraftError('')
//                         }}
//                         rows={3}
//                         placeholder="Write a message to the students of this course"
//                         aria-label="Announcement text"
//                         className="mt-3 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
//                     />
//                     {draftError && <p className="text-xs text-red-600">{draftError}</p>}
//                     <button
//                         type="button"
//                         onClick={postAnnouncement}
//                         className="mt-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
//                     >
//                         Post to course
//                     </button>

//                     <ul className="mt-3 divide-y divide-gray-100">
//                         {courseAnnouncements.length === 0 && (
//                             <li className="py-2 text-sm text-gray-500">No announcements for this course yet.</li>
//                         )}
//                         {courseAnnouncements.map((a) => (
//                             <li key={a.id} className="py-2 text-sm text-gray-700">
//                                 {a.text}
//                                 <p className="text-xs text-gray-500">
//                                     {a.courseCode} · {formatDate(a.postedAt)}
//                                 </p>
//                             </li>
//                         ))}
//                     </ul>
//                 </section>
//             </div>
//         </div>
//     )
// }

// export default LecturerDashboard
import LecturerWorkspace from './LecturerWorkspace'

const LecturerDashboard = () => <LecturerWorkspace section="all" />

export default LecturerDashboard
