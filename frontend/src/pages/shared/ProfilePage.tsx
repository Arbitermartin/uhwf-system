import { useEffect, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FaCamera, FaCheckCircle, FaTrash } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage, getFieldErrors } from '../../services/api'
import { getProfile, removePhoto, saveProfile, uploadPhoto } from '../../services/profile'
import type { Profile } from '../../services/profile'
import { formatDate, formatDateTime, initials, roleLabel, roleTag, statusTag } from '../admin/users/userLabels'

type Form = { fullName: string; phone: string; gender: '' | 'female' | 'male' }
type Errors = Partial<Record<keyof Form, string>>

const inputCls = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'
const PHOTO_MAX_BYTES = 2 * 1024 * 1024

const toForm = (p: Profile): Form => ({ fullName: p.fullName, phone: p.phone ?? '', gender: p.gender ?? '' })

const validate = (f: Form): Errors => {
    const e: Errors = {}
    if (f.fullName.trim().length < 2) e.fullName = 'Enter your full name.'
    if (f.phone.trim() && !/^[+\d\s-]{9,16}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.'
    return e
}

const Item = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div>
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="text-sm font-medium text-green-950">{value ? value : '-'}</dd>
    </div>
)

const Card = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-green-950">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        <div className="mt-4">{children}</div>
    </section>
)

// The same page for every role: student, lecturer, employee, ICT and administrator.
const ProfilePage = () => {
    const { user, updateUser } = useAuth()

    const [profile, setProfile] = useState<Profile | null>(null)
    const [loadError, setLoadError] = useState('')
    const [form, setForm] = useState<Form | null>(null)
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const [photoBusy, setPhotoBusy] = useState(false)
    const [photoError, setPhotoError] = useState('')
    const [photoNote, setPhotoNote] = useState('')

    useEffect(() => {
        let cancelled = false
        getProfile()
            .then(({ profile: p }) => {
                if (cancelled) return
                setProfile(p)
                setForm(toForm(p))
            })
            .catch((err) => {
                if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load your profile.'))
            })
        return () => {
            cancelled = true
        }
    }, [])

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm((prev) => (prev ? { ...prev, [name]: value } : prev))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
        setSaved(false)
    }

    const save = async () => {
        if (!form) return
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        try {
            const res = await saveProfile({
                fullName: form.fullName.trim(),
                phone: form.phone.trim(),
                gender: form.gender,
            })
            setProfile(res.profile)
            setForm(toForm(res.profile))
            updateUser(res.user) // the new name shows in the sidebar and top bar at once
            setSaved(true)
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not save your details.'))
        } finally {
            setSaving(false)
        }
    }

    const choosePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        // Quick checks here. The server checks the real picture again.
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setPhotoError('Use a JPG or PNG picture.')
            return
        }
        if (file.size > PHOTO_MAX_BYTES) {
            setPhotoError('The picture is larger than 2 MB.')
            return
        }
        setPhotoBusy(true)
        setPhotoError('')
        setPhotoNote('')
        try {
            const res = await uploadPhoto(file)
            setProfile(res.profile)
            updateUser(res.user) // the new picture shows in the sidebar and top bar at once
            setPhotoNote('Your picture was updated.')
        } catch (err) {
            setPhotoError(getErrorMessage(err, 'Could not upload the picture.'))
        } finally {
            setPhotoBusy(false)
        }
    }

    const deletePhoto = async () => {
        setPhotoBusy(true)
        setPhotoError('')
        setPhotoNote('')
        try {
            const res = await removePhoto()
            setProfile(res.profile)
            updateUser(res.user)
            setPhotoNote('Your picture was removed.')
        } catch (err) {
            setPhotoError(getErrorMessage(err, 'Could not remove the picture.'))
        } finally {
            setPhotoBusy(false)
        }
    }

    if (!profile || !form) {
        return (
            <div className="mx-auto max-w-3xl py-10 text-center text-sm text-gray-500">
                {loadError ? (
                    <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
                        {loadError}
                    </p>
                ) : (
                    'Loading your profile...'
                )}
            </div>
        )
    }

    const dirty = JSON.stringify(toForm(profile)) !== JSON.stringify(form)
    const cls = (key: keyof Form) => `${inputCls} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">My profile</h1>
                <p className="text-sm text-gray-500">Your details and your picture. Both show across the system.</p>
            </div>

            {/* Picture */}
            <Card title="Profile picture" subtitle="JPG or PNG, up to 2 MB.">
                <div className="flex flex-wrap items-center gap-5">
                    {profile.photo ? (
                        <img
                            src={profile.photo}
                            alt="Your profile picture"
                            className="h-28 w-28 rounded-full border-4 border-amber-400 object-cover"
                        />
                    ) : (
                        <span
                            aria-label="No profile picture yet"
                            className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-amber-400 bg-green-200 text-3xl font-semibold text-green-950"
                        >
                            {initials(profile.fullName)}
                        </span>
                    )}

                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            <label
                                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 ${photoBusy ? 'pointer-events-none opacity-60' : ''
                                    }`}
                            >
                                <FaCamera className="h-3.5 w-3.5" />
                                {photoBusy ? 'Working...' : profile.photo ? 'Change picture' : 'Upload picture'}
                                <input type="file" accept=".jpg,.jpeg,.png" className="hidden" disabled={photoBusy} onChange={choosePhoto} />
                            </label>
                            {profile.photo && (
                                <button
                                    type="button"
                                    onClick={() => void deletePhoto()}
                                    disabled={photoBusy}
                                    className="inline-flex items-center gap-2 rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                                >
                                    <FaTrash className="h-3 w-3" /> Remove
                                </button>
                            )}
                        </div>
                        {photoNote && (
                            <p role="status" className="flex items-center gap-1.5 text-sm text-green-800">
                                <FaCheckCircle className="h-3.5 w-3.5" /> {photoNote}
                            </p>
                        )}
                        {photoError && (
                            <p role="alert" className="text-sm text-red-700">
                                {photoError}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            {/* Details */}
            <Card title="Your details">
                {serverError && (
                    <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}
                {saved && (
                    <p role="status" className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800">
                        <FaCheckCircle className="h-4 w-4" /> Your details were saved.
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-gray-600">
                            Full name
                        </label>
                        <input id="fullName" name="fullName" value={form.fullName} onChange={change} maxLength={100} className={cls('fullName')} />
                        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
                    </div>
                    <div>
                        <label htmlFor="phone" className="mb-1 block text-xs font-medium text-gray-600">
                            Phone
                        </label>
                        <input id="phone" name="phone" type="tel" value={form.phone} onChange={change} placeholder="+255 ..." className={cls('phone')} />
                        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                    </div>
                    <div>
                        <label htmlFor="gender" className="mb-1 block text-xs font-medium text-gray-600">
                            Gender
                        </label>
                        <select id="gender" name="gender" value={form.gender} onChange={change} className={cls('gender')}>
                            <option value="">Not set</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                        </select>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-medium text-gray-600">Email (your sign-in name)</p>
                        <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{profile.email}</p>
                        <p className="mt-1 text-xs text-gray-500">To change your email, ask the administrator.</p>
                    </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => void save()}
                        disabled={saving || !dirty}
                        className="rounded-lg bg-amber-400 px-6 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    {dirty && (
                        <button
                            type="button"
                            onClick={() => {
                                setForm(toForm(profile))
                                setErrors({})
                                setServerError('')
                            }}
                            className="text-sm text-gray-600 hover:underline"
                        >
                            Undo changes
                        </button>
                    )}
                </div>
            </Card>

            {/* Role record: read-only, set by the administrator */}
            {profile.student && (
                <Card title="Student record" subtitle="Set by the administration.">
                    <dl className="grid gap-3 sm:grid-cols-2">
                        <Item label="Registration number" value={profile.student.regNumber} />
                        <Item label="Programme" value={profile.student.programme} />
                        <Item label="Year of study" value={profile.student.yearOfStudy} />
                        <Item label="Admitted" value={formatDate(profile.student.admittedAt)} />
                    </dl>
                </Card>
            )}
            {profile.lecturer && (
                <Card title="Lecturer record" subtitle="Set by the administration.">
                    <dl className="grid gap-3 sm:grid-cols-2">
                        <Item label="Staff ID" value={profile.lecturer.staffId} />
                        <Item label="Department" value={profile.lecturer.department} />
                        <Item label="Qualification" value={profile.lecturer.qualification} />
                    </dl>
                </Card>
            )}
            {profile.employee && (
                <Card title="Employee record" subtitle="Set by the administration.">
                    <dl className="grid gap-3 sm:grid-cols-2">
                        <Item label="Staff ID" value={profile.employee.staffId} />
                        <Item label="Department" value={profile.employee.department} />
                        <Item label="Position" value={profile.employee.position} />
                        <Item label="Supervisor" value={profile.employee.supervisor} />
                    </dl>
                </Card>
            )}

            {/* Account */}
            <Card title="Account">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${roleTag[profile.role]}`}>{roleLabel[profile.role]}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusTag[profile.status]}`}>{profile.status}</span>
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Item label="Member since" value={formatDate(profile.createdAt)} />
                    <Item label="Last sign-in" value={profile.lastLoginAt ? formatDateTime(profile.lastLoginAt) : 'This is your first visit'} />
                </dl>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <Link to={`/${user?.role ?? ''}/password`} className="font-medium text-green-800 hover:underline">
                        Change password
                    </Link>
                    <Link to={`/${user?.role ?? ''}/support`} className="font-medium text-green-800 hover:underline">
                        Report a problem
                    </Link>
                </div>
            </Card>
        </div>
    )
}

export default ProfilePage
