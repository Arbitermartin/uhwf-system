import { useEffect, useRef, useState } from 'react'
import { FaEnvelope, FaPhone } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import { deleteMessage, getMessage, setMessageRead } from '../../../services/messages'
import type { MessageFull } from '../../../services/messages'
import ModalShell from '../users/ModalShell'
import { formatDateTime } from '../users/userLabels'

// Opening a message marks it as read.
const MessageModal = ({
    messageId,
    onClose,
    onChanged,
}: {
    messageId: number
    onClose: () => void
    onChanged: (notice?: string) => void
}) => {
    const [message, setMessage] = useState<MessageFull | null>(null)
    const [loadError, setLoadError] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [armed, setArmed] = useState(false)
    const armTimer = useRef<number | undefined>(undefined)

    useEffect(() => {
        let cancelled = false
        getMessage(messageId)
            .then(async (m) => {
                if (cancelled) return
                setMessage({ ...m, isRead: true })
                if (!m.isRead) {
                    try {
                        await setMessageRead(messageId, true)
                        onChanged() // refresh the list and the unread count behind this window
                    } catch {
                        /* it stays unread; nothing else to do */
                    }
                }
            })
            .catch((err) => {
                if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this message.'))
            })
        return () => {
            cancelled = true
            window.clearTimeout(armTimer.current)
        }
        // onChanged is not a dependency on purpose: this must run once per message
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messageId])

    const markUnread = async () => {
        setBusy(true)
        setError('')
        try {
            await setMessageRead(messageId, false)
            onChanged('Marked as unread.')
            onClose()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not change the message.'))
            setBusy(false)
        }
    }

    const remove = async () => {
        if (!armed) {
            setArmed(true)
            window.clearTimeout(armTimer.current)
            armTimer.current = window.setTimeout(() => setArmed(false), 4000)
            return
        }
        setBusy(true)
        setError('')
        try {
            await deleteMessage(messageId)
            onChanged('Message deleted.')
            onClose()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the message.'))
            setBusy(false)
            setArmed(false)
        }
    }

    // Opens the admin's own email program, with the answer ready to write. (Replies are not sent from this system.)
    const replyHref = message
        ? `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}&body=${encodeURIComponent(
            `\n\n--- Your message of ${formatDateTime(message.createdAt)} ---\n${message.message.slice(0, 800)}`,
        )}`
        : '#'

    return (
        <ModalShell title="Message" subtitle={message?.subject} onClose={onClose} wide>
            {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
            {!message && !loadError && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}

            {message && (
                <>
                    <dl className="grid gap-3 rounded-lg bg-green-50 p-4 text-sm sm:grid-cols-3">
                        <div>
                            <dt className="text-xs text-gray-500">From</dt>
                            <dd className="font-medium text-green-950">{message.name}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Email</dt>
                            <dd className="break-all font-medium text-green-950">{message.email}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Phone</dt>
                            <dd className="font-medium text-green-950">{message.phone ?? '-'}</dd>
                        </div>
                        <div className="sm:col-span-3">
                            <dt className="text-xs text-gray-500">Received</dt>
                            <dd className="font-medium text-green-950">{formatDateTime(message.createdAt)}</dd>
                        </div>
                    </dl>

                    {/* React shows this as plain text, so nothing a visitor writes can run as code */}
                    <p className="mt-4 whitespace-pre-wrap break-words rounded-lg border border-gray-200 p-4 text-sm leading-relaxed text-gray-800">
                        {message.message}
                    </p>

                    {error && (
                        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <a
                            href={replyHref}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                        >
                            <FaEnvelope className="h-3.5 w-3.5" /> Reply by email
                        </a>
                        {message.phone && (
                            <a
                                href={`tel:${message.phone.replace(/\s/g, '')}`}
                                className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50"
                            >
                                <FaPhone className="h-3.5 w-3.5" /> Call
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={() => void markUnread()}
                            disabled={busy}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                            Mark as unread
                        </button>
                        <button
                            type="button"
                            onClick={() => void remove()}
                            disabled={busy}
                            className={`ml-auto rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60 ${armed ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                }`}
                        >
                            {armed ? 'Confirm delete' : 'Delete'}
                        </button>
                    </div>
                </>
            )}
        </ModalShell>
    )
}

export default MessageModal
