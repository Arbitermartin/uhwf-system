import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaArrowDown, FaArrowUp, FaEdit, FaHandshake, FaPlus, FaTrashAlt } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../services/api'
import { createPartner, deletePartner, listAdminPartners, movePartner, updatePartner } from '../../services/partners'
import type { AdminPartner, PartnerInput } from '../../services/partners'
import ModalShell from './users/ModalShell'

type Fields = 'name' | 'description' | 'website' | 'logo'
type Errors = Partial<Record<Fields, string>>

const LOGO_MAX = 1024 * 1024
const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const PartnerFormModal = ({
    partner,
    onClose,
    onSaved,
}: {
    partner: AdminPartner | null
    onClose: () => void
    onSaved: (message: string) => void
}) => {
    const [name, setName] = useState(partner?.name ?? '')
    const [description, setDescription] = useState(partner?.description ?? '')
    const [website, setWebsite] = useState(partner?.website ?? '')
    const [active, setActive] = useState(partner?.active ?? true)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [removeLogo, setRemoveLogo] = useState(false)
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!file) {
            setPreview(null)
            return
        }
        const url = URL.createObjectURL(file)
        setPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [file])

    const chooseLogo = (e: ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0]
        e.target.value = ''
        if (!picked) return
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(picked.type)) {
            return setErrors((p) => ({ ...p, logo: 'Use a PNG, JPG or WebP picture.' }))
        }
        if (picked.size > LOGO_MAX) return setErrors((p) => ({ ...p, logo: 'The logo is larger than 1 MB.' }))
        setErrors((p) => ({ ...p, logo: undefined }))
        setFile(picked)
        setRemoveLogo(false)
    }

    const shownLogo = preview ?? (removeLogo ? null : partner?.logoUrl ?? null)

    const save = async () => {
        const found: Errors = {}
        if (name.trim().length < 2) found.name = 'Enter the partner name (at least 2 characters).'
        if (description.trim().length < 10) found.description = 'Write a short paragraph (at least 10 characters).'
        if (website.trim() && !/^https?:\/\/\S+\.\S+$/i.test(website.trim())) {
            found.website = 'The website must start with http:// or https://'
        }
        setErrors((p) => ({ ...found, logo: p.logo }))
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        const data: PartnerInput = {
            name: name.trim(),
            description: description.trim(),
            website: website.trim(),
            active,
            logo: file,
            removeLogo,
        }
        try {
            if (partner) await updatePartner(partner.id, data)
            else await createPartner(data)
            onSaved(partner ? 'Partner updated.' : 'Partner added.')
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not save the partner.'))
            setSaving(false)
        }
    }

    const cls = (k: Fields) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <ModalShell title={partner ? 'Edit partner' : 'Add partner'} onClose={onClose} wide>
            <div className="space-y-4">
                {serverError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}

                <div>
                    <p className="mb-1 text-xs font-medium text-gray-600">Logo or picture</p>
                    <div className="flex flex-wrap items-center gap-4">
                        {shownLogo ? (
                            <img src={shownLogo} alt="" className="h-24 w-40 rounded-lg border border-gray-200 bg-green-50 object-contain p-2" />
                        ) : (
                            <span className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                                <FaHandshake className="h-7 w-7" />
                            </span>
                        )}
                        <div className="space-y-2">
                            <label className="inline-flex cursor-pointer items-center rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50">
                                {shownLogo ? 'Choose another' : 'Choose a logo'}
                                <input type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="hidden" onChange={chooseLogo} />
                            </label>
                            {shownLogo && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFile(null)
                                        setRemoveLogo(true)
                                    }}
                                    className="block text-sm text-red-700 hover:underline"
                                >
                                    Remove the logo
                                </button>
                            )}
                            <p className="text-xs text-gray-500">PNG, JPG or WebP, up to 1 MB. A wide logo of about 600 × 300 pixels with a transparent background looks best.</p>
                        </div>
                    </div>
                    {errors.logo && <p className="mt-1 text-xs text-red-600">{errors.logo}</p>}
                </div>

                <div>
                    <label htmlFor="name" className="mb-1 block text-xs font-medium text-gray-600">Head title (the partner's name)</label>
                    <input id="name" value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }} maxLength={100} className={cls('name')} />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="description" className="mb-1 block text-xs font-medium text-gray-600">Paragraph</label>
                    <textarea
                        id="description"
                        rows={5}
                        value={description}
                        maxLength={600}
                        onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: undefined })) }}
                        className={`${cls('description')} resize-y`}
                    />
                    <p className="mt-1 text-xs text-gray-500">What this partner does with UHWF. {description.length} of 600 characters.</p>
                    {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                </div>

                <div>
                    <label htmlFor="website" className="mb-1 block text-xs font-medium text-gray-600">Website (optional)</label>
                    <input id="website" value={website} onChange={(e) => { setWebsite(e.target.value); setErrors((p) => ({ ...p, website: undefined })) }} maxLength={200} placeholder="https://" className={cls('website')} />
                    {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website}</p>}
                </div>

                <label className="flex items-start gap-3 rounded-lg bg-green-50 p-3 text-sm text-gray-700">
                    <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="mt-0.5 h-4 w-4 accent-green-700" />
                    <span>
                        <span className="font-medium text-green-950">Show on the website</span>
                        <span className="block text-xs text-gray-600">Leave this off to keep the partner hidden. Only show a partner that has agreed to be shown.</span>
                    </span>
                </label>

                <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void save()}
                        disabled={saving}
                        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : partner ? 'Save changes' : 'Add partner'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

const PartnersPage = () => {
    const [partners, setPartners] = useState<AdminPartner[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [note, setNote] = useState('')
    const [modal, setModal] = useState<{ partner: AdminPartner | null } | null>(null)

    const load = useCallback(async () => {
        try {
            setPartners(await listAdminPartners())
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load the partners.'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    const move = async (p: AdminPartner, direction: 'up' | 'down') => {
        try {
            await movePartner(p.id, direction)
            void load()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not change the order.'))
        }
    }

    const remove = async (p: AdminPartner) => {
        if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return
        try {
            await deletePartner(p.id)
            setNote('Partner deleted.')
            void load()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the partner.'))
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">Partners</h1>
                    <p className="text-sm text-gray-500">Shown in the partners slideshow on the Home page, in this order.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setModal({ partner: null })}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                >
                    <FaPlus className="h-3.5 w-3.5" /> Add partner
                </button>
            </div>

            {note && <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{note}</p>}
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading ? (
                    <p className="p-6 text-center text-sm text-gray-500">Loading...</p>
                ) : partners.length === 0 ? (
                    <p className="p-6 text-center text-sm text-gray-500">No partners yet. Press Add partner. Until then the slideshow does not show on the website.</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {partners.map((p, i) => (
                            <li key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                                {p.logoUrl ? (
                                    <img src={p.logoUrl} alt="" loading="lazy" className="h-14 w-24 rounded-md border border-gray-100 bg-green-50 object-contain p-1" />
                                ) : (
                                    <span className="flex h-14 w-24 items-center justify-center rounded-md bg-gray-100 text-gray-400"><FaHandshake /></span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-green-950">{p.name}</p>
                                    <p className="truncate text-xs text-gray-500">{p.description}</p>
                                </div>
                                <span className={`rounded px-2 py-0.5 text-xs font-medium ${p.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {p.active ? 'Shown' : 'Hidden'}
                                </span>
                                <button type="button" aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => void move(p, 'up')} className="p-2 text-green-900 hover:text-green-600 disabled:opacity-30"><FaArrowUp /></button>
                                <button type="button" aria-label={`Move ${p.name} down`} disabled={i === partners.length - 1} onClick={() => void move(p, 'down')} className="p-2 text-green-900 hover:text-green-600 disabled:opacity-30"><FaArrowDown /></button>
                                <button type="button" aria-label={`Edit ${p.name}`} onClick={() => setModal({ partner: p })} className="p-2 text-green-900 hover:text-green-600"><FaEdit /></button>
                                <button type="button" aria-label={`Delete ${p.name}`} onClick={() => void remove(p)} className="p-2 text-red-700 hover:text-red-500"><FaTrashAlt /></button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {modal && (
                <PartnerFormModal
                    partner={modal.partner}
                    onClose={() => setModal(null)}
                    onSaved={(m) => {
                        setModal(null)
                        setNote(m)
                        void load()
                    }}
                />
            )}
        </div>
    )
}

export default PartnersPage