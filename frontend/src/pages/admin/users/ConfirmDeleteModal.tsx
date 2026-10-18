import { useState } from 'react'
import { FaExclamationTriangle } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import { deleteUser } from '../../../services/users'
import type { UserRow } from '../../../services/users'
import ModalShell from './ModalShell'
import { roleLabel } from './userLabels'

const ConfirmDeleteModal = ({
    user,
    onClose,
    onDeleted,
}: {
    user: UserRow
    onClose: () => void
    onDeleted: () => void
}) => {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const confirm = async () => {
        setBusy(true)
        setError('')
        try {
            await deleteUser(user.id)
            onDeleted()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete this user.'))
            setBusy(false)
        }
    }

    return (
        <ModalShell title="Delete user?" onClose={onClose}>
            <div className="flex gap-3 rounded-lg bg-red-50 p-3 text-red-800">
                <FaExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="text-sm">
                    <p className="font-semibold">
                        {user.fullName} ({roleLabel[user.role]})
                    </p>
                    <p>{user.email}</p>
                </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-gray-600">
                This permanently deletes the account and cannot be undone. If the user already has records in
                the system (messages, tickets, grades), deleting is refused and you should suspend the account
                instead.
            </p>

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
                    onClick={confirm}
                    disabled={busy}
                    className="rounded-lg bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {busy ? 'Deleting...' : 'Delete user'}
                </button>
            </div>
        </ModalShell>
    )
}

export default ConfirmDeleteModal