import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { FaBook, FaClipboardCheck, FaExclamationTriangle, FaPencilAlt, FaUsers } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { getOverview, listAssignments } from '../../services/lecturer'
import type { AssignmentRow, LecturerOverview } from '../../services/lecturer'
import AnnouncementsPanel from './AnnouncementsPanel'
import AssignmentsPanel from './AssignmentsPanel'
import StudentsPanel from './StudentsPanel'

export type Section = 'all' | 'attendance' | 'grades' | 'assignments' | 'announcements'

const titles: Record<Section, { title: string; subtitle: string }> = {
    all: { title: 'Lecturer dashboard', subtitle: 'Take attendance, give scores and message the students of your courses.' },
    attendance: { title: 'Attendance', subtitle: 'Mark who was present in each session.' },
    grades: { title: 'Grades', subtitle: 'Enter scores for each assignment.' },
    assignments: { title: 'Assignments', subtitle: 'Create assignments and see how many are graded.' },
    announcements: { title: 'Announcements', subtitle: 'Post a message to all the students of a course.' },
}

const StatCard = ({
    label,
    value,
    note,
    icon,
    highlight,
    valueClass = 'text-green-950',
}: {
    label: string
    value: string
    note: string
    icon: ReactNode
    highlight?: boolean
    valueClass?: string
}) => (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${highlight ? 'border-amber-400' : 'border-gray-200'}`}>
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
            {icon} {label}
        </p>
        <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
        <p className="text-xs text-gray-500">{note}</p>
    </div>
)

const LecturerWorkspace = ({ section }: { section: Section }) => {
    const [overview, setOverview] = useState<LecturerOverview | null>(null)
    const [error, setError] = useState('')
    const [courseId, setCourseId] = useState<number | null>(null)
    const [assignments, setAssignments] = useState<AssignmentRow[]>([])
    const [atRisk, setAtRisk] = useState(0)

    const loadOverview = useCallback(async () => {
        try {
            const o = await getOverview()
            setOverview(o)
            setError('')
            setCourseId((current) => (current !== null && o.courses.some((c) => c.id === current) ? current : (o.courses[0]?.id ?? null)))
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load your courses.'))
        }
    }, [])

    const loadAssignments = useCallback(async () => {
        if (courseId === null) {
            setAssignments([])
            return
        }
        try {
            setAssignments(await listAssignments(courseId))
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load the assignments.'))
        }
    }, [courseId])

    useEffect(() => {
        void loadOverview()
    }, [loadOverview])

    useEffect(() => {
        void loadAssignments()
    }, [loadAssignments])

    const course = overview?.courses.find((c) => c.id === courseId) ?? null
    const { title, subtitle } = titles[section]
    const refreshAll = () => {
        void loadOverview()
        void loadAssignments()
    }

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">{title}</h1>
                <p className="text-sm text-gray-500">{subtitle}</p>
            </div>

            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            {!overview && !error && <p className="py-8 text-center text-sm text-gray-500">Loading your courses...</p>}

            {overview && overview.courses.length === 0 && (
                <p className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
                    No courses are assigned to you yet. Ask the administrator to assign you to a course (Admin, then Courses, then "Taught by").
                </p>
            )}

            {overview && section === 'all' && overview.courses.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatCard label="My courses" value={String(overview.stats.courses)} note="Assigned to you" icon={<FaBook className="h-3 w-3" />} />
                    <StatCard label="Students" value={String(overview.stats.students)} note="Across your courses" icon={<FaUsers className="h-3 w-3" />} />
                    <StatCard
                        label="To grade"
                        value={String(overview.stats.toGrade)}
                        note="Scores missing, past due"
                        icon={<FaPencilAlt className="h-3 w-3" />}
                        highlight={overview.stats.toGrade > 0}
                        valueClass={overview.stats.toGrade > 0 ? 'text-amber-700' : 'text-green-950'}
                    />
                    <StatCard
                        label="Attendance"
                        value={overview.stats.attendanceWeekPct === null ? '-' : `${overview.stats.attendanceWeekPct}%`}
                        note="Last 7 days"
                        icon={<FaClipboardCheck className="h-3 w-3" />}
                    />
                </div>
            )}

            {overview && overview.courses.length > 0 && (
                <>
                    <div className="flex flex-wrap gap-2">
                        {overview.courses.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                    setCourseId(c.id)
                                    setAtRisk(0)
                                }}
                                aria-pressed={c.id === courseId}
                                className={`rounded-lg border px-4 py-2 text-left text-sm transition-colors ${c.id === courseId ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
                                    }`}
                            >
                                <span className="block font-semibold">{c.code}</span>
                                <span className="block text-xs opacity-80">
                                    {c.enrolled} student{c.enrolled === 1 ? '' : 's'}
                                    {c.isActive ? '' : ' · hidden'}
                                </span>
                            </button>
                        ))}
                        {section === 'all' && course && atRisk > 0 && (
                            <span className="ml-auto flex items-center gap-1.5 self-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                                <FaExclamationTriangle className="h-3 w-3" /> {atRisk} at risk in {course.code}
                            </span>
                        )}
                    </div>

                    {course && (section === 'all' || section === 'attendance' || section === 'grades') && (
                        <StudentsPanel
                            courseId={course.id}
                            courseCode={course.code}
                            mode={section === 'attendance' ? 'attendance' : section === 'grades' ? 'grades' : 'both'}
                            assignments={assignments}
                            onSaved={refreshAll}
                            onAtRisk={setAtRisk}
                        />
                    )}

                    {course && section === 'all' && (
                        <div className="grid gap-4 lg:grid-cols-2">
                            <AssignmentsPanel courseId={course.id} courseCode={course.code} assignments={assignments} onChanged={refreshAll} />
                            <AnnouncementsPanel courseId={course.id} courseCode={course.code} />
                        </div>
                    )}
                    {course && section === 'assignments' && (
                        <AssignmentsPanel courseId={course.id} courseCode={course.code} assignments={assignments} onChanged={refreshAll} />
                    )}
                    {course && section === 'announcements' && <AnnouncementsPanel courseId={course.id} courseCode={course.code} />}
                </>
            )}
        </div>
    )
}

export default LecturerWorkspace
