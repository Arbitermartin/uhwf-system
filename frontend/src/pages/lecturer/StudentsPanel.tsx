import { useCallback, useEffect, useState } from 'react'
import { FaCheckDouble, FaSearch } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { getStudents, saveAttendance, saveScores, todayTZ } from '../../services/lecturer'
import type { AssignmentRow, Mark, StudentRow, StudentStatus, StudentsReply } from '../../services/lecturer'

const statusInfo: Record<StudentStatus, { label: string; cls: string }> = {
    at_risk: { label: 'At risk', cls: 'bg-red-100 text-red-800' },
    not_graded: { label: 'Not graded', cls: 'bg-amber-100 text-amber-900' },
    on_track: { label: 'On track', cls: 'bg-green-100 text-green-800' },
}

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('')

// "14,5" and "14.5" both work
const parseScore = (text: string): number | null | 'bad' => {
    const t = text.trim().replace(',', '.')
    if (t === '') return null
    const n = Number(t)
    return Number.isFinite(n) ? n : 'bad'
}

type Note = { text: string; bad: boolean }

const StudentsPanel = ({
    courseId,
    courseCode,
    mode,
    assignments,
    onSaved,
    onAtRisk,
}: {
    courseId: number
    courseCode: string
    mode: 'both' | 'attendance' | 'grades'
    assignments: AssignmentRow[]
    onSaved: () => void
    onAtRisk?: (count: number) => void
}) => {
    const showAttendance = mode !== 'grades'
    const showGrades = mode !== 'attendance'

    const [date, setDate] = useState(todayTZ())
    const [assignmentId, setAssignmentId] = useState<number | null>(null)
    const [query, setQuery] = useState('')
    const [reloadKey, setReloadKey] = useState(0)

    const [data, setData] = useState<StudentsReply | null>(null)
    const [error, setError] = useState('')
    const [marks, setMarks] = useState<Record<number, Mark>>({})
    const [scores, setScores] = useState<Record<number, string>>({})
    const [busy, setBusy] = useState<'attendance' | 'grades' | null>(null)
    const [note, setNote] = useState<Note | null>(null)

    // choose the newest assignment by default, and move away from one that was deleted
    useEffect(() => {
        if (assignments.length === 0) setAssignmentId(null)
        else if (!assignments.some((a) => a.id === assignmentId)) setAssignmentId(assignments[0].id)
    }, [assignments, assignmentId])

    useEffect(() => {
        let cancelled = false
        setData(null)
        getStudents(courseId, date, showGrades && assignmentId !== null ? assignmentId : undefined)
            .then((res) => {
                if (cancelled) return
                setData(res)
                setError('')
                const m: Record<number, Mark> = {}
                const s: Record<number, string> = {}
                for (const r of res.students) {
                    if (r.today) m[r.studentId] = r.today
                    s[r.studentId] = r.score === null ? '' : String(r.score)
                }
                setMarks(m)
                setScores(s)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the students.'))
            })
        return () => {
            cancelled = true
        }
    }, [courseId, date, assignmentId, showGrades, reloadKey])

    useEffect(() => {
        if (data) onAtRisk?.(data.students.filter((s) => s.status === 'at_risk').length)
    }, [data, onAtRisk])

    const assignment = assignments.find((a) => a.id === assignmentId) ?? null
    const rows: StudentRow[] = data?.students ?? []
    const q = query.trim().toLowerCase()
    const visible = rows.filter((r) => !q || `${r.name} ${r.regNumber}`.toLowerCase().includes(q))

    const present = rows.filter((r) => marks[r.studentId] === 'present').length
    const absent = rows.filter((r) => marks[r.studentId] === 'absent').length

    const attendanceDirty = rows.some((r) => marks[r.studentId] !== undefined && marks[r.studentId] !== r.today)
    const invalid = (text: string) => {
        const n = parseScore(text)
        return n === 'bad' || (n !== null && (n < 0 || (assignment !== null && n > assignment.maxScore)))
    }
    const changedScores = rows.filter((r) => (scores[r.studentId] ?? '') !== (r.score === null ? '' : String(r.score)))
    const anyInvalid = changedScores.some((r) => invalid(scores[r.studentId] ?? ''))

    const setMark = (id: number, value: Mark) => {
        setMarks((prev) => ({ ...prev, [id]: value }))
        setNote(null)
    }

    const markAllPresent = () => {
        setMarks(Object.fromEntries(rows.map((r) => [r.studentId, 'present' as Mark])))
        setNote(null)
    }

    const reload = useCallback(() => setReloadKey((k) => k + 1), [])

    const saveAttendanceNow = async () => {
        const entries = rows.filter((r) => marks[r.studentId]).map((r) => ({ studentId: r.studentId, status: marks[r.studentId] }))
        if (entries.length === 0) {
            setNote({ text: 'Mark at least one student first.', bad: true })
            return
        }
        setBusy('attendance')
        setNote(null)
        try {
            await saveAttendance(courseId, date, entries)
            setNote({ text: `Attendance saved for ${courseCode}, ${date}.`, bad: false })
            reload()
            onSaved()
        } catch (err) {
            setNote({ text: getErrorMessage(err, 'Could not save the attendance.'), bad: true })
        } finally {
            setBusy(null)
        }
    }

    const saveGradesNow = async () => {
        if (!assignment) return
        if (anyInvalid) {
            setNote({ text: `Scores must be numbers from 0 to ${assignment.maxScore}.`, bad: true })
            return
        }
        const payload = changedScores.map((r) => ({ studentId: r.studentId, score: parseScore(scores[r.studentId] ?? '') as number | null }))
        if (payload.length === 0) {
            setNote({ text: 'No scores were changed.', bad: true })
            return
        }
        setBusy('grades')
        setNote(null)
        try {
            await saveScores(assignment.id, payload)
            setNote({ text: `Scores saved for "${assignment.title}".`, bad: false })
            reload()
            onSaved()
        } catch (err) {
            setNote({ text: getErrorMessage(err, 'Could not save the scores.'), bad: true })
        } finally {
            setBusy(null)
        }
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-green-950">
                        {mode === 'attendance' ? 'Attendance' : mode === 'grades' ? 'Grades' : 'Students'}: {courseCode}
                    </h2>
                    <p className="text-xs text-gray-500">
                        {data ? `${rows.length} enrolled student${rows.length === 1 ? '' : 's'}` : 'Loading...'}
                    </p>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    {showAttendance && (
                        <label className="text-xs text-gray-600">
                            Date
                            <input
                                type="date"
                                value={date}
                                max={todayTZ()}
                                onChange={(e) => e.target.value && setDate(e.target.value)}
                                className="mt-1 block rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </label>
                    )}
                    {showGrades && (
                        <label className="text-xs text-gray-600">
                            Grading
                            <select
                                value={assignmentId ?? ''}
                                disabled={assignments.length === 0}
                                onChange={(e) => setAssignmentId(e.target.value ? Number(e.target.value) : null)}
                                className="mt-1 block max-w-[16rem] rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                            >
                                {assignments.length === 0 && <option value="">No assignments yet</option>}
                                {assignments.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.title} (out of {a.maxScore})
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="flex min-w-[14rem] max-w-xs flex-1 items-center gap-2 rounded-lg bg-green-50 px-3">
                    <FaSearch className="h-3 w-3 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search name or reg. number"
                        aria-label="Search students"
                        className="w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-gray-400"
                    />
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                    {showAttendance && (
                        <>
                            <button
                                type="button"
                                onClick={markAllPresent}
                                disabled={rows.length === 0}
                                className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-1.5 text-sm text-green-900 hover:bg-green-50 disabled:opacity-50"
                            >
                                <FaCheckDouble className="h-3.5 w-3.5" /> Mark all present
                            </button>
                            <button
                                type="button"
                                onClick={() => void saveAttendanceNow()}
                                disabled={busy !== null || !attendanceDirty}
                                className="rounded-lg bg-amber-400 px-4 py-1.5 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {busy === 'attendance' ? 'Saving...' : 'Save attendance'}
                            </button>
                        </>
                    )}
                    {showGrades && (
                        <button
                            type="button"
                            onClick={() => void saveGradesNow()}
                            disabled={busy !== null || !assignment || changedScores.length === 0}
                            className="rounded-lg bg-amber-400 px-4 py-1.5 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {busy === 'grades' ? 'Saving...' : 'Save scores'}
                        </button>
                    )}
                </div>
            </div>

            {note && (
                <p
                    role={note.bad ? 'alert' : 'status'}
                    className={`mt-3 rounded-lg px-3 py-2 text-sm ${note.bad ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}
                >
                    {note.text}
                </p>
            )}
            {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            {showGrades && assignments.length === 0 && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    Create an assignment first, then you can enter scores here.
                </p>
            )}

            <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead>
                        <tr className="text-xs text-gray-500">
                            <th className="py-2 font-normal">Student</th>
                            <th className="py-2 font-normal" title="Share of recorded sessions the student attended">
                                Attendance
                            </th>
                            {showAttendance && <th className="py-2 font-normal">{date === todayTZ() ? 'Today' : date}</th>}
                            {showGrades && <th className="py-2 font-normal">{assignment ? `Score /${assignment.maxScore}` : 'Score'}</th>}
                            <th
                                className="py-2 font-normal"
                                title="At risk: attendance under 75% (after 3 recorded sessions) or an average score under 40%."
                            >
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {!data && !error && (
                            <tr>
                                <td colSpan={5} className="border-t border-gray-100 py-6 text-center text-gray-500">
                                    Loading students...
                                </td>
                            </tr>
                        )}
                        {data && rows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="border-t border-gray-100 py-6 text-center text-gray-500">
                                    No students are enrolled in this course yet. Students appear here after the administrator approves their application.
                                </td>
                            </tr>
                        )}
                        {data && rows.length > 0 && visible.length === 0 && (
                            <tr>
                                <td colSpan={5} className="border-t border-gray-100 py-6 text-center text-gray-500">
                                    No student matches your search.
                                </td>
                            </tr>
                        )}
                        {visible.map((r) => {
                            const mark = marks[r.studentId]
                            const text = scores[r.studentId] ?? ''
                            const bad = invalid(text)
                            const info = statusInfo[r.status]
                            return (
                                <tr key={r.studentId} className="border-t border-gray-100">
                                    <td className="py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-200 text-xs font-semibold text-green-950">
                                                {initials(r.name)}
                                            </span>
                                            <div>
                                                <p className="font-medium text-green-950">{r.name}</p>
                                                <p className="text-xs text-gray-500">{r.regNumber}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-2.5 text-gray-700" title={`${r.sessions} recorded session${r.sessions === 1 ? '' : 's'}`}>
                                        {r.attendancePct === null ? '-' : `${r.attendancePct}%`}
                                    </td>
                                    {showAttendance && (
                                        <td className="whitespace-nowrap py-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setMark(r.studentId, 'present')}
                                                aria-pressed={mark === 'present'}
                                                aria-label={`Mark ${r.name} present`}
                                                className={`rounded-l-md border px-3 py-1 text-xs ${mark === 'present'
                                                    ? 'border-green-600 bg-green-100 font-semibold text-green-800'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-green-50'
                                                    }`}
                                            >
                                                Present
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMark(r.studentId, 'absent')}
                                                aria-pressed={mark === 'absent'}
                                                aria-label={`Mark ${r.name} absent`}
                                                className={`rounded-r-md border border-l-0 px-3 py-1 text-xs ${mark === 'absent'
                                                    ? 'border-red-500 bg-red-100 font-semibold text-red-800'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-red-50'
                                                    }`}
                                            >
                                                Absent
                                            </button>
                                        </td>
                                    )}
                                    {showGrades && (
                                        <td className="py-2.5">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={text}
                                                disabled={!assignment}
                                                aria-label={`Score for ${r.name}`}
                                                aria-invalid={bad}
                                                title={bad && assignment ? `Enter a number from 0 to ${assignment.maxScore}` : undefined}
                                                onChange={(e) => {
                                                    setScores((prev) => ({ ...prev, [r.studentId]: e.target.value }))
                                                    setNote(null)
                                                }}
                                                className={`h-8 w-16 rounded-md border text-center text-sm text-green-950 outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 ${bad ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                                                    }`}
                                            />
                                        </td>
                                    )}
                                    <td className="py-2.5">
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${info.cls}`}>{info.label}</span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {showAttendance && rows.length > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                    {date === todayTZ() ? 'Today' : date}: {present} present, {absent} absent, {rows.length - present - absent} not marked
                    {attendanceDirty ? ' (not saved yet)' : ''}
                </p>
            )}
        </section>
    )
}

export default StudentsPanel
