import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../services/api'
import { createTicket, listMyTickets, ticketCategories } from '../../services/tickets'
import type { MyTicket, NewTicket, TicketCategory, TicketPriority } from '../../services/tickets'
import TicketModal from '../../components/tickets/TicketModal'
import { priorityLabel, priorityTag, ticketStatusLabel, ticketStatusTag, timeAgo } from '../../components/tickets/ticketLabels'

type Form = { category: TicketCategory; priority: TicketPriority; subject: string; description: string }
type Errors = Partial<Record<keyof Form, string>>

const emptyForm: Form = { category: 'Other', priority: 'medium', subject: '', description: '' }

const inputCls = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const validate = (f: Form): Errors => {
    const e: Errors = {}
    if (f.subject.trim().length < 5) e.subject = 'Describe the problem in a few words (at least 5 characters).'
    if (f.description.trim().length < 10) e.description = 'Tell us more (at least 10 characters).'
    return e
}

// Works the same for every role: student, lecturer, employee, ICT and administrator.
const ReportProblem = () => {
    const [form, setForm] = useState<Form>(emptyForm)
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [sending, setSending] = useState(false)
    const [notice, setNotice] = useState('')

    const [tickets, setTickets] = useState<MyTicket[] | null>(null)
    const [listError, setListError] = useState('')
    const [openId, setOpenId] = useState<number | null>(null)

    const load = useCallback(async () => {
        try {
            setTickets(await listMyTickets())
            setListError('')
        } catch (err) {
            setListError(getErrorMessage(err, 'Could not load your reports.'))
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
        setNotice('')
    }

    const send = async () => {
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSending(true)
        setServerError('')
        try {
            const data: NewTicket = {
                subject: form.subject.trim(),
                description: form.description.trim(),
                priority: form.priority,
                category: form.category,
            }
            const ticket = await createTicket(data)
            setForm(emptyForm)
            setNotice(`Your report was sent to ICT (report #${ticket.id}). You will get a notification when they reply.`)
            void load()
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not send your report.'))
        } finally {
            setSending(false)
        }
    }

    const cls = (key: keyof Form) => `${inputCls} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">Report a problem</h1>
                <p className="text-sm text-gray-500">Something not working? Tell the ICT team and follow the answer here.</p>
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                {notice && (
                    <p role="status" className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800">
                        <FaCheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
                    </p>
                )}
                {serverError && (
                    <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="category" className="mb-1 block text-xs font-medium text-gray-600">
                            What is it about?
                        </label>
                        <select id="category" name="category" value={form.category} onChange={change} className={cls('category')}>
                            {ticketCategories.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="priority" className="mb-1 block text-xs font-medium text-gray-600">
                            How urgent is it?
                        </label>
                        <select id="priority" name="priority" value={form.priority} onChange={change} className={cls('priority')}>
                            <option value="low">Low: it can wait</option>
                            <option value="medium">Medium</option>
                            <option value="high">High: I cannot continue</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4">
                    <label htmlFor="subject" className="mb-1 block text-xs font-medium text-gray-600">
                        In a few words
                    </label>
                    <input
                        id="subject"
                        name="subject"
                        type="text"
                        maxLength={120}
                        value={form.subject}
                        onChange={change}
                        placeholder="For example: I cannot upload my certificate"
                        className={cls('subject')}
                    />
                    {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
                </div>

                <div className="mt-4">
                    <label htmlFor="description" className="mb-1 block text-xs font-medium text-gray-600">
                        Details
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        maxLength={2000}
                        value={form.description}
                        onChange={change}
                        placeholder="What did you do, and what happened? Never write your password here."
                        className={`${cls('description')} resize-none`}
                    />
                    {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                </div>

                <button
                    type="button"
                    onClick={send}
                    disabled={sending}
                    className="mt-5 rounded-lg bg-amber-400 px-6 py-2.5 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {sending ? 'Sending...' : 'Send to ICT'}
                </button>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-green-950">Your reports</h2>
                {listError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{listError}</p>}
                {!tickets && !listError && <p className="mt-3 text-sm text-gray-500">Loading...</p>}
                {tickets && tickets.length === 0 && <p className="mt-3 text-sm text-gray-500">You have not reported anything yet.</p>}

                <ul className="mt-2 divide-y divide-gray-100">
                    {tickets?.map((t) => (
                        <li key={t.id}>
                            <button
                                type="button"
                                onClick={() => setOpenId(t.id)}
                                className="flex w-full flex-wrap items-center gap-3 py-3 text-left hover:bg-green-50"
                            >
                                <span className="w-10 text-sm text-gray-500">#{t.id}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-green-950">{t.subject}</span>
                                    <span className="block text-xs text-gray-500">
                                        {t.category} · {timeAgo(t.createdAt)} · {t.comments} message{t.comments === 1 ? '' : 's'}
                                    </span>
                                </span>
                                <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityTag[t.priority]}`}>
                                    {priorityLabel[t.priority]}
                                </span>
                                <span className={`rounded px-2 py-0.5 text-xs font-medium ${ticketStatusTag[t.status]}`}>
                                    {ticketStatusLabel[t.status]}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            {openId !== null && (
                <TicketModal ticketId={openId} ict={false} onClose={() => setOpenId(null)} onChanged={() => void load()} />
            )}
        </div>
    )
}

export default ReportProblem
