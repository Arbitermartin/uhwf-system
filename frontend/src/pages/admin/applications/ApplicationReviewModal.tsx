import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { FaCheckCircle, FaExternalLinkAlt, FaTimesCircle } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import {
    approveApplication,
    confirmPayment,
    documentUrl,
    getApplication,
    rejectApplication,
} from '../../../services/applications'
import type { AppDetail } from '../../../services/applications'
import { docList } from '../../../data/application'
import ModalShell from '../users/ModalShell'
import { formatDate, formatDateTime } from '../users/userLabels'
import { money, payTag, statusLabel, statusTag } from './appLabels'

const Item = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div>
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="text-sm font-medium text-green-950">{value ? value : '-'}</dd>
    </div>
)

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="mt-5 border-t border-gray-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-green-900">{title}</h3>
        {children}
    </section>
)

const Check = ({ ok, text }: { ok: boolean; text: string }) => (
    <li className={`flex items-center gap-2 text-sm ${ok ? 'text-green-800' : 'text-red-700'}`}>
        {ok ? <FaCheckCircle className="h-4 w-4" /> : <FaTimesCircle className="h-4 w-4" />}
        {text}
    </li>
)

const ApplicationReviewModal = ({
    applicationId,
    onClose,
    onChanged,
}: {
    applicationId: number
    onClose: () => void
    onChanged: (message: string) => void
}) => {
    const [app, setApp] = useState<AppDetail | null>(null)
    const [loadError, setLoadError] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [rejecting, setRejecting] = useState(false)
    const [note, setNote] = useState('')

    useEffect(() => {
        let cancelled = false
        getApplication(applicationId)
            .then((a) => {
                if (!cancelled) setApp(a)
            })
            .catch((err) => {
                if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this application.'))
            })
        return () => {
            cancelled = true
        }
    }, [applicationId])

    // Runs one action, shows the updated application, and tells the page to refresh its list.
    const run = async (action: () => Promise<AppDetail>, message: string) => {
        setBusy(true)
        setError('')
        try {
            setApp(await action())
            setRejecting(false)
            onChanged(message)
        } catch (err) {
            setError(getErrorMessage(err, 'That did not work. Please try again.'))
        } finally {
            setBusy(false)
        }
    }

    const paid = app?.payments.some((p) => p.status === 'paid') ?? false
    const pendingPayment = app?.payments.find((p) => p.status === 'pending')
    const docsOk = app ? docList.every((d) => app.documents.some((x) => x.type === d.key)) : false
    const coursesOk = (app?.courses.length ?? 0) > 0
    const canApprove = app?.status === 'submitted' && paid && coursesOk && docsOk

    return (
        <ModalShell title="Review application" subtitle={app ? `${app.student.name} · Intake ${app.intake}` : undefined} onClose={onClose} wide>
            {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
            {!app && !loadError && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}

            {app && (
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusTag[app.status]}`}>
                            {statusLabel[app.status]}
                        </span>
                        {app.submittedAt && <span className="text-xs text-gray-500">Submitted {formatDateTime(app.submittedAt)}</span>}
                    </div>

                    <Section title="Applicant">
                        <dl className="grid gap-3 sm:grid-cols-3">
                            <Item label="Name" value={app.student.name} />
                            <Item label="Email" value={app.student.email} />
                            <Item label="Phone" value={app.student.phone} />
                            <Item label="Gender" value={app.student.gender} />
                            <Item label="Date of birth" value={app.personal.dob} />
                            <Item label="Nationality" value={app.personal.nationality} />
                            <Item label="Region" value={app.personal.region} />
                            <Item label="Next of kin" value={app.personal.kinName} />
                            <Item label="Next of kin phone" value={app.personal.kinPhone} />
                        </dl>
                    </Section>

                    <Section title="Payment">
                        {app.payments.length === 0 && <p className="text-sm text-gray-500">No payment started.</p>}
                        <ul className="divide-y divide-gray-100">
                            {app.payments.map((p) => (
                                <li key={p.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                                    <span className="font-medium text-green-950">{money(p.amount)}</span>
                                    <span className="text-gray-600">{p.method}</span>
                                    <span className="text-xs text-gray-500">{p.reference}</span>
                                    <span className={`ml-auto rounded px-2 py-0.5 text-xs font-medium ${p.status === 'paid' ? payTag.paid : p.status === 'pending' ? payTag.pending : 'bg-red-100 text-red-800'}`}>
                                        {p.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {pendingPayment && (
                            <div className="mt-3 rounded-lg bg-amber-50 p-3">
                                <p className="text-sm text-amber-900">
                                    Check that the money arrived (bank statement or mobile money), then confirm it.
                                </p>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => run(() => confirmPayment(app.id), 'Payment confirmed.')}
                                    className="mt-2 rounded-lg bg-amber-400 px-4 py-1.5 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                                >
                                    Confirm payment received
                                </button>
                            </div>
                        )}
                    </Section>

                    <Section title="Courses">
                        {app.courses.length === 0 ? (
                            <p className="text-sm text-gray-500">No courses chosen yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {app.courses.map((c) => (
                                    <li key={c.code} className="flex items-center gap-3 py-2 text-sm text-green-950">
                                        <span>
                                            <strong className="font-semibold">{c.code}</strong> {c.title}
                                        </span>
                                        <span className="ml-auto text-xs text-gray-500">{c.credits} credits</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Section>

                    <Section title="Documents">
                        <ul className="divide-y divide-gray-100">
                            {docList.map((d) => {
                                const doc = app.documents.find((x) => x.type === d.key)
                                return (
                                    <li key={d.key} className="flex items-center gap-3 py-2 text-sm">
                                        <div className="min-w-0">
                                            <p className="text-green-950">{d.label}</p>
                                            <p className="truncate text-xs text-gray-500">{doc ? doc.fileName : 'Not uploaded'}</p>
                                        </div>
                                        {doc && (
                                            <a
                                                href={documentUrl(app.id, d.key)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-green-900 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-50"
                                            >
                                                Open <FaExternalLinkAlt className="h-2.5 w-2.5" />
                                            </a>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    </Section>

                    {/* Decision */}
                    {app.status === 'submitted' && (
                        <Section title="Decision">
                            <ul className="space-y-1.5">
                                <Check ok={paid} text={paid ? 'Payment confirmed' : 'Payment not confirmed yet'} />
                                <Check ok={coursesOk} text={coursesOk ? 'Courses chosen' : 'No courses chosen'} />
                                <Check ok={docsOk} text={docsOk ? 'All documents uploaded' : 'Some documents are missing'} />
                            </ul>

                            {!rejecting ? (
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        disabled={!canApprove || busy}
                                        onClick={() => run(() => approveApplication(app.id), 'Application approved.')}
                                        className="rounded-lg bg-green-800 px-5 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {busy ? 'Working...' : 'Approve'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => setRejecting(true)}
                                        className="rounded-lg border border-red-600 px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        Reject...
                                    </button>
                                    {!canApprove && (
                                        <span className="text-xs text-gray-500">Approve is available when all three checks are green.</span>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <label htmlFor="note" className="mb-1 block text-xs font-medium text-gray-600">
                                        Reason (the student will see this)
                                    </label>
                                    <textarea
                                        id="note"
                                        rows={3}
                                        value={note}
                                        onChange={(e) => {
                                            setNote(e.target.value)
                                            setError('')
                                        }}
                                        className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    <div className="mt-3 flex gap-3">
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => run(() => rejectApplication(app.id, note), 'Application rejected.')}
                                            className="rounded-lg bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                                        >
                                            {busy ? 'Working...' : 'Reject application'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRejecting(false)
                                                setNote('')
                                                setError('')
                                            }}
                                            className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Section>
                    )}

                    {app.status === 'approved' && (
                        <Section title="Decision">
                            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
                                Approved{app.reviewedBy ? ` by ${app.reviewedBy}` : ''}
                                {app.reviewedAt ? ` on ${formatDate(app.reviewedAt)}` : ''}. Registration number:{' '}
                                <strong>{app.regNumber}</strong>. The student's courses are enrolled and their dashboard is unlocked.
                            </p>
                        </Section>
                    )}

                    {app.status === 'rejected' && (
                        <Section title="Decision">
                            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                                Rejected{app.reviewedBy ? ` by ${app.reviewedBy}` : ''}
                                {app.reviewedAt ? ` on ${formatDate(app.reviewedAt)}` : ''}. Reason: {app.reviewNote}
                            </p>
                        </Section>
                    )}

                    {error && (
                        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                </>
            )}
        </ModalShell>
    )
}

export default ApplicationReviewModal
