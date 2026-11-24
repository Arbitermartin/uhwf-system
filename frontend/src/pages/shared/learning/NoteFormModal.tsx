import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaPaperclip } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { NOTE_FILE_MAX, createNote, removeNoteFile, updateNote, uploadNoteFile } from '../../../services/learning'
import type { NoteDetail, NoteMeta } from '../../../services/learning'
import ModalShell from '../../admin/users/ModalShell'

type Errors = { courseId?: string; title?: string; body?: string; file?: string }

const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const GENERAL = 'general'

// One window for "Add a note" (note = null) and "Edit note".
const NoteFormModal = ({
    note,
    meta,
    onClose,
    onSaved,
}: {
    note: NoteDetail | null
    meta: NoteMeta
    onClose: () => void
    onSaved: (message: string) => void
}) => {
    const first = meta.postableCourses[0]
    const [course, setCourse] = useState<string>(note ? (note.courseId === null ? GENERAL : String(note.courseId)) : first ? String(first.id) : meta.canPostGeneral ? GENERAL : '')
    const [title, setTitle] = useState(note?.title ?? '')
    const [body, setBody] = useState(note?.body ?? '')
    const [file, setFile] = useState<File | null>(null)
    const [removeFile, setRemoveFile] = useState(false)
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)
    // After the text is saved once, a retry must update it, never create a second copy
    const [savedId, setSavedId] = useState<number | null>(note?.id ?? null)

    const pick = (e: ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0] ?? null
        e.target.value = ''
        if (!picked) return
        const name = picked.name.toLowerCase()
        if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
            return setErrors((p) => ({ ...p, file: 'Attach a PDF or a Word (.docx) file. An old .doc file must be saved as .docx.' }))
        }
        if (picked.size > NOTE_FILE_MAX) return setErrors((p) => ({ ...p, file: 'The file is larger than 10 MB.' }))
        setFile(picked)
        setRemoveFile(false)
        setErrors((p) => ({ ...p, file: undefined }))
    }

    const save = async () => {
        const found: Errors = {}
        if (!course) found.courseId = 'Choose where this note belongs.'
        if (title.trim().length < 3) found.title = 'Enter a title (at least 3 characters).'
        if (body.trim().length < 10) found.body = 'Write at least 10 characters.'
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        try {
            const data = { courseId: course === GENERAL ? null : Number(course), title: title.trim(), body: body.trim() }
            const saved = savedId === null ? await createNote(data) : await updateNote(savedId, data)
            setSavedId(saved.id)

            if (file) await uploadNoteFile(saved.id, file)
            else if (removeFile && saved.attachment) await removeNoteFile(saved.id)

            onSaved(note ? 'The note was updated.' : 'The note was added.')
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(
                savedId !== null && note === null
                    ? `${getErrorMessage(err, 'Something went wrong.')} The note text was saved, so you can try the file again.`
                    : getErrorMessage(err, 'Could not save the note.'),
            )
            setSaving(false)
        }
    }

    const cls = (k: keyof Errors) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`
    const hasExisting = !!note?.attachment && !removeFile && !file

    return (
        <ModalShell title={note ? 'Edit note' : 'Add a note'} onClose={onClose} wide>
            <div className="space-y-4">
                {serverError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}

                <div>
                    <label htmlFor="note-course" className="mb-1 block text-xs font-medium text-gray-600">
                        For
                    </label>
                    <select id="note-course" value={course} onChange={(e) => setCourse(e.target.value)} className={cls('courseId')}>
                        {meta.postableCourses.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.code} {c.title}
                            </option>
                        ))}
                        {(meta.canPostGeneral || note?.courseId === null) && <option value={GENERAL}>General (everybody)</option>}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">The students of a course see its notes. A general note is for everybody.</p>
                    {errors.courseId && <p className="mt-1 text-xs text-red-600">{errors.courseId}</p>}
                </div>

                <div>
                    <label htmlFor="note-title" className="mb-1 block text-xs font-medium text-gray-600">
                        Title
                    </label>
                    <input id="note-title" value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} placeholder="Week 1: wildlife corridors" className={cls('title')} />
                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </div>

                <div>
                    <label htmlFor="note-body" className="mb-1 block text-xs font-medium text-gray-600">
                        Note
                    </label>
                    <textarea id="note-body" rows={12} value={body} maxLength={30000} onChange={(e) => setBody(e.target.value)} className={`${cls('body')} resize-y`} />
                    <p className="mt-1 text-xs text-gray-500">Write in paragraphs: leave a blank line between them. {body.length} of 30,000 characters.</p>
                    {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body}</p>}
                </div>

                <div>
                    <p className="mb-1 text-xs font-medium text-gray-600">File (optional): a PDF or a Word (.docx) document, up to 10 MB</p>
                    {hasExisting && (
                        <p className="mb-2 flex flex-wrap items-center gap-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">
                            <FaPaperclip className="h-3.5 w-3.5" /> {note?.attachment?.name}
                            <button type="button" onClick={() => setRemoveFile(true)} className="ml-auto text-sm text-red-700 hover:underline">
                                Remove the file
                            </button>
                        </p>
                    )}
                    {removeFile && !file && <p className="mb-2 text-sm text-amber-800">The file will be removed when you save.</p>}
                    <label
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 text-sm hover:bg-green-50 ${errors.file ? 'border-red-400' : 'border-green-300'
                            }`}
                    >
                        <span className="flex min-w-0 items-center gap-2 text-gray-700">
                            <FaPaperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{file ? file.name : note?.attachment ? 'Choose a file to replace it' : 'Choose a file'}</span>
                        </span>
                        <span className="shrink-0 font-medium text-green-800">Browse</span>
                        <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={pick} />
                    </label>
                    {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void save()}
                        disabled={saving}
                        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : note ? 'Save changes' : 'Add note'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

export default NoteFormModal
