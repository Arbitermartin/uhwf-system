import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { createJob, getJob, jobTypeLabel, jobTypes, updateJob } from '../../../services/careers'
import type { JobType } from '../../../services/careers'
import ModalShell from '../users/ModalShell'

type Form = { title: string; location: string; jobType: JobType; deadline: string; description: string; open: boolean }
type Errors = Partial<Record<keyof Form, string>>

const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const empty: Form = { title: '', location: '', jobType: 'full_time', deadline: '', description: '', open: true }

// One window for "Post a job" (jobId = null) and "Edit job".
const JobFormModal = ({
    jobId,
    onClose,
    onSaved,
}: {
    jobId: number | null
    onClose: () => void
    onSaved: (message: string) => void
}) => {
    const [form, setForm] = useState<Form>(empty)
    const [loaded, setLoaded] = useState(jobId === null)
    const [loadError, setLoadError] = useState('')
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (jobId === null) return
        let cancelled = false
        getJob(jobId)
            .then((j) => {
                if (cancelled) return
                setForm({
                    title: j.title,
                    location: j.location,
                    jobType: j.jobType,
                    deadline: j.closesOn,
                    description: j.description,
                    open: j.status === 'open',
                })
                setLoaded(true)
            })
            .catch((err) => {
                if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this job.'))
            })
        return () => {
            cancelled = true
        }
    }, [jobId])

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const save = async () => {
        const found: Errors = {}
        if (form.title.trim().length < 3) found.title = 'Enter the job title (at least 3 characters).'
        if (form.location.trim().length < 2) found.location = 'Enter the location.'
        if (form.description.trim().length < 20) found.description = 'Describe the job (at least 20 characters).'
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        const data = {
            title: form.title.trim(),
            location: form.location.trim(),
            jobType: form.jobType,
            description: form.description.trim(),
            deadline: form.deadline,
            open: form.open,
        }
        try {
            if (jobId === null) await createJob(data)
            else await updateJob(jobId, data)
            onSaved(
                form.open
                    ? 'Saved. The job is on the Career page.'
                    : 'Saved as closed. It is not visible on the Career page.',
            )
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not save the job.'))
            setSaving(false)
        }
    }

    const cls = (k: keyof Form) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <ModalShell title={jobId === null ? 'Post a job' : 'Edit job'} onClose={onClose} wide>
            {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
            {!loaded && !loadError && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}

            {loaded && (
                <div className="space-y-4">
                    {serverError && (
                        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {serverError}
                        </p>
                    )}

                    <div>
                        <label htmlFor="title" className="mb-1 block text-xs font-medium text-gray-600">
                            Job title
                        </label>
                        <input id="title" name="title" value={form.title} onChange={change} maxLength={120} placeholder="Field officer, land use planning" className={cls('title')} />
                        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label htmlFor="jobType" className="mb-1 block text-xs font-medium text-gray-600">
                                Type
                            </label>
                            <select id="jobType" name="jobType" value={form.jobType} onChange={change} className={cls('jobType')}>
                                {jobTypes.map((t) => (
                                    <option key={t} value={t}>
                                        {jobTypeLabel[t]}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="location" className="mb-1 block text-xs font-medium text-gray-600">
                                Location
                            </label>
                            <input id="location" name="location" value={form.location} onChange={change} maxLength={120} placeholder="Arusha" className={cls('location')} />
                            {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
                        </div>
                        <div>
                            <label htmlFor="deadline" className="mb-1 block text-xs font-medium text-gray-600">
                                Closing date (optional)
                            </label>
                            <input id="deadline" name="deadline" type="date" value={form.deadline} onChange={change} className={cls('deadline')} />
                            {errors.deadline && <p className="mt-1 text-xs text-red-600">{errors.deadline}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="mb-1 block text-xs font-medium text-gray-600">
                            Description and requirements
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={10}
                            value={form.description}
                            onChange={change}
                            maxLength={8000}
                            className={`${cls('description')} resize-y`}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Plain text. Write the duties, then a line "Requirements:" followed by one requirement per line. {form.description.length} of 8,000 characters.
                        </p>
                        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                    </div>

                    <label className="flex items-start gap-3 rounded-lg bg-green-50 p-3 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={form.open}
                            onChange={(e) => setForm((prev) => ({ ...prev, open: e.target.checked }))}
                            className="mt-0.5 h-4 w-4 accent-green-700"
                        />
                        <span>
                            <span className="font-medium text-green-950">Open for applications (show on the Career page)</span>
                            <span className="block text-xs text-gray-600">Leave this off to save the job as closed. Visitors cannot see it until you open it.</span>
                        </span>
                    </label>

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
                            {saving ? 'Saving...' : jobId === null ? 'Post job' : 'Save changes'}
                        </button>
                    </div>
                </div>
            )}
        </ModalShell>
    )
}

export default JobFormModal
