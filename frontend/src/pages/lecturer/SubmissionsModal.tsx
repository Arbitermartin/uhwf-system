import { useEffect, useState } from 'react'
import { FaDownload } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { getSubmissions, saveScores, submissionFileLink } from '../../services/lecturer'
import type { SubmissionsReply } from '../../services/lecturer'
import ModalShell from '../admin/users/ModalShell'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Dar_es_Salaam' })

// "14,5" and "14.5" both work
const parseScore = (text: string): number | null | 'bad' => {
    const t = text.trim().replace(',', '.')
    if (t === '') return null
    const n = Number(t)
    return Number.isFinite(n) ? n : 'bad'
}

// The students of a course and the work each one handed in for one assignment. The lecturer reads it and gives a score.
const SubmissionsModal = ({ assignmentId, onClose, onChanged }: { assignmentId: number; onClose: () => void; onChanged: () => void }) => {
    const [data, setData] = useState<SubmissionsReply | null>(null)
    const [scores, setScores] = useState<Record<number, string>>({})
    const [loadError, setLoadError] = useState('')
    const [error, setError] = useState('')
    const [done, setDone] = useState('')
    const [busy, setBusy] = useState(false)

    const load = async () => {
        try {
            const res = await getSubmissions(assignmentId)
            setData(res)
            setScores(Object.fromEntries(res.students.map((s) => [s.studentId, s.score === null ? '' : String(s.score)])))
            setLoadError('')
        } catch (err) {
            setLoadError(getErrorMessage(err, 'Could not load the hand-ins.'))
        }
    }

    useEffect(() => {
        void load()
        // loaded once, when the window opens
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentId])

    const max = data?.assignment.maxScore ?? 0
    const changed = (data?.students ?? []).filter((s) => (scores[s.studentId] ?? '') !== (s.score === null ? '' : String(s.score)))
    const invalid = (text: string) => {
        const n = parseScore(text)
        return n === 'bad' || (n !== null && (n < 0 || n > max))
    }
    const anyInvalid = changed.some((s) => invalid(scores[s.studentId] ?? ''))

    const save = async () => {
        if (anyInvalid) return setError(`Scores must be numbers from 0 to ${max}.`)
        setBusy(true)
        setError('')
        setDone('')
        try {
            await saveScores(assignmentId, changed.map((s) => ({ studentId: s.studentId, score: parseScore(scores[s.studentId] ?? '') as number | null })))
            setDone('Scores saved. The students were notified of new scores.')
            await load()
            onChanged()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not save the scores.'))
        } finally {
            setBusy(false)
        }
    }

    const handedCount = data?.students.filter((s) => s.handedIn).length ?? 0

    return (
        <ModalShell
            title="Work handed in"
            subtitle={data ? `${data.assignment.title} · ${handedCount} of ${data.students.length} students` : undefined}
            onClose={onClose}
            wide
        >
            {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
            {!data && !loadError && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}

            {data && (
                <div className="space-y-3">
                    {data.students.length === 0 && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">No students are enrolled in this course yet.</p>}

                    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                        {data.students.map((s) => (
                            <li key={s.studentId} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-green-950">
                                        {s.name} <span className="text-xs font-normal text-gray-500">{s.regNumber}</span>
                                    </p>
                                    {s.handedIn ? (
                                        <>
                                            <p className="break-all text-xs text-gray-600">
                                                {s.handedIn.fileName} · {day(s.handedIn.at)}
                                                {s.handedIn.late && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">Late</span>}
                                            </p>
                                            {s.handedIn.note && <p className="mt-1 whitespace-pre-line rounded bg-green-50 p-2 text-xs text-gray-700">{s.handedIn.note}</p>}
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-500">Nothing handed in</p>
                                    )}
                                </div>
                                {s.handedIn && (
                                    <a
                                        href={submissionFileLink(assignmentId, s.studentId)}
                                        className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-1.5 text-xs font-medium text-green-900 hover:bg-green-50"
                                    >
                                        <FaDownload className="h-3 w-3" /> Download
                                    </a>
                                )}
                                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                                    Score /{max}
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={scores[s.studentId] ?? ''}
                                        aria-label={`Score for ${s.name}`}
                                        aria-invalid={invalid(scores[s.studentId] ?? '')}
                                        onChange={(e) => {
                                            setScores((p) => ({ ...p, [s.studentId]: e.target.value }))
                                            setError('')
                                            setDone('')
                                        }}
                                        className={`h-8 w-16 rounded-md border text-center text-sm outline-none focus:ring-2 focus:ring-green-500 ${invalid(scores[s.studentId] ?? '') ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                                            }`}
                                    />
                                </label>
                            </li>
                        ))}
                    </ul>

                    {error && (
                        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}
                    {done && (
                        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                            {done}
                        </p>
                    )}

                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-500">A student cannot hand in again once you give a score. Clear the score to open it again.</p>
                        <button
                            type="button"
                            onClick={() => void save()}
                            disabled={busy || changed.length === 0}
                            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-50"
                        >
                            {busy ? 'Saving...' : 'Save scores'}
                        </button>
                    </div>
                </div>
            )}
        </ModalShell>
    )
}

export default SubmissionsModal
