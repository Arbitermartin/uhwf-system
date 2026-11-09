import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { applyForJob } from '../../../services/careers'
import type { PublicJob } from '../../../services/careers'
import ModalShell from '../../admin/users/ModalShell'

type Form = { fullName: string; email: string; phone: string; coverNote: string; website: string }
type Errors = Partial<Record<keyof Form | 'cv', string>>

const CV_MAX = 5 * 1024 * 1024
const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const ApplyModal = ({ job, onClose }: { job: PublicJob; onClose: () => void }) => {
    const [form, setForm] = useState<Form>({ fullName: '', email: '', phone: '', coverNote: '', website: '' })
    const [cv, setCv] = useState<File | null>(null)
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [sending, setSending] = useState(false)
    const [doneMessage, setDoneMessage] = useState('')

    const change = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Errors]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const pick = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        e.target.value = ''
        if (!file) return
        // Quick checks here. The server checks the real file again.
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            setCv(null)
            setErrors((p) => ({ ...p, cv: 'Your CV must be a PDF file.' }))
            return
        }
        if (file.size > CV_MAX) {
            setCv(null)
            setErrors((p) => ({ ...p, cv: 'The file is larger than 5 MB.' }))
            return
        }
        setCv(file)
        setErrors((p) => ({ ...p, cv: undefined }))
    }

    const send = async () => {
        const found: Errors = {}
        if (form.fullName.trim().length < 2) found.fullName = 'Enter your full name.'
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = 'Enter a valid email address.'
        if (form.phone.trim() && !/^[+\d\s-]{9,16}$/.test(form.phone.trim())) found.phone = 'Enter a valid phone number.'
        if (form.coverNote.length > 2000) found.coverNote = 'The note is too long (2000 characters at most).'
        if (!cv) found.cv = 'Please attach your CV as a PDF.'
        setErrors(found)
        if (Object.keys(found).length > 0 || !cv) return

        const body = new FormData()
        body.append('fullName', form.fullName.trim())
        body.append('email', form.email.trim())
        body.append('phone', form.phone.trim())
        body.append('coverNote', form.coverNote.trim())
        body.append('website', form.website)
        body.append('cv', cv)

        setSending(true)
        setServerError('')
        try {
            setDoneMessage(await applyForJob(job.id, body))
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not send your application. Please try again.'))
        } finally {
            setSending(false)
        }
    }

    const cls = (k: keyof Errors) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <ModalShell title="Apply for this job" subtitle={job.title} onClose={onClose}>
            {doneMessage ? (
                <div className="text-center">
                    <FaCheckCircle className="mx-auto h-14 w-14 text-green-600" />
                    <p className="mt-4 text-sm leading-relaxed text-gray-700">{doneMessage}</p>
                    <button type="button" onClick={onClose} className="mt-6 rounded-lg bg-amber-400 px-6 py-2.5 text-sm font-semibold text-green-950 hover:bg-amber-300">
                        Close
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {serverError && (
                        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {serverError}
                        </p>
                    )}

                    {/* Hidden from people, but bots fill it in. Real visitors never see or reach it. */}
                    <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                        <label htmlFor="website">Website</label>
                        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={change} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-gray-600">
                                Full name *
                            </label>
                            <input id="fullName" name="fullName" autoComplete="name" value={form.fullName} onChange={change} className={cls('fullName')} />
                            {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-600">
                                Email *
                            </label>
                            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} className={cls('email')} />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="phone" className="mb-1 block text-xs font-medium text-gray-600">
                            Phone (optional)
                        </label>
                        <input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={change} placeholder="+255 ..." className={cls('phone')} />
                        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                    </div>

                    <div>
                        <label htmlFor="coverNote" className="mb-1 block text-xs font-medium text-gray-600">
                            Cover note (optional)
                        </label>
                        <textarea
                            id="coverNote"
                            name="coverNote"
                            rows={4}
                            maxLength={2000}
                            value={form.coverNote}
                            onChange={change}
                            placeholder="Tell us briefly why you are a good fit."
                            className={`${cls('coverNote')} resize-none`}
                        />
                        {errors.coverNote && <p className="mt-1 text-xs text-red-600">{errors.coverNote}</p>}
                    </div>

                    <div>
                        <p className="mb-1 text-xs font-medium text-gray-600">Your CV (PDF, up to 5 MB) *</p>
                        <label
                            className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 text-sm hover:bg-green-50 ${errors.cv ? 'border-red-400' : 'border-green-300'
                                }`}
                        >
                            <span className="truncate text-gray-700">{cv ? cv.name : 'Choose a PDF file'}</span>
                            <span className="shrink-0 font-medium text-green-800">{cv ? 'Change' : 'Browse'}</span>
                            <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={pick} />
                        </label>
                        {errors.cv && <p className="mt-1 text-xs text-red-600">{errors.cv}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void send()}
                            disabled={sending}
                            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                        >
                            {sending ? 'Sending...' : 'Send application'}
                        </button>
                    </div>
                </div>
            )}
        </ModalShell>
    )
}

export default ApplyModal
