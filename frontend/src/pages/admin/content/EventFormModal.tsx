import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { createEvent, updateEvent } from '../../../services/content'
import type { EventRow } from '../../../services/content'
import ModalShell from '../users/ModalShell'

type Form = { title: string; location: string; description: string; date: string; time: string }
type Errors = Partial<Record<keyof Form, string>>

const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const EventFormModal = ({
    event,
    onClose,
    onSaved,
}: {
    event: EventRow | null
    onClose: () => void
    onSaved: (message: string) => void
}) => {
    const [form, setForm] = useState<Form>({
        title: event?.title ?? '',
        location: event?.location ?? '',
        description: event?.description ?? '',
        date: event?.date ?? '',
        // 00:00 means "all day", which is the same as leaving the time empty
        time: event && event.time !== '00:00' ? event.time : '',
    })
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)

    const change = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const save = async () => {
        const found: Errors = {}
        if (form.title.trim().length < 3) found.title = 'Enter a title (at least 3 characters).'
        if (form.location.trim().length < 2) found.location = 'Enter the place.'
        if (!form.date) found.date = 'Choose the date.'
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        const data = {
            title: form.title.trim(),
            location: form.location.trim(),
            description: form.description.trim(),
            date: form.date,
            time: form.time,
        }
        try {
            if (event) await updateEvent(event.id, data)
            else await createEvent(data)
            onSaved(event ? 'Event updated.' : 'Event added. It is on the website now.')
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not save the event.'))
            setSaving(false)
        }
    }

    const cls = (k: keyof Form) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <ModalShell title={event ? 'Edit event' : 'Add event'} onClose={onClose}>
            <div className="space-y-4">
                {serverError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}
                <div>
                    <label htmlFor="title" className="mb-1 block text-xs font-medium text-gray-600">
                        Title
                    </label>
                    <input id="title" name="title" value={form.title} onChange={change} maxLength={150} placeholder="Community land use workshop" className={cls('title')} />
                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="date" className="mb-1 block text-xs font-medium text-gray-600">
                            Date
                        </label>
                        <input id="date" name="date" type="date" value={form.date} onChange={change} className={cls('date')} />
                        {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
                    </div>
                    <div>
                        <label htmlFor="time" className="mb-1 block text-xs font-medium text-gray-600">
                            Time (optional)
                        </label>
                        <input id="time" name="time" type="time" value={form.time} onChange={change} className={cls('time')} />
                        <p className="mt-1 text-xs text-gray-500">Leave empty for an all-day event.</p>
                        {errors.time && <p className="mt-1 text-xs text-red-600">{errors.time}</p>}
                    </div>
                </div>
                <div>
                    <label htmlFor="location" className="mb-1 block text-xs font-medium text-gray-600">
                        Place
                    </label>
                    <input id="location" name="location" value={form.location} onChange={change} maxLength={150} placeholder="Arusha" className={cls('location')} />
                    {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
                </div>
                <div>
                    <label htmlFor="description" className="mb-1 block text-xs font-medium text-gray-600">
                        Details (optional)
                    </label>
                    <textarea id="description" name="description" rows={4} value={form.description} onChange={change} maxLength={3000} className={`${cls('description')} resize-none`} />
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
                        onClick={() => void save()}
                        disabled={saving}
                        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : event ? 'Save changes' : 'Add event'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

export default EventFormModal
