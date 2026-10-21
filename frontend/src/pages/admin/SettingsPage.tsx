import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaCheckCircle, FaPlus } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../services/api'
import {
    createDepartment,
    getAdmissionSettings,
    listDepartmentRows,
    removeDepartment,
    renameDepartment,
    saveAdmissionSettings,
} from '../../services/settings'
import type { AdmissionSettings, AdmissionState, DepartmentRow } from '../../services/settings'

/* ============================ Admission ============================ */

type Form = {
    enabled: boolean
    intake: string
    opensOn: string
    closesOn: string
    fee: string
    maxCourses: string
}
type Errors = Partial<Record<keyof Form, string>>

const toForm = (s: AdmissionSettings): Form => ({
    enabled: s.enabled,
    intake: s.intake,
    opensOn: s.opensOn,
    closesOn: s.closesOn,
    fee: String(s.fee),
    maxCourses: String(s.maxCourses),
})

const validate = (f: Form): Errors => {
    const e: Errors = {}
    const years = /^(\d{4})\/(\d{4})$/.exec(f.intake.trim())
    if (!years) e.intake = 'Use the format 2026/2027.'
    else if (Number(years[2]) !== Number(years[1]) + 1) e.intake = 'The second year must follow the first.'
    if (!f.opensOn) e.opensOn = 'Choose the opening date.'
    if (!f.closesOn) e.closesOn = 'Choose the closing date.'
    else if (f.opensOn && f.closesOn < f.opensOn) e.closesOn = 'The closing date cannot be before the opening date.'
    const fee = Number(f.fee)
    if (!f.fee.trim() || !Number.isInteger(fee) || fee < 1) e.fee = 'Enter the fee as a whole number, at least 1.'
    else if (fee > 100_000_000) e.fee = 'The fee is too large.'
    const max = Number(f.maxCourses)
    if (!f.maxCourses.trim() || !Number.isInteger(max) || max < 1 || max > 10) e.maxCourses = 'Enter a whole number from 1 to 10.'
    return e
}

const stateInfo: Record<AdmissionState, { label: string; cls: string }> = {
    open: { label: 'Open now', cls: 'bg-green-100 text-green-800' },
    upcoming: { label: 'Opens soon', cls: 'bg-amber-100 text-amber-900' },
    closed: { label: 'Closed', cls: 'bg-red-100 text-red-800' },
}

const inputCls = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const AdmissionCard = () => {
    const [saved, setSaved] = useState<AdmissionSettings | null>(null)
    const [form, setForm] = useState<Form | null>(null)
    const [errors, setErrors] = useState<Errors>({})
    const [loadError, setLoadError] = useState('')
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)
    const [done, setDone] = useState(false)

    useEffect(() => {
        let cancelled = false
        getAdmissionSettings()
            .then((s) => {
                if (cancelled) return
                setSaved(s)
                setForm(toForm(s))
            })
            .catch((err) => {
                if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load the admission settings.'))
            })
        return () => {
            cancelled = true
        }
    }, [])

    const change = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setForm((prev) => (prev ? { ...prev, [name]: value } : prev))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
        setDone(false)
    }

    const save = async () => {
        if (!form) return
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        try {
            const next = await saveAdmissionSettings({
                enabled: form.enabled,
                intake: form.intake.trim(),
                opensOn: form.opensOn,
                closesOn: form.closesOn,
                fee: Number(form.fee),
                maxCourses: Number(form.maxCourses),
            })
            setSaved(next)
            setForm(toForm(next))
            setDone(true)
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not save the settings.'))
        } finally {
            setSaving(false)
        }
    }

    const dirty = !!saved && !!form && JSON.stringify(toForm(saved)) !== JSON.stringify(form)
    const cls = (key: keyof Form) => `${inputCls} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`
    const state = saved ? stateInfo[saved.status] : null

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="font-semibold text-green-950">Admission</h2>
                    <p className="text-xs text-gray-500">Controls who can create a student account and apply. Dates are in Tanzania time.</p>
                </div>
                {state && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${state.cls}`}>{state.label}</span>}
            </div>

            {loadError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
            {!form && !loadError && <p className="mt-4 text-sm text-gray-500">Loading...</p>}

            {form && (
                <div className="mt-4 space-y-4">
                    {serverError && (
                        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {serverError}
                        </p>
                    )}
                    {done && (
                        <p role="status" className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800">
                            <FaCheckCircle className="h-4 w-4" /> Settings saved. The Admission page uses them straight away.
                        </p>
                    )}

                    <div className="flex items-center justify-between gap-4 rounded-lg bg-green-50 p-3">
                        <div>
                            <p className="text-sm font-medium text-green-950">Accept applications</p>
                            <p className="text-xs text-gray-600">Turn this off to close admission at once, whatever the dates say.</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={form.enabled}
                            aria-label="Accept applications"
                            onClick={() => {
                                setForm({ ...form, enabled: !form.enabled })
                                setDone(false)
                            }}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form.enabled ? 'bg-green-700' : 'bg-gray-300'}`}
                        >
                            <span
                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${form.enabled ? 'left-[22px]' : 'left-0.5'}`}
                            />
                        </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label htmlFor="intake" className="mb-1 block text-xs font-medium text-gray-600">
                                Intake (academic year)
                            </label>
                            <input id="intake" name="intake" value={form.intake} onChange={change} placeholder="2026/2027" className={cls('intake')} />
                            {errors.intake && <p className="mt-1 text-xs text-red-600">{errors.intake}</p>}
                        </div>
                        <div>
                            <label htmlFor="opensOn" className="mb-1 block text-xs font-medium text-gray-600">
                                Opens on
                            </label>
                            <input id="opensOn" name="opensOn" type="date" value={form.opensOn} onChange={change} className={cls('opensOn')} />
                            {errors.opensOn && <p className="mt-1 text-xs text-red-600">{errors.opensOn}</p>}
                        </div>
                        <div>
                            <label htmlFor="closesOn" className="mb-1 block text-xs font-medium text-gray-600">
                                Closes on (this day is included)
                            </label>
                            <input id="closesOn" name="closesOn" type="date" value={form.closesOn} onChange={change} className={cls('closesOn')} />
                            {errors.closesOn && <p className="mt-1 text-xs text-red-600">{errors.closesOn}</p>}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="fee" className="mb-1 block text-xs font-medium text-gray-600">
                                Application fee (TZS)
                            </label>
                            <input id="fee" name="fee" inputMode="numeric" value={form.fee} onChange={change} className={cls('fee')} />
                            {errors.fee ? (
                                <p className="mt-1 text-xs text-red-600">{errors.fee}</p>
                            ) : (
                                Number(form.fee) > 0 && (
                                    <p className="mt-1 text-xs text-gray-500">Students will see TZS {Number(form.fee).toLocaleString('en-US')}.</p>
                                )
                            )}
                        </div>
                        <div>
                            <label htmlFor="maxCourses" className="mb-1 block text-xs font-medium text-gray-600">
                                Most courses a student can choose
                            </label>
                            <input id="maxCourses" name="maxCourses" inputMode="numeric" value={form.maxCourses} onChange={change} className={cls('maxCourses')} />
                            {errors.maxCourses && <p className="mt-1 text-xs text-red-600">{errors.maxCourses}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void save()}
                            disabled={saving || !dirty}
                            className="rounded-lg bg-amber-400 px-6 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save settings'}
                        </button>
                        {dirty && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (saved) setForm(toForm(saved))
                                    setErrors({})
                                    setServerError('')
                                }}
                                className="text-sm text-gray-600 hover:underline"
                            >
                                Undo changes
                            </button>
                        )}
                    </div>
                </div>
            )}
        </section>
    )
}

/* ============================ Departments ============================ */

const DepartmentsCard = () => {
    const [rows, setRows] = useState<DepartmentRow[] | null>(null)
    const [error, setError] = useState('')
    const [newName, setNewName] = useState('')
    const [adding, setAdding] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')
    const [armedId, setArmedId] = useState<number | null>(null)
    const armTimer = useRef<number | undefined>(undefined)

    const load = useCallback(async () => {
        try {
            setRows(await listDepartmentRows())
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load the departments.'))
        }
    }, [])

    useEffect(() => {
        void load()
        return () => window.clearTimeout(armTimer.current)
    }, [load])

    const add = async () => {
        if (newName.trim().length < 2) {
            setError('Enter the department name (at least 2 characters).')
            return
        }
        setAdding(true)
        setError('')
        try {
            await createDepartment(newName.trim())
            setNewName('')
            await load()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not add the department.'))
        } finally {
            setAdding(false)
        }
    }

    const saveRename = async (id: number) => {
        setError('')
        try {
            await renameDepartment(id, editName.trim())
            setEditId(null)
            await load()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not rename the department.'))
        }
    }

    const remove = async (id: number) => {
        if (armedId !== id) {
            setArmedId(id)
            window.clearTimeout(armTimer.current)
            armTimer.current = window.setTimeout(() => setArmedId(null), 4000)
            return
        }
        setArmedId(null)
        setError('')
        try {
            await removeDepartment(id)
            await load()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the department.'))
        }
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-green-950">Departments</h2>
            <p className="text-xs text-gray-500">Every course, lecturer and employee belongs to a department.</p>

            {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[30rem] text-left text-sm">
                    <thead>
                        <tr className="text-xs text-gray-500">
                            <th className="py-2 font-normal">Name</th>
                            <th className="py-2 font-normal">Courses</th>
                            <th className="py-2 font-normal">Lecturers</th>
                            <th className="py-2 font-normal">Employees</th>
                            <th className="py-2 text-right font-normal">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!rows && !error && (
                            <tr>
                                <td colSpan={5} className="border-t border-gray-100 py-6 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        )}
                        {rows?.map((d) => (
                            <tr key={d.id} className="border-t border-gray-100">
                                <td className="py-2.5">
                                    {editId === d.id ? (
                                        <input
                                            autoFocus
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') void saveRename(d.id)
                                                if (e.key === 'Escape') setEditId(null)
                                            }}
                                            aria-label={`New name for ${d.name}`}
                                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    ) : (
                                        <span className="font-medium text-green-950">{d.name}</span>
                                    )}
                                </td>
                                <td className="py-2.5 text-gray-600">{d.courses}</td>
                                <td className="py-2.5 text-gray-600">{d.lecturers}</td>
                                <td className="py-2.5 text-gray-600">{d.employees}</td>
                                <td className="py-2.5">
                                    <div className="flex justify-end gap-2">
                                        {editId === d.id ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => void saveRename(d.id)}
                                                    className="rounded-md bg-amber-400 px-3 py-1 text-xs font-semibold text-green-950 hover:bg-amber-300"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditId(null)}
                                                    className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditId(d.id)
                                                        setEditName(d.name)
                                                        setError('')
                                                    }}
                                                    className="rounded-md border border-amber-500 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                                                >
                                                    Rename
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void remove(d.id)}
                                                    className={`rounded-md border px-3 py-1 text-xs font-medium ${armedId === d.id ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                                        }`}
                                                >
                                                    {armedId === d.id ? 'Confirm delete' : 'Delete'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                <input
                    value={newName}
                    onChange={(e) => {
                        setNewName(e.target.value)
                        setError('')
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') void add()
                    }}
                    placeholder="New department name"
                    aria-label="New department name"
                    maxLength={80}
                    className="min-w-[14rem] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                    type="button"
                    onClick={() => void add()}
                    disabled={adding}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                >
                    <FaPlus className="h-3 w-3" /> {adding ? 'Adding...' : 'Add department'}
                </button>
            </div>
        </section>
    )
}

/* ============================ Page ============================ */

const SettingsPage = () => (
    <div className="mx-auto max-w-4xl space-y-4">
        <div>
            <h1 className="text-2xl font-bold text-green-950">Settings</h1>
            <p className="text-sm text-gray-500">Admission rules and the departments of the foundation.</p>
        </div>
        <AdmissionCard />
        <DepartmentsCard />
    </div>
)

export default SettingsPage
