import { useEffect, useState } from 'react'
import { FaDownload, FaEnvelope } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import {
    applicationStatusLabel,
    applicationStatuses,
    cvLink,
    listApplications,
    setApplicationStatus,
} from '../../../services/careers'
import type { ApplicationStatus, JobApplicationRow } from '../../../services/careers'
import ModalShell from '../users/ModalShell'
import { formatDate } from '../users/userLabels'

const statusTag: Record<ApplicationStatus, string> = {
    received: 'bg-amber-100 text-amber-900',
    reviewing: 'bg-sky-100 text-sky-900',
    shortlisted: 'bg-green-100 text-green-800',
    hired: 'bg-green-700 text-white',
    rejected: 'bg-gray-100 text-gray-700',
}

const ApplicationsModal = ({
    jobId,
    jobTitle,
    onClose,
    onChanged,
}: {
    jobId: number
    jobTitle: string
    onClose: () => void
    onChanged: () => void
}) => {
    const [rows, setRows] = useState<JobApplicationRow[] | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        listApplications(jobId)
            .then((d) => {
                if (!cancelled) setRows(d.applications)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the applications.'))
            })
        return () => {
            cancelled = true
        }
    }, [jobId])

    const change = async (row: JobApplicationRow, status: ApplicationStatus) => {
        setError('')
        const previous = row.status
        setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, status } : r)) ?? null)
        try {
            await setApplicationStatus(row.id, status)
            onChanged() // the "new" count behind this window changes
        } catch (err) {
            setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, status: previous } : r)) ?? null)
            setError(getErrorMessage(err, 'Could not change the status.'))
        }
    }

    return (
        <ModalShell title="Applications" subtitle={jobTitle} onClose={onClose} wide>
            {error && (
                <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            {!rows && !error && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}
            {rows && rows.length === 0 && <p className="py-6 text-center text-sm text-gray-500">Nobody has applied for this job yet.</p>}

            <ul className="space-y-3">
                {rows?.map((r) => (
                    <li key={r.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-semibold text-green-950">{r.fullName}</p>
                                <p className="break-all text-sm text-gray-600">
                                    {r.email}
                                    {r.phone ? ` · ${r.phone}` : ''}
                                </p>
                                <p className="text-xs text-gray-500">Applied {formatDate(r.createdAt)}</p>
                            </div>
                            <label className="text-xs text-gray-600">
                                <span className="sr-only">Status of {r.fullName}</span>
                                <select
                                    value={r.status}
                                    onChange={(e) => void change(r, e.target.value as ApplicationStatus)}
                                    className={`rounded-md border-0 px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-green-500 ${statusTag[r.status]}`}
                                >
                                    {applicationStatuses.map((s) => (
                                        <option key={s} value={s}>
                                            {applicationStatusLabel[s]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {/* Shown as plain text, so nothing an applicant types can run as code */}
                        {r.coverNote && <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-green-50 p-3 text-sm text-gray-700">{r.coverNote}</p>}

                        <div className="mt-3 flex flex-wrap gap-2">
                            <a
                                href={cvLink(r.id)}
                                className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-1.5 text-sm font-medium text-green-900 hover:bg-green-50"
                            >
                                <FaDownload className="h-3.5 w-3.5" /> Download CV
                            </a>
                            <a
                                href={`mailto:${r.email}?subject=${encodeURIComponent(`Your application: ${jobTitle}`)}`}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <FaEnvelope className="h-3.5 w-3.5" /> Reply by email
                            </a>
                        </div>
                    </li>
                ))}
            </ul>
        </ModalShell>
    )
}

export default ApplicationsModal
