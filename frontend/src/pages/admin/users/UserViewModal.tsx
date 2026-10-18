import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getErrorMessage } from '../../../services/api'
import { getUser } from '../../../services/users'
import type { UserDetail } from '../../../services/users'
import ModalShell from './ModalShell'
import { formatDate, formatDateTime, roleLabel, roleTag, statusTag } from './userLabels'

const Item = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div>
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="text-sm font-medium text-green-950">{value === null || value === undefined || value === '' ? '-' : value}</dd>
    </div>
)

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="mt-5 border-t border-gray-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-green-900">{title}</h3>
        <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
    </section>
)

const UserViewModal = ({
    userId,
    onClose,
    onEdit,
}: {
    userId: number
    onClose: () => void
    onEdit: (id: number) => void
}) => {
    const [user, setUser] = useState<UserDetail | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        getUser(userId)
            .then((u) => {
                if (!cancelled) setUser(u)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load this user.'))
            })
        return () => {
            cancelled = true
        }
    }, [userId])

    return (
        <ModalShell title="User details" subtitle={user?.email} onClose={onClose} wide>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {!user && !error && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}

            {user && (
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold text-green-950">{user.fullName}</span>
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${roleTag[user.role]}`}>
                            {roleLabel[user.role]}
                        </span>
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusTag[user.status]}`}>
                            {user.status}
                        </span>
                    </div>

                    <Section title="Account">
                        <Item label="Email" value={user.email} />
                        <Item label="Phone" value={user.phone} />
                        <Item label="Gender" value={user.gender} />
                        <Item label="Joined" value={formatDate(user.createdAt)} />
                        <Item label="Last login" value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'} />
                    </Section>

                    {user.student && (
                        <Section title="Student record">
                            <Item label="Registration number" value={user.student.regNumber} />
                            <Item label="Programme" value={user.student.programme} />
                            <Item label="Year of study" value={user.student.yearOfStudy} />
                            <Item label="Admitted" value={formatDate(user.student.admittedAt)} />
                        </Section>
                    )}

                    {user.role === 'student' && !user.student && (
                        <Section title="Admission">
                            <Item label="Application status" value={user.application?.status ?? 'No application'} />
                            <Item label="Intake" value={user.application?.intake} />
                            <Item
                                label="Submitted"
                                value={user.application?.submittedAt ? formatDate(user.application.submittedAt) : 'Not yet'}
                            />
                            <Item label="Registration number" value="Assigned when approved" />
                        </Section>
                    )}

                    {user.lecturer && (
                        <Section title="Lecturer record">
                            <Item label="Staff ID" value={user.lecturer.staffId} />
                            <Item label="Department" value={user.lecturer.department.name} />
                            <Item label="Qualification" value={user.lecturer.qualification} />
                            <Item label="Courses taught" value={user.lecturer.courses} />
                        </Section>
                    )}

                    {user.employee && (
                        <Section title="Employee record">
                            <Item label="Staff ID" value={user.employee.staffId} />
                            <Item label="Department" value={user.employee.department.name} />
                            <Item label="Position" value={user.employee.position} />
                            <Item label="Supervisor" value={user.employee.supervisor} />
                        </Section>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() => onEdit(user.id)}
                            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                        >
                            Edit
                        </button>
                    </div>
                </>
            )}
        </ModalShell>
    )
}

export default UserViewModal