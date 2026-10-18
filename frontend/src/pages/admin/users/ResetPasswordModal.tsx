import { useState } from 'react'
import { FaCopy, FaKey } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import { resetPassword } from '../../../services/users'
import type { UserRow } from '../../../services/users'
import ModalShell from './ModalShell'
import { roleLabel } from './userLabels'

const ResetPasswordModal = ({
    user,
    onClose,
    onDone,
}: {
    user: UserRow
    onClose: () => void
    onDone: () => void
}) => {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [password, setPassword] = useState('')
    const [copyNote, setCopyNote] = useState('')

    const reset = async () => {
        setBusy(true)
        setError('')
        try {
            setPassword(await resetPassword(user.id))
        } catch (err) {
            setError(getErrorMessage(err, 'Could not reset the password.'))
        } finally {
            setBusy(false)
        }
    }

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(`Email: ${user.email}\nPassword: ${password}`)
            setCopyNote('Copied.')
        } catch {
            setCopyNote('Could not copy. Select the password and copy it by hand.')
        }
    }

    /* ---------- Step 2: show the new temporary password once ---------- */
    if (password) {
        return (
            <ModalShell title="Password reset" onClose={onDone}>
                <p className="text-sm text-gray-600">
                    <span className="font-semibold text-green-950">{user.fullName}</span> was signed out everywhere
                    and must choose a new password at their next sign-in.
                </p>

                <dl className="mt-4 space-y-3 rounded-lg bg-green-50 p-4 text-sm">
                    <div>
                        <dt className="text-xs text-gray-500">Email (sign-in name)</dt>
                        <dd className="font-medium text-green-950">{user.email}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500">New temporary password</dt>
                        <dd>
                            <input
                                readOnly
                                value={password}
                                aria-label="New temporary password"
                                onFocus={(e) => e.currentTarget.select()}
                                className="w-full rounded-md border border-green-200 bg-white px-3 py-2 font-mono text-sm text-green-950"
                            />
                        </dd>
                    </div>
                </dl>

                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    This password is shown only now and cannot be looked up later. Share it securely.
                </p>
                {copyNote && (
                    <p role="status" className="mt-2 text-sm text-gray-600">
                        {copyNote}
                    </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={copy}
                        className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-5 py-2 text-sm font-medium text-green-900 hover:bg-green-50"
                    >
                        <FaCopy className="h-3.5 w-3.5" /> Copy
                    </button>
                    <button
                        type="button"
                        onClick={onDone}
                        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                    >
                        Done
                    </button>
                </div>
            </ModalShell>
        )
    }

    /* ---------- Step 1: confirm ---------- */
    return (
        <ModalShell title="Reset password?" onClose={onClose}>
            <div className="flex gap-3 rounded-lg bg-amber-50 p-3 text-amber-900">
                <FaKey className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="text-sm">
                    <p className="font-semibold">
                        {user.fullName} ({roleLabel[user.role]})
                    </p>
                    <p>{user.email}</p>
                </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-gray-600">
                A new temporary password will be created. The current password stops working, the user is signed
                out on every device, and they must choose their own password the next time they sign in.
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
                    onClick={reset}
                    disabled={busy}
                    className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {busy ? 'Resetting...' : 'Reset password'}
                </button>
            </div>
        </ModalShell>
    )
}

export default ResetPasswordModal