import { useEffect, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { enrollStudent, findStudents } from '../../../services/enrollments'
import type { CourseFilter, StudentOption } from '../../../services/enrollments'
import ModalShell from '../users/ModalShell'

const AddEnrollmentModal = ({
    courses,
    defaultCourseId,
    onClose,
    onSaved,
}: {
    courses: CourseFilter[]
    defaultCourseId: number | null
    onClose: () => void
    onSaved: (message: string) => void
}) => {
    const [query, setQuery] = useState('')
    const [options, setOptions] = useState<StudentOption[] | null>(null)
    const [student, setStudent] = useState<StudentOption | null>(null)
    const [courseId, setCourseId] = useState(defaultCourseId ? String(defaultCourseId) : '')
    const [errors, setErrors] = useState<{ studentId?: string; courseId?: string }>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)

    // search as the person types (after a short pause)
    useEffect(() => {
        let cancelled = false
        const t = window.setTimeout(() => {
            findStudents(query.trim())
                .then((rows) => {
                    if (!cancelled) setOptions(rows)
                })
                .catch((err) => {
                    if (!cancelled) setServerError(getErrorMessage(err, 'Could not search the students.'))
                })
        }, 250)
        return () => {
            cancelled = true
            window.clearTimeout(t)
        }
    }, [query])

    const save = async () => {
        const found: { studentId?: string; courseId?: string } = {}
        if (!student) found.studentId = 'Choose a student.'
        if (!courseId) found.courseId = 'Choose a course.'
        setErrors(found)
        if (!student || !courseId) return

        setSaving(true)
        setServerError('')
        try {
            const saved = await enrollStudent(student.id, Number(courseId))
            onSaved(`${saved.student.name} is enrolled in ${saved.course.code}.`)
        } catch (err) {
            setErrors(getFieldErrors(err))
            setServerError(getErrorMessage(err, 'Could not enroll the student.'))
            setSaving(false)
        }
    }

    return (
        <ModalShell title="Enroll a student" subtitle="Only approved students can be enrolled." onClose={onClose}>
            <div className="space-y-4">
                {serverError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}

                <div>
                    <label htmlFor="student-search" className="mb-1 block text-xs font-medium text-gray-600">
                        Student
                    </label>
                    <div className={`flex items-center gap-2 rounded-lg border bg-white px-3 ${errors.studentId ? 'border-red-400' : 'border-gray-200'}`}>
                        <FaSearch className="h-3.5 w-3.5 text-gray-400" />
                        <input
                            id="student-search"
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setStudent(null)
                                setErrors((p) => ({ ...p, studentId: undefined }))
                                setServerError('')
                            }}
                            placeholder="Search by name, email or registration number"
                            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>
                    {errors.studentId && <p className="mt-1 text-xs text-red-600">{errors.studentId}</p>}

                    <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200" role="listbox" aria-label="Matching students">
                        {!options && <li className="px-3 py-3 text-sm text-gray-500">Loading...</li>}
                        {options && options.length === 0 && <li className="px-3 py-3 text-sm text-gray-500">No approved student found.</li>}
                        {options?.map((s) => (
                            <li key={s.id} role="option" aria-selected={student?.id === s.id}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStudent(s)
                                        setErrors((p) => ({ ...p, studentId: undefined }))
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-green-50 ${student?.id === s.id ? 'bg-green-100 font-medium' : ''
                                        }`}
                                >
                                    <span className="text-green-950">{s.name}</span>
                                    <span className="text-xs text-gray-500">{s.regNumber}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <label htmlFor="course" className="mb-1 block text-xs font-medium text-gray-600">
                        Course
                    </label>
                    <select
                        id="course"
                        value={courseId}
                        onChange={(e) => {
                            setCourseId(e.target.value)
                            setErrors((p) => ({ ...p, courseId: undefined }))
                            setServerError('')
                        }}
                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 ${errors.courseId ? 'border-red-400' : 'border-gray-200'
                            }`}
                    >
                        <option value="">Select...</option>
                        {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.code} {c.title}
                            </option>
                        ))}
                    </select>
                    {errors.courseId && <p className="mt-1 text-xs text-red-600">{errors.courseId}</p>}
                </div>

                <p className="text-xs text-gray-500">The student gets a notification. A student who was dropped from this course is enrolled again.</p>

                <div className="flex justify-end gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void save()}
                        disabled={saving}
                        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                    >
                        {saving ? 'Enrolling...' : 'Enroll student'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

export default AddEnrollmentModal
