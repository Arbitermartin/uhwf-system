import { useState } from 'react'
import { FaExclamationTriangle } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import ModalShell from '../../admin/users/ModalShell'

// A "Are you sure?" window that runs an action and shows its error, if there is one.
const ConfirmModal = ({
    title,
    who,
    message,
    confirmLabel,
    danger = false,
    onConfirm,
    onClose,
}: {
    title: string
    who: string
    message: string
    confirmLabel: string
    danger?: boolean
    onConfirm: () => Promise<void>
    onClose: () => void
}) => {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const run = async () => {
        setBusy(true)
        setError('')
        try {
            await onConfirm()
        } catch (err) {
            setError(getErrorMessage(err, 'That did not work. Please try again.'))
            setBusy(false)
        }
    }

    return (
        <ModalShell title={title} onClose={onClose}>
            <div className={`flex gap-3 rounded-lg p-3 ${danger ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900'}`}>
                <FaExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm font-semibold">{who}</p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">{message}</p>
            {error && (
                <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => void run()}
                    disabled={busy}
                    className={`rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-60 ${danger ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-amber-400 text-green-950 hover:bg-amber-300'
                        }`}
                >
                    {busy ? 'Working...' : confirmLabel}
                </button>
            </div>
        </ModalShell>
    )
}

export default ConfirmModal
