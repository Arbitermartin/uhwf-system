import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaDownload, FaPaperclip } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { ASSIGNMENT_FILE_MAX, assignmentFileLink, submitAssignment } from '../../services/student'
import type { ResultAssignment } from '../../services/student'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Dar_es_Salaam' })

// The place under an assignment where a student hands in a Word (.docx) or PDF file.
const HandIn = ({ assignment, onDone }: { assignment: ResultAssignment; onDone: () => void }) => {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [note, setNote] = useState('')
    const [fileError, setFileError] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const closed = assignment.canHandIn === false // the lecturer already scored it
    const handedIn = assignment.handedIn ?? null

    const choose = (e: ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0] ?? null
        e.target.value = ''
        if (!picked) return
        const name = picked.name.toLowerCase()
        if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
            setFile(null)
            return setFileError('Choose a Word (.docx) or PDF file. An old .doc file can be saved as .docx.')
        }
        if (picked.size > ASSIGNMENT_FILE_MAX) {
            setFile(null)
            return setFileError('The file is larger than 10 MB.')
        }
        setFile(picked)
        setFileError('')
        setError('')
    }

    const send = async () => {
        if (!file) return setFileError('Choose your file first.')
        setBusy(true)
        setError('')
        try {
            await submitAssignment(assignment.id, file, note)
            setFile(null)
            setNote('')
            setOpen(false)
            onDone()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not hand in your work. Please try again.'))
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="mt-2 w-full">
            {handedIn ? (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-900">
                    <span>
                        Handed in {day(handedIn.at)}: <span className="break-all font-medium">{handedIn.fileName}</span>
                    </span>
                    {handedIn.late && <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">Late</span>}
                    <a href={assignmentFileLink(assignment.id)} className="inline-flex items-center gap-1 font-medium text-green-800 hover:underline">
                        <FaDownload className="h-3 w-3" /> Download
                    </a>
                </p>
            ) : (
                !closed && <p className="text-xs text-gray-500">You have not handed in work for this assignment yet.</p>
            )}

            {closed ? (
                <p className="mt-1 text-xs text-gray-500">Your lecturer scored this work, so it is closed.</p>
            ) : !open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="mt-1 rounded-lg border border-green-900 px-3 py-1 text-xs font-semibold text-green-900 hover:bg-green-50"
                >
                    {handedIn ? 'Hand in a new version' : 'Hand in work'}
                </button>
            ) : (
                <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3">
                    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2 text-sm hover:bg-green-50 ${fileError ? 'border-red-400' : 'border-green-300'}`}>
                        <span className="flex min-w-0 items-center gap-2 text-gray-700">
                            <FaPaperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{file ? file.name : 'Choose a Word (.docx) or PDF file, up to 10 MB'}</span>
                        </span>
                        <span className="shrink-0 font-medium text-green-800">{file ? 'Change' : 'Browse'}</span>
                        <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={choose} />
                    </label>
                    {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
                    <textarea
                        rows={2}
                        maxLength={1000}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="A note for your lecturer (optional)"
                        aria-label="Note for your lecturer"
                        className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {error && (
                        <p role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                            {error}
                        </p>
                    )}
                    <div className="mt-2 flex gap-2">
                        <button
                            type="button"
                            onClick={() => void send()}
                            disabled={busy}
                            className="rounded-lg bg-amber-400 px-4 py-1.5 text-xs font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                        >
                            {busy ? 'Handing in...' : 'Hand in'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false)
                                setFile(null)
                                setFileError('')
                                setError('')
                            }}
                            className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HandIn
