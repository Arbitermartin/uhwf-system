import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaArrowLeft, FaPaperclip } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { createIdea, ideaCategories, uploadAttachment } from '../../../services/ideas'

type Errors = { title?: string; category?: string; description?: string; file?: string }

const FILE_MAX = 5 * 1024 * 1024
const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const IdeaForm = ({ onCancel, onSent }: { onCancel: () => void; onSent: (message: string) => void }) => {
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState<string>(ideaCategories[0])
    const [description, setDescription] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [sending, setSending] = useState(false)
    // After the idea itself is saved once, a retry must not create a second copy
    const [savedId, setSavedId] = useState<number | null>(null)

    const pick = (e: ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0] ?? null
        e.target.value = ''
        if (!picked) return
        const okType = ['application/pdf', 'image/jpeg', 'image/png'].includes(picked.type)
        if (!okType) return setErrors((p) => ({ ...p, file: 'Attach a PDF, JPG or PNG file.' }))
        if (picked.size > FILE_MAX) return setErrors((p) => ({ ...p, file: 'The file is larger than 5 MB.' }))
        setFile(picked)
        setErrors((p) => ({ ...p, file: undefined }))
    }

    const send = async () => {
        const found: Errors = {}
        if (title.trim().length < 3) found.title = 'Enter a short title (at least 3 characters).'
        if (description.trim().length < 20) found.description = 'Describe your idea in at least 20 characters.'
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSending(true)
        setServerError('')
        try {
            let id = savedId
            if (id === null) {
                const idea = await createIdea({ title: title.trim(), category, description: description.trim() })
                id = idea.id
                setSavedId(id)
            }
            if (file) await uploadAttachment(id, file)
            onSent('Your idea was sent. Reviewers will give feedback here, and you will be notified.')
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(
                savedId !== null
                    ? `${getErrorMessage(err, 'Something went wrong.')} The idea was saved, so you can try the attachment again.`
                    : getErrorMessage(err, 'Could not send your idea.'),
            )
            setSending(false)
        }
    }

    const cls = (k: keyof Errors) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <div className="space-y-4">
            <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-700">
                <FaArrowLeft className="h-3 w-3" /> Back
            </button>
            <h2 className="text-xl font-bold text-green-950">Share an idea</h2>

            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                {serverError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}

                <div>
                    <label htmlFor="idea-title" className="mb-1 block text-xs font-medium text-gray-600">
                        Title
                    </label>
                    <input
                        id="idea-title"
                        value={title}
                        maxLength={120}
                        disabled={savedId !== null}
                        onChange={(e) => {
                            setTitle(e.target.value)
                            setErrors((p) => ({ ...p, title: undefined }))
                        }}
                        placeholder="Give your idea a short name"
                        className={cls('title')}
                    />
                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </div>

                <div>
                    <label htmlFor="idea-category" className="mb-1 block text-xs font-medium text-gray-600">
                        Category
                    </label>
                    <select id="idea-category" value={category} disabled={savedId !== null} onChange={(e) => setCategory(e.target.value)} className={cls('category')}>
                        {ideaCategories.map((c) => (
                            <option key={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="idea-description" className="mb-1 block text-xs font-medium text-gray-600">
                        Describe your idea
                    </label>
                    <textarea
                        id="idea-description"
                        rows={6}
                        value={description}
                        maxLength={4000}
                        disabled={savedId !== null}
                        onChange={(e) => {
                            setDescription(e.target.value)
                            setErrors((p) => ({ ...p, description: undefined }))
                        }}
                        placeholder="What problem does it solve, and how would it work?"
                        className={`${cls('description')} resize-y`}
                    />
                    {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                </div>

                <div>
                    <p className="mb-1 text-xs font-medium text-gray-600">Attachment (optional: PDF, JPG or PNG, up to 5 MB)</p>
                    <label
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 text-sm hover:bg-green-50 ${errors.file ? 'border-red-400' : 'border-green-300'
                            }`}
                    >
                        <span className="flex items-center gap-2 truncate text-gray-700">
                            <FaPaperclip className="h-3.5 w-3.5 text-gray-400" /> {file ? file.name : 'Choose a file'}
                        </span>
                        <span className="shrink-0 font-medium text-green-800">{file ? 'Change' : 'Browse'}</span>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="hidden" onChange={pick} />
                    </label>
                    {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => void send()}
                        disabled={sending}
                        className="rounded-lg bg-amber-400 px-6 py-2.5 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                    >
                        {sending ? 'Sending...' : savedId !== null ? 'Try the attachment again' : 'Send idea'}
                    </button>
                    <button type="button" onClick={onCancel} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                </div>
            </div>
            <p className="text-xs text-gray-500">Administrators, ICT and employees will review it. You will see all their feedback here.</p>
        </div>
    )
}

export default IdeaForm
