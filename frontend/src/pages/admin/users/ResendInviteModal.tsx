import { useState } from 'react'
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import { resendInvitation } from '../../../services/invitations'
import type { Delivery } from '../../../services/invitations'
import ModalShell from './ModalShell'

// For a person who has not activated the account yet: sends a new invitation.
// The old link stops working at once.
const ResendInviteModal = ({
    userId,
    name,
    email,
    onClose,
    onDone,
}: {
    userId: number
    name: string
    email: string
    onClose: () => void
    onDone: (message: string) => void
}) => {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState<Delivery | null>(null)

    const send = async () => {
        setBusy(true)
        setError('')
        try {
            setResult(await resendInvitation(userId))
        } catch (err) {
            setError(getErrorMessage(err, 'Could not send the invitation.'))
        } finally {
            setBusy(false)
        }
    }

    if (result) {
        return (
            <ModalShell title="Invitation" onClose={() => onDone(result.message)}>
                <div className="text-center">
                    {result.sent ? <FaCheckCircle className="mx-auto h-14 w-14 text-green-600" /> : <FaExclamationTriangle className="mx-auto h-14 w-14 text-amber-500" />}
                    <p className={`mt-3 text-sm leading-relaxed ${result.sent ? 'text-gray-700' : 'text-amber-900'}`}>{result.message}</p>
                </div>
                <div className="mt-5 flex justify-end">
                    <button type="button" onClick={() => onDone(result.message)} className="rounded-lg bg-amber-400 px-6 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300">
                        Done
                    </button>
                </div>
            </ModalShell>
        )
    }

    return (
        <ModalShell title="Send the invitation again?" onClose={onClose}>
            <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                {name} ({email})
            </p>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
                This person has not activated the account yet. A new invitation is emailed, with a link that works for 60 minutes and only once. The
                previous link stops working now.
            </p>
            {error && (
                <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => void send()}
                    disabled={busy}
                    className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                >
                    {busy ? 'Sending...' : 'Send invitation'}
                </button>
            </div>
        </ModalShell>
    )
}

export default ResendInviteModal
