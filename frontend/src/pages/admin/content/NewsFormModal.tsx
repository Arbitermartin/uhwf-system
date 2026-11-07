import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaImage } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { createNews, getNews, removeNewsImage, updateNews, uploadNewsImage } from '../../../services/content'
import type { NewsFull } from '../../../services/content'
import ModalShell from '../users/ModalShell'

type Errors = { title?: string; content?: string }

const IMAGE_MAX = 5 * 1024 * 1024
const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

// One window for "Write news" (newsId = null) and "Edit news".
const NewsFormModal = ({
    newsId,
    onClose,
    onSaved,
}: {
    newsId: number | null
    onClose: () => void
    onSaved: (message: string) => void
}) => {
    const [loaded, setLoaded] = useState(newsId === null)
    const [loadError, setLoadError] = useState('')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [publish, setPublish] = useState(false)
    const [currentImage, setCurrentImage] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [removeImage, setRemoveImage] = useState(false)
    const [errors, setErrors] = useState<Errors>({})
    const [imageError, setImageError] = useState('')
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)
    // After the text is saved once, a retry must update it, never create a second copy
    const [savedId, setSavedId] = useState<number | null>(newsId)

    useEffect(() => {
        if (newsId === null) return
        let cancelled = false
        getNews(newsId)
            .then((n: NewsFull) => {
                if (cancelled) return
                setTitle(n.title)
                setContent(n.content)
                setPublish(n.published)
                setCurrentImage(n.image)
                setLoaded(true)
            })
            .catch((err) => {
                if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this article.'))
            })
        return () => {
            cancelled = true
        }
    }, [newsId])

    // a preview of the chosen picture, cleaned up when it changes
    useEffect(() => {
        if (!file) {
            setPreview(null)
            return
        }
        const url = URL.createObjectURL(file)
        setPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [file])

    const choose = (e: ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0]
        e.target.value = ''
        if (!picked) return
        if (!['image/jpeg', 'image/png'].includes(picked.type)) {
            setImageError('Use a JPG or PNG picture.')
            return
        }
        if (picked.size > IMAGE_MAX) {
            setImageError('The picture is larger than 5 MB.')
            return
        }
        setImageError('')
        setFile(picked)
        setRemoveImage(false)
    }

    const save = async () => {
        const found: Errors = {}
        if (title.trim().length < 3) found.title = 'Enter a title (at least 3 characters).'
        if (content.trim().length < 20) found.content = 'Write at least 20 characters.'
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        try {
            const data = { title: title.trim(), content: content.trim(), publish }
            const saved = savedId === null ? await createNews(data) : await updateNews(savedId, data)
            setSavedId(saved.id)

            if (file) await uploadNewsImage(saved.id, file)
            else if (removeImage && currentImage) await removeNewsImage(saved.id)

            onSaved(publish ? 'Saved and published on the website.' : 'Saved as a draft. It is not visible on the website yet.')
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(
                savedId !== null
                    ? `${getErrorMessage(err, 'Something went wrong.')} The text was saved, so you can try again.`
                    : getErrorMessage(err, 'Could not save the article.'),
            )
            setSaving(false)
        }
    }

    const shownImage = preview ?? (removeImage ? null : currentImage)

    return (
        <ModalShell title={newsId === null ? 'Write news' : 'Edit news'} onClose={onClose} wide>
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
                            Title
                        </label>
                        <input
                            id="title"
                            value={title}
                            maxLength={150}
                            onChange={(e) => {
                                setTitle(e.target.value)
                                setErrors((p) => ({ ...p, title: undefined }))
                            }}
                            className={`${inputBase} ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                    </div>

                    <div>
                        <label htmlFor="content" className="mb-1 block text-xs font-medium text-gray-600">
                            Article
                        </label>
                        <textarea
                            id="content"
                            rows={10}
                            value={content}
                            maxLength={20000}
                            onChange={(e) => {
                                setContent(e.target.value)
                                setErrors((p) => ({ ...p, content: undefined }))
                            }}
                            className={`${inputBase} resize-y ${errors.content ? 'border-red-400' : 'border-gray-200'}`}
                        />
                        <p className="mt-1 text-xs text-gray-500">Plain text. Leave a blank line between paragraphs. {content.length} of 20,000 characters.</p>
                        {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
                    </div>

                    <div>
                        <p className="mb-1 text-xs font-medium text-gray-600">Picture (optional)</p>
                        <div className="flex flex-wrap items-center gap-4">
                            {shownImage ? (
                                <img src={shownImage} alt="" className="h-24 w-36 rounded-lg border border-gray-200 object-cover" />
                            ) : (
                                <span className="flex h-24 w-36 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                                    <FaImage className="h-6 w-6" />
                                </span>
                            )}
                            <div className="space-y-2">
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50">
                                    {shownImage ? 'Choose another' : 'Choose a picture'}
                                    <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={choose} />
                                </label>
                                {shownImage && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFile(null)
                                            setRemoveImage(true)
                                        }}
                                        className="block text-sm text-red-700 hover:underline"
                                    >
                                        Remove the picture
                                    </button>
                                )}
                                <p className="text-xs text-gray-500">JPG or PNG, up to 5 MB.</p>
                            </div>
                        </div>
                        {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
                    </div>

                    <label className="flex items-start gap-3 rounded-lg bg-green-50 p-3 text-sm text-gray-700">
                        <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="mt-0.5 h-4 w-4 accent-green-700" />
                        <span>
                            <span className="font-medium text-green-950">Publish on the website</span>
                            <span className="block text-xs text-gray-600">Leave this off to keep the article as a draft that only administrators can see.</span>
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
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
        </ModalShell>
    )
}

export default NewsFormModal
