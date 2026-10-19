import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../services/api'
import { addTicketComment, getTicket } from '../../services/tickets'
import type { TicketDetail, TicketPriority } from '../../services/tickets'
import { updateTicket } from '../../services/ict'
import { useAuth } from '../../hooks/useAuth'
import ModalShell from '../../pages/admin/users/ModalShell'
import { dateTime, priorityLabel, priorityTag, ticketStatusLabel, ticketStatusTag } from './ticketLabels'

const roleName: Record<string, string> = {
    admin: 'Administrator',
    lecturer: 'Lecturer',
    student: 'Student',
    employee: 'Employee',
    ict: 'ICT',
}

// One conversation about one reported problem. `ict` switches on the ICT tools
// (change priority, assign, resolve, internal notes).
const TicketModal = ({
    ticketId,
    ict,
    onClose,
    onChanged,
}: {
    ticketId: number
    ict: boolean
    onClose: () => void
    onChanged: () => void
}) => {
    const { user } = useAuth()
    const [ticket, setTicket] = useState<TicketDetail | null>(null)
    const [loadError, setLoadError] = useState('')
    const [reply, setReply] = useState('')
    const [internal, setInternal] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        getTicket(ticketId)
            .then((t) => {
                if (!cancelled) setTicket(t)
            })
            .catch((err) => {
                if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this report.'))
            })
        return () => {
            cancelled = true
        }
    }, [ticketId])

    // Runs one change, shows the updated report, and tells the page behind to refresh.
    const run = async (action: () => Promise<TicketDetail>, after?: () => void) => {
        setBusy(true)
        setError('')
        try {
            setTicket(await action())
            after?.()
            onChanged()
        } catch (err) {
            setError(getErrorMessage(err, 'That did not work. Please try again.'))
        } finally {
            setBusy(false)
        }
    }

    const send = () => {
        if (!reply.trim()) {
            setError('Write a message first.')
            return
        }
        void run(
            () => addTicketComment(ticketId, reply.trim(), ict && internal),
            () => {
                setReply('')
                setInternal(false)
            },
        )
    }

    const assignedToMe = ticket?.assignedTo?.id === user?.id

    return (
        <ModalShell title={ticket ? `Report #${ticket.id}` : 'Report'
        } subtitle={ticket?.subject} onClose={onClose} wide>
            {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" > {loadError} </p>}
            {!ticket && !loadError && <p className="py-6 text-center text-sm text-gray-500" > Loading...</p>}

            {
                ticket && (
                    <>
                        <div className="flex flex-wrap items-center gap-2" >
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${ticketStatusTag[ticket.status]}`}>
                                {ticketStatusLabel[ticket.status]}
                            </span>
                            < span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityTag[ticket.priority]}`
                            }>
                                {priorityLabel[ticket.priority]} priority
                            </span>
                            < span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700" > {ticket.category} </span>
                        </div>

                        < p className="mt-3 text-xs text-gray-500" >
                            Reported by < span className="font-medium text-green-950" > {ticket.requester.fullName} </span> (
                            {roleName[ticket.requester.role]}
                            {ict ? `, ${ticket.requester.email}` : ''}) on {dateTime(ticket.createdAt)}
                            {' · '}
                            {ticket.assignedTo ? `Handled by ${ticket.assignedTo.fullName}` : 'Not assigned yet'}
                        </p>

                        {/* ICT tools */}
                        {
                            ict && (
                                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-green-50 p-3" >
                                    <label className="flex items-center gap-2 text-sm text-gray-700" >
                                        Priority
                                        < select
                                            value={ticket.priority}
                                            disabled={busy}
                                            onChange={(e) =>
                                                void run(() => updateTicket(ticket.id, { priority: e.target.value as TicketPriority }))
                                            }
                                            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm"
                                        >
                                            <option value="low" > Low </option>
                                            < option value="medium" > Medium </option>
                                            < option value="high" > High </option>
                                        </select>
                                    </label>
                                    < button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void run(() => updateTicket(ticket.id, { assign: assignedToMe ? 'none' : 'me' }))}
                                        className="rounded-md border border-green-900 px-3 py-1 text-sm font-medium text-green-900 hover:bg-white disabled:opacity-60"
                                    >
                                        {assignedToMe ? 'Unassign me' : 'Assign to me'}
                                    </button>
                                    < button
                                        type="button"
                                        disabled={busy}
                                        onClick={() =>
                                            void run(() => updateTicket(ticket.id, { status: ticket.status === 'open' ? 'resolved' : 'open' }))
                                        }
                                        className={`ml-auto rounded-md px-4 py-1 text-sm font-semibold disabled:opacity-60 ${ticket.status === 'open'
                                            ? 'bg-green-800 text-white hover:bg-green-900'
                                            : 'border border-amber-500 text-amber-800 hover:bg-amber-50'
                                            }`}
                                    >
                                        {ticket.status === 'open' ? 'Mark as resolved' : 'Reopen'}
                                    </button>
                                </div>
                            )}

                        {/* Conversation */}
                        <ul className="mt-4 space-y-3" >
                            {
                                ticket.comments.map((c) => {
                                    const mine = c.author.id === user?.id
                                    return (
                                        <li
                                            key={c.id}
                                            className={`rounded-lg p-3 text-sm ${c.isInternal
                                                ? 'border border-amber-300 bg-amber-50'
                                                : mine
                                                    ? 'bg-green-50'
                                                    : 'border border-gray-200 bg-white'
                                                }`
                                            }
                                        >
                                            <p className="flex flex-wrap items-center gap-2 text-xs text-gray-500" >
                                                <span className="font-semibold text-green-950" > {c.author.fullName} </span>
                                                < span > {roleName[c.author.role]} </span>
                                                < span > {dateTime(c.createdAt)
                                                } </span>
                                                {
                                                    c.isInternal && (
                                                        <span className="rounded bg-amber-200 px-1.5 py-0.5 font-medium text-amber-900" >
                                                            Internal note: only ICT can see this
                                                        </span>
                                                    )
                                                }
                                            </p>
                                            < p className="mt-1 whitespace-pre-wrap text-gray-800" > {c.body} </p>
                                        </li>
                                    )
                                })}
                        </ul>

                        {/* Reply */}
                        <div className="mt-4" >
                            <label htmlFor="reply" className="mb-1 block text-xs font-medium text-gray-600" >
                                {ict ? 'Reply' : 'Add a message'}
                            </label>
                            < textarea
                                id="reply"
                                rows={3}
                                value={reply}
                                maxLength={2000}
                                onChange={(e) => {
                                    setReply(e.target.value)
                                    setError('')
                                }}
                                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                            />
                            {!ict && ticket.status === 'resolved' && (
                                <p className="mt-1 text-xs text-gray-500" > Sending a message reopens this report.</p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-3" >
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={send}
                                    className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                                >
                                    {busy ? 'Sending...' : 'Send'}
                                </button>
                                {
                                    ict && (
                                        <label className="flex items-center gap-2 text-sm text-gray-700" >
                                            <input
                                                type="checkbox"
                                                checked={internal}
                                                onChange={(e) => setInternal(e.target.checked)
                                                }
                                                className="h-4 w-4 accent-amber-600"
                                            />
                                            Internal note(the person will not see it)
                                        </label>
                                    )}
                            </div>
                        </div>

                        {
                            error && (
                                <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" >
                                    {error}
                                </p>
                            )
                        }
                    </>
                )}
        </ModalShell>
    )
}

export default TicketModal
