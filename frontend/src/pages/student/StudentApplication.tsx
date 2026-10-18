// import { Fragment, useState } from 'react'
// import type { ChangeEvent } from 'react'
// import { Link } from 'react-router-dom'
// import {
//     FaCheck,
//     FaLock,
//     FaCheckCircle,
//     FaClock,
//     FaUpload,
//     FaFile,
//     FaBook,
// } from 'react-icons/fa'
// import { useAuth } from '../../hooks/useAuth'
// import { useApplication } from '../../hooks/useApplication'
// import { APPLICATION_FEE, INTAKE, MAX_COURSES, catalog } from '../../data/courses'
// import { docList, getCurrent, getDone, stageTitles } from '../../data/application'
// import type { DocKey, Personal } from '../../context/application-context'

// const primaryBtn =
//     'rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60'
// const ghostBtn =
//     'rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50'
// const inputCls =
//     'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

// const PanelHead = ({
//     title,
//     subtitle,
//     done,
// }: {
//     title: string
//     subtitle: string
//     done?: boolean
// }) => (
//     <div className="mb-4 flex items-start justify-between gap-3">
//         <div>
//             <h2 className="text-lg font-bold text-green-950">{title}</h2>
//             <p className="text-sm text-gray-500">{subtitle}</p>
//         </div>
//         {done && (
//             <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
//                 <FaCheck className="h-2.5 w-2.5" /> Completed
//             </span>
//         )}
//     </div>
// )

// const KV = ({ label, value }: { label: string; value: string }) => (
//     <div>
//         <p className="text-xs text-gray-500">{label}</p>
//         <p className="text-sm font-medium text-green-950">{value || '-'}</p>
//     </div>
// )

// const Err = ({ text }: { text: string }) =>
//     text ? <p className="mt-2 text-sm text-red-600">{text}</p> : null

// /* ---------- Stage 1: self registration ---------- */

// type PersonalErrors = Partial<Record<keyof Personal, string>>

// const phoneOk = (v: string) => /^[+\d\s-]{9,16}$/.test(v)

// const validatePersonal = (p: Personal): PersonalErrors => {
//     const e: PersonalErrors = {}
//     if (!p.dob) e.dob = 'Enter your date of birth.'
//     else if (new Date(p.dob) > new Date()) e.dob = 'Date of birth cannot be in the future.'
//     if (!p.gender) e.gender = 'Select your gender.'
//     if (p.nationality.trim().length < 3) e.nationality = 'Enter your nationality.'
//     if (!phoneOk(p.phone)) e.phone = 'Enter a valid phone number.'
//     if (p.region.trim().length < 2) e.region = 'Enter your region or city.'
//     if (p.kinName.trim().length < 2) e.kinName = 'Enter the full name.'
//     if (!phoneOk(p.kinPhone)) e.kinPhone = 'Enter a valid phone number.'
//     return e
// }

// const personalFields: {
//     key: keyof Personal
//     label: string
//     type?: string
//     placeholder?: string
// }[] = [
//         { key: 'dob', label: 'Date of birth', type: 'date' },
//         { key: 'gender', label: 'Gender', type: 'select' },
//         { key: 'nationality', label: 'Nationality' },
//         { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+255 ...' },
//         { key: 'region', label: 'Region or city of residence' },
//         { key: 'kinName', label: 'Next of kin (full name)' },
//         { key: 'kinPhone', label: 'Next of kin phone', type: 'tel', placeholder: '+255 ...' },
//     ]

// const PersonalPanel = ({
//     personal,
//     done,
//     locked,
//     name,
//     email,
//     onSave,
// }: {
//     personal: Personal
//     done: boolean
//     locked: boolean
//     name: string
//     email: string
//     onSave: (p: Personal) => void
// }) => {
//     const [editing, setEditing] = useState(false)
//     const [form, setForm] = useState<Personal>(personal)
//     const [errors, setErrors] = useState<PersonalErrors>({})

//     if (done && !editing) {
//         return (
//             <div>
//                 <PanelHead title="Self registration" subtitle="Your personal details" done />
//                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//                     <KV label="Full name" value={name} />
//                     <KV label="Email" value={email} />
//                     <KV label="Date of birth" value={personal.dob} />
//                     <KV label="Gender" value={personal.gender} />
//                     <KV label="Nationality" value={personal.nationality} />
//                     <KV label="Phone" value={personal.phone} />
//                     <KV label="Region" value={personal.region} />
//                     <KV label="Next of kin" value={personal.kinName} />
//                     <KV label="Next of kin phone" value={personal.kinPhone} />
//                 </div>
//                 {!locked && (
//                     <button type="button" onClick={() => setEditing(true)} className={`${ghostBtn} mt-5`}>
//                         Edit details
//                     </button>
//                 )}
//             </div>
//         )
//     }

//     const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//         const { name: key, value } = e.target
//         setForm((prev) => ({ ...prev, [key]: value }))
//         if (errors[key as keyof Personal]) setErrors((prev) => ({ ...prev, [key]: undefined }))
//     }

//     const save = () => {
//         const found = validatePersonal(form)
//         setErrors(found)
//         if (Object.keys(found).length > 0) return
//         onSave(form)
//         setEditing(false)
//     }

//     return (
//         <div>
//             <PanelHead title="Self registration" subtitle="Tell us about yourself" />
//             <div className="mb-4 grid gap-4 rounded-lg bg-green-50 p-3 sm:grid-cols-2">
//                 <KV label="Full name (from your account)" value={name} />
//                 <KV label="Email (from your account)" value={email} />
//             </div>
//             <div className="grid gap-4 sm:grid-cols-2">
//                 {personalFields.map((f) => (
//                     <div key={f.key}>
//                         <label htmlFor={f.key} className="mb-1 block text-xs font-medium text-gray-600">
//                             {f.label}
//                         </label>
//                         {f.type === 'select' ? (
//                             <select
//                                 id={f.key}
//                                 name={f.key}
//                                 value={form[f.key]}
//                                 onChange={change}
//                                 className={`${inputCls} ${errors[f.key] ? 'border-red-400' : 'border-gray-200'}`}
//                             >
//                                 <option value="">Select...</option>
//                                 <option value="Female">Female</option>
//                                 <option value="Male">Male</option>
//                             </select>
//                         ) : (
//                             <input
//                                 id={f.key}
//                                 name={f.key}
//                                 type={f.type ?? 'text'}
//                                 value={form[f.key]}
//                                 onChange={change}
//                                 placeholder={f.placeholder}
//                                 className={`${inputCls} ${errors[f.key] ? 'border-red-400' : 'border-gray-200'}`}
//                             />
//                         )}
//                         {errors[f.key] && <p className="mt-1 text-xs text-red-600">{errors[f.key]}</p>}
//                     </div>
//                 ))}
//             </div>
//             <div className="mt-5 flex gap-3">
//                 <button type="button" onClick={save} className={primaryBtn}>
//                     {done ? 'Save changes' : 'Save and continue'}
//                 </button>
//                 {done && (
//                     <button type="button" onClick={() => setEditing(false)} className={ghostBtn}>
//                         Cancel
//                     </button>
//                 )}
//             </div>
//         </div>
//     )
// }

// /* ---------- Stage 2: payment ---------- */

// const methods = ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Bank or card']

// const PaymentPanel = ({
//     paid,
//     method,
//     onPaid,
// }: {
//     paid: boolean
//     method: string
//     onPaid: (m: string) => void
// }) => {
//     const [choice, setChoice] = useState('')
//     const [error, setError] = useState('')
//     const [loading, setLoading] = useState(false)
//     const amount = `TZS ${APPLICATION_FEE.toLocaleString('en-US')}`

//     if (paid) {
//         return (
//             <div>
//                 <PanelHead title="Payment" subtitle="Application fee received" done />
//                 <div className="grid gap-4 sm:grid-cols-3">
//                     <KV label="Amount" value={amount} />
//                     <KV label="Method" value={method} />
//                     <KV label="Status" value="Paid" />
//                 </div>
//             </div>
//         )
//     }

//     const pay = async () => {
//         if (!choice) {
//             setError('Choose a payment method first.')
//             return
//         }
//         setError('')
//         setLoading(true)
//         // TODO: start a real payment (mobile money or a GePG control number)
//         // and wait for the backend to confirm it before calling onPaid.
//         await new Promise((resolve) => setTimeout(resolve, 1000))
//         setLoading(false)
//         onPaid(choice)
//     }

//     return (
//         <div>
//             <PanelHead
//                 title="Payment"
//                 subtitle="You must pay first. Choosing courses unlocks after payment."
//             />
//             <div className="flex items-center justify-between rounded-xl bg-green-100 px-4 py-3 text-green-900">
//                 <span className="text-sm">Application fee</span>
//                 <span className="text-2xl font-bold">{amount}</span>
//             </div>
//             <p className="mb-2 mt-5 text-xs font-medium text-gray-600">Pay with</p>
//             <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
//                 {methods.map((m) => (
//                     <button
//                         key={m}
//                         type="button"
//                         onClick={() => {
//                             setChoice(m)
//                             setError('')
//                         }}
//                         aria-pressed={choice === m}
//                         className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${choice === m
//                             ? 'border-2 border-green-900 bg-green-50 font-semibold text-green-950'
//                             : 'border-gray-200 bg-white text-green-900 hover:bg-green-50'
//                             }`}
//                     >
//                         {m}
//                     </button>
//                 ))}
//             </div>
//             <Err text={error} />
//             <button type="button" onClick={pay} disabled={loading} className={`${primaryBtn} mt-5`}>
//                 {loading ? 'Processing...' : 'Pay now'}
//             </button>
//         </div>
//     )
// }

// /* ---------- Stage 3: choose courses ---------- */

// const CoursesPanel = ({
//     selected,
//     done,
//     locked,
//     onSave,
// }: {
//     selected: string[]
//     done: boolean
//     locked: boolean
//     onSave: (codes: string[]) => void
// }) => {
//     const [editing, setEditing] = useState(false)
//     const [sel, setSel] = useState<string[]>(selected)
//     const [error, setError] = useState('')

//     if (done && !editing) {
//         return (
//             <div>
//                 <PanelHead title="Choose courses" subtitle="Your selected courses" done />
//                 <ul className="divide-y divide-gray-100">
//                     {catalog
//                         .filter((c) => selected.includes(c.code))
//                         .map((c) => (
//                             <li key={c.code} className="flex items-center gap-3 py-2.5 text-sm text-green-950">
//                                 <FaBook className="h-4 w-4 text-green-700" />
//                                 <span>
//                                     <strong className="font-semibold">{c.code}</strong> {c.title}
//                                 </span>
//                                 <span className="ml-auto text-xs text-gray-500">{c.credits} credits</span>
//                             </li>
//                         ))}
//                 </ul>
//                 {!locked && (
//                     <button
//                         type="button"
//                         onClick={() => {
//                             setSel(selected)
//                             setEditing(true)
//                         }}
//                         className={`${ghostBtn} mt-5`}
//                     >
//                         Change courses
//                     </button>
//                 )}
//             </div>
//         )
//     }

//     const toggle = (code: string) => {
//         setError('')
//         if (sel.includes(code)) {
//             setSel(sel.filter((c) => c !== code))
//         } else if (sel.length >= MAX_COURSES) {
//             setError(`You can choose up to ${MAX_COURSES} courses.`)
//         } else {
//             setSel([...sel, code])
//         }
//     }

//     const save = () => {
//         if (sel.length < 1) {
//             setError('Choose at least one course.')
//             return
//         }
//         onSave(sel)
//         setEditing(false)
//     }

//     return (
//         <div>
//             <PanelHead
//                 title="Choose courses"
//                 subtitle={`Pick the courses you want to learn (up to ${MAX_COURSES}). Selected: ${sel.length} of ${MAX_COURSES}`}
//             />
//             <div className="space-y-2">
//                 {catalog.map((c) => {
//                     const on = sel.includes(c.code)
//                     return (
//                         <button
//                             key={c.code}
//                             type="button"
//                             onClick={() => toggle(c.code)}
//                             aria-pressed={on}
//                             className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm text-green-950 transition-colors ${on ? 'border-2 border-green-900 bg-green-50' : 'border-gray-200 bg-white hover:bg-green-50'
//                                 }`}
//                         >
//                             <span
//                                 className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${on ? 'border-green-900 bg-green-900 text-white' : 'border-gray-300'
//                                     }`}
//                             >
//                                 {on && <FaCheck className="h-2.5 w-2.5" />}
//                             </span>
//                             <span>
//                                 <strong className="font-semibold">{c.code}</strong> {c.title}
//                             </span>
//                             <span className="ml-auto text-xs text-gray-500">{c.credits} credits</span>
//                         </button>
//                     )
//                 })}
//             </div>
//             <Err text={error} />
//             <div className="mt-5 flex gap-3">
//                 <button type="button" onClick={save} className={primaryBtn}>
//                     {done ? 'Save changes' : 'Save courses'}
//                 </button>
//                 {done && (
//                     <button type="button" onClick={() => setEditing(false)} className={ghostBtn}>
//                         Cancel
//                     </button>
//                 )}
//             </div>
//         </div>
//     )
// }

// /* ---------- Stage 4: requirements ---------- */

// const RequirementsPanel = ({
//     docs,
//     done,
//     locked,
//     onUpload,
//     onContinue,
// }: {
//     docs: Record<DocKey, string>
//     done: boolean
//     locked: boolean
//     onUpload: (key: DocKey, fileName: string) => void
//     onContinue: () => void
// }) => {
//     const [error, setError] = useState('')

//     const handleFile = (key: DocKey) => (e: ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0]
//         e.target.value = ''
//         if (!file) return
//         if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
//             setError(`${file.name}: use a PDF, JPG or PNG file.`)
//             return
//         }
//         if (file.size > 5 * 1024 * 1024) {
//             setError(`${file.name} is larger than 5 MB.`)
//             return
//         }
//         setError('')
//         // TODO: upload the file to the backend and keep the returned URL instead of the name.
//         onUpload(key, file.name)
//     }

//     return (
//         <div>
//             <PanelHead
//                 title="Requirements"
//                 subtitle="Upload all documents. PDF, JPG or PNG, up to 5 MB each."
//                 done={done}
//             />
//             <ul className="divide-y divide-gray-100">
//                 {docList.map((d) => {
//                     const file = docs[d.key]
//                     return (
//                         <li key={d.key} className="flex items-center gap-3 py-3 text-sm text-green-950">
//                             <FaFile className="h-4 w-4 shrink-0 text-green-700" />
//                             <div className="min-w-0">
//                                 <p>{d.label}</p>
//                                 {file && <p className="truncate text-xs text-gray-500">{file}</p>}
//                             </div>
//                             {file && (
//                                 <span className="ml-auto shrink-0 rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800">
//                                     Uploaded
//                                 </span>
//                             )}
//                             {!locked && (
//                                 <label
//                                     className={`flex cursor-pointer items-center gap-1.5 rounded-md border border-green-900 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-50 ${file ? '' : 'ml-auto'
//                                         }`}
//                                 >
//                                     <FaUpload className="h-3 w-3" />
//                                     {file ? 'Replace' : 'Upload'}
//                                     <input
//                                         type="file"
//                                         accept=".pdf,.jpg,.jpeg,.png"
//                                         className="hidden"
//                                         onChange={handleFile(d.key)}
//                                     />
//                                 </label>
//                             )}
//                         </li>
//                     )
//                 })}
//             </ul>
//             <Err text={error} />
//             {done && !locked && (
//                 <button type="button" onClick={onContinue} className={`${primaryBtn} mt-5`}>
//                     Continue to submit
//                 </button>
//             )}
//         </div>
//     )
// }

// /* ---------- Stage 5: submit and approval ---------- */

// const TimelineItem = ({
//     state,
//     title,
//     text,
// }: {
//     state: 'done' | 'current' | 'pending'
//     title: string
//     text: string
// }) => (
//     <div className="flex items-start gap-3 py-2.5">
//         <span
//             className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${state === 'done'
//                 ? 'bg-green-900 text-white'
//                 : state === 'current'
//                     ? 'bg-amber-400 text-green-950'
//                     : 'bg-gray-200 text-gray-500'
//                 }`}
//         >
//             {state === 'done' ? <FaCheck /> : state === 'current' ? <FaClock /> : <FaLock />}
//         </span>
//         <div>
//             <p className="text-sm font-semibold text-green-950">{title}</p>
//             <p className="text-xs text-gray-500">{text}</p>
//         </div>
//     </div>
// )

// const SubmitPanel = ({
//     submitted,
//     approved,
//     onSubmit,
//     onApprove,
// }: {
//     submitted: boolean
//     approved: boolean
//     onSubmit: () => void
//     onApprove: () => void
// }) => {
//     if (submitted) {
//         return (
//             <div>
//                 <PanelHead
//                     title="Submit and approval"
//                     subtitle={
//                         approved
//                             ? 'Your application has been approved'
//                             : 'Your application is with the admissions office'
//                     }
//                 />
//                 <TimelineItem state="done" title="Application submitted" text="All stages are complete." />
//                 <TimelineItem
//                     state={approved ? 'done' : 'current'}
//                     title={approved ? 'Reviewed and approved' : 'Under review'}
//                     text={approved ? 'Welcome to UHWF.' : 'Waiting for approval from the administrator.'}
//                 />
//                 <TimelineItem
//                     state={approved ? 'done' : 'pending'}
//                     title="Full dashboard"
//                     text={
//                         approved
//                             ? 'Your courses, timetable and results are now unlocked.'
//                             : 'Unlocks once your application is approved.'
//                     }
//                 />
//                 {approved ? (
//                     <Link to="/student" className={`${primaryBtn} mt-4 inline-block`}>
//                         Go to my dashboard
//                     </Link>
//                 ) : (
//                     import.meta.env.DEV && (
//                         <button type="button" onClick={onApprove} className={`${ghostBtn} mt-4`}>
//                             Demo only: simulate admin approval
//                         </button>
//                     )
//                 )}
//             </div>
//         )
//     }

//     return (
//         <div>
//             <PanelHead
//                 title="Submit and approval"
//                 subtitle="Review everything, then submit. An administrator will approve your application."
//             />
//             <ul className="divide-y divide-gray-100">
//                 {stageTitles.slice(0, 4).map((t) => (
//                     <li key={t} className="flex items-center gap-3 py-2.5 text-sm text-green-950">
//                         <FaCheckCircle className="h-4 w-4 text-green-600" />
//                         {t}
//                         <span className="ml-auto rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800">
//                             Done
//                         </span>
//                     </li>
//                 ))}
//             </ul>
//             <p className="mt-4 text-xs text-gray-500">
//                 After you submit you can no longer change your answers.
//             </p>
//             <button type="button" onClick={onSubmit} className={`${primaryBtn} mt-4`}>
//                 Submit application
//             </button>
//         </div>
//     )
// }

// /* ---------- Page ---------- */

// const StudentApplication = () => {
//     const { user } = useAuth()
//     const { app, update } = useApplication()
//     const done = getDone(app)
//     const current = getCurrent(done)
//     const [view, setView] = useState(Math.min(current, 4))

//     const unlocked = (i: number) => done.slice(0, i).every(Boolean)
//     const completed = done.filter(Boolean).length

//     const pill = app.approved
//         ? { text: 'Approved', cls: 'bg-green-100 text-green-800' }
//         : app.submitted
//             ? { text: 'Waiting for approval', cls: 'bg-amber-100 text-amber-900' }
//             : { text: `Stage ${Math.min(current + 1, 5)} of 5`, cls: 'bg-green-100 text-green-800' }

//     // Once submitted, earlier stages become read-only
//     const readOnly = app.submitted

//     const renderPanel = () => {
//         if (!unlocked(view)) {
//             return (
//                 <div className="py-8 text-center">
//                     <FaLock className="mx-auto h-8 w-8 text-gray-400" />
//                     <p className="mt-3 font-semibold text-green-950">This stage is locked</p>
//                     <p className="mt-1 text-sm text-gray-500">
//                         Complete "{stageTitles[current]}" first.
//                     </p>
//                 </div>
//             )
//         }

//         switch (view) {
//             case 0:
//                 return (
//                     <PersonalPanel
//                         personal={app.personal}
//                         done={done[0]}
//                         locked={readOnly}
//                         name={user?.name ?? ''}
//                         email={user?.email ?? ''}
//                         onSave={(p) => {
//                             const wasDone = done[0]
//                             update({ personal: p })
//                             if (!wasDone) setView(1)
//                         }}
//                     />
//                 )
//             case 1:
//                 return (
//                     <PaymentPanel
//                         paid={app.paid}
//                         method={app.method}
//                         onPaid={(m) => {
//                             update({ paid: true, method: m })
//                             setView(2)
//                         }}
//                     />
//                 )
//             case 2:
//                 return (
//                     <CoursesPanel
//                         selected={app.courses}
//                         done={done[2]}
//                         locked={readOnly}
//                         onSave={(codes) => {
//                             const wasDone = done[2]
//                             update({ courses: codes })
//                             if (!wasDone) setView(3)
//                         }}
//                     />
//                 )
//             case 3:
//                 return (
//                     <RequirementsPanel
//                         docs={app.docs}
//                         done={done[3]}
//                         locked={readOnly}
//                         onUpload={(key, name) => update({ docs: { ...app.docs, [key]: name } })}
//                         onContinue={() => setView(4)}
//                     />
//                 )
//             default:
//                 return (
//                     <SubmitPanel
//                         submitted={app.submitted}
//                         approved={app.approved}
//                         onSubmit={() => update({ submitted: true })}
//                         onApprove={() => update({ approved: true })}
//                     />
//                 )
//         }
//     }

//     return (
//         <div className="mx-auto max-w-4xl space-y-4">
//             {/* Progress + stepper */}
//             <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                 <div className="flex flex-wrap items-center justify-between gap-2">
//                     <div>
//                         <h1 className="text-lg font-bold text-green-950">Admission {INTAKE}</h1>
//                         <p className="text-sm text-gray-500">{completed} of 5 stages completed</p>
//                     </div>
//                     <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill.cls}`}>
//                         {pill.text}
//                     </span>
//                 </div>

//                 <div className="mb-5 mt-3 h-1.5 rounded bg-gray-100">
//                     <div
//                         className="h-1.5 rounded bg-green-900 transition-all"
//                         style={{ width: `${(completed / 5) * 100}%` }}
//                     />
//                 </div>

//                 <div className="overflow-x-auto">
//                     <div className="flex min-w-[34rem] items-start">
//                         {stageTitles.map((title, i) => {
//                             const state = done[i] ? 'done' : i === current ? 'current' : 'locked'
//                             return (
//                                 <Fragment key={title}>
//                                     <button
//                                         type="button"
//                                         onClick={() => setView(i)}
//                                         aria-current={view === i ? 'step' : undefined}
//                                         className="flex w-20 shrink-0 flex-col items-center gap-1.5"
//                                     >
//                                         <span
//                                             className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${state === 'done'
//                                                 ? 'bg-green-900 text-white'
//                                                 : state === 'current'
//                                                     ? 'bg-amber-400 text-green-950'
//                                                     : 'bg-gray-200 text-gray-500'
//                                                 } ${view === i ? 'ring-4 ring-green-200' : ''}`}
//                                         >
//                                             {state === 'done' ? <FaCheck /> : state === 'locked' ? <FaLock className="h-3 w-3" /> : i + 1}
//                                         </span>
//                                         <span
//                                             className={`text-center text-xs leading-tight ${view === i ? 'font-semibold text-green-950' : 'text-gray-500'
//                                                 }`}
//                                         >
//                                             {title}
//                                         </span>
//                                     </button>
//                                     {i < stageTitles.length - 1 && (
//                                         <span
//                                             className={`mt-[15px] h-0.5 min-w-[0.5rem] flex-1 ${done[i] ? 'bg-green-900' : 'bg-gray-200'
//                                                 }`}
//                                         />
//                                     )}
//                                 </Fragment>
//                             )
//                         })}
//                     </div>
//                 </div>
//             </section>

//             {/* Current stage */}
//             <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                 {renderPanel()}
//             </section>
//         </div>
//     )
// }

// export default StudentApplication
import { Fragment, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
    FaCheck,
    FaLock,
    FaCheckCircle,
    FaClock,
    FaUpload,
    FaFile,
    FaBook,
    FaTimesCircle,
} from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { useApplication } from '../../hooks/useApplication'
import { getErrorMessage, getFieldErrors } from '../../services/api'
import LoadState from '../../components/LoadState'
import { docList, getCurrent, getDone, stageTitles } from '../../data/application'
import type { ApplicationData, DocKey, Personal } from '../../context/application-context'

const primaryBtn =
    'rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60'
const ghostBtn =
    'rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50'
const inputCls =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const PanelHead = ({ title, subtitle, done }: { title: string; subtitle: string; done?: boolean }) => (
    <div className="mb-4 flex items-start justify-between gap-3">
        <div>
            <h2 className="text-lg font-bold text-green-950">{title}</h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        {done && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                <FaCheck className="h-2.5 w-2.5" /> Completed
            </span>
        )}
    </div>
)

const KV = ({ label, value }: { label: string; value: string }) => (
    <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-green-950">{value || '-'}</p>
    </div>
)

const Err = ({ text }: { text: string }) =>
    text ? (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {text}
        </p>
    ) : null

const money = (n: number) => `TZS ${n.toLocaleString('en-US')}`

/* ---------- Stage 1: self registration ---------- */

type PersonalErrors = Partial<Record<keyof Personal, string>>
const phoneOk = (v: string) => /^[+\d\s-]{9,16}$/.test(v)

const validatePersonal = (p: Personal): PersonalErrors => {
    const e: PersonalErrors = {}
    if (!p.dob) e.dob = 'Enter your date of birth.'
    else if (new Date(p.dob) > new Date()) e.dob = 'Date of birth cannot be in the future.'
    if (!p.gender) e.gender = 'Select your gender.'
    if (p.nationality.trim().length < 3) e.nationality = 'Enter your nationality.'
    if (!phoneOk(p.phone)) e.phone = 'Enter a valid phone number.'
    if (p.region.trim().length < 2) e.region = 'Enter your region or city.'
    if (p.kinName.trim().length < 2) e.kinName = 'Enter the full name.'
    if (!phoneOk(p.kinPhone)) e.kinPhone = 'Enter a valid phone number.'
    return e
}

const personalFields: { key: keyof Personal; label: string; type?: string; placeholder?: string }[] = [
    { key: 'dob', label: 'Date of birth', type: 'date' },
    { key: 'gender', label: 'Gender', type: 'select' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+255 ...' },
    { key: 'region', label: 'Region or city of residence' },
    { key: 'kinName', label: 'Next of kin (full name)' },
    { key: 'kinPhone', label: 'Next of kin phone', type: 'tel', placeholder: '+255 ...' },
]

const PersonalPanel = ({
    personal,
    done,
    locked,
    name,
    email,
    onSave,
}: {
    personal: Personal
    done: boolean
    locked: boolean
    name: string
    email: string
    onSave: (p: Personal) => Promise<void>
}) => {
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState<Personal>({ ...personal, nationality: personal.nationality || 'Tanzanian' })
    const [errors, setErrors] = useState<PersonalErrors>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)

    if (done && !editing) {
        return (
            <div>
                <PanelHead title="Self registration" subtitle="Your personal details" done />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <KV label="Full name" value={name} />
                    <KV label="Email" value={email} />
                    <KV label="Date of birth" value={personal.dob} />
                    <KV label="Gender" value={personal.gender} />
                    <KV label="Nationality" value={personal.nationality} />
                    <KV label="Phone" value={personal.phone} />
                    <KV label="Region" value={personal.region} />
                    <KV label="Next of kin" value={personal.kinName} />
                    <KV label="Next of kin phone" value={personal.kinPhone} />
                </div>
                {!locked && (
                    <button type="button" onClick={() => setEditing(true)} className={`${ghostBtn} mt-5`}>
                        Edit details
                    </button>
                )}
            </div>
        )
    }

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name: key, value } = e.target
        setForm((prev) => ({ ...prev, [key]: value }))
        if (errors[key as keyof Personal]) setErrors((prev) => ({ ...prev, [key]: undefined }))
        setServerError('')
    }

    const save = async () => {
        const found = validatePersonal(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return
        setSaving(true)
        setServerError('')
        try {
            await onSave({
                ...form,
                nationality: form.nationality.trim(),
                region: form.region.trim(),
                kinName: form.kinName.trim(),
                phone: form.phone.trim(),
                kinPhone: form.kinPhone.trim(),
            })
            setEditing(false)
        } catch (err) {
            setErrors(getFieldErrors(err) as PersonalErrors)
            setServerError(getErrorMessage(err, 'Could not save your details.'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <PanelHead title="Self registration" subtitle="Tell us about yourself" />
            <div className="mb-4 grid gap-4 rounded-lg bg-green-50 p-3 sm:grid-cols-2">
                <KV label="Full name (from your account)" value={name} />
                <KV label="Email (from your account)" value={email} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                {personalFields.map((f) => (
                    <div key={f.key}>
                        <label htmlFor={f.key} className="mb-1 block text-xs font-medium text-gray-600">
                            {f.label}
                        </label>
                        {f.type === 'select' ? (
                            <select
                                id={f.key}
                                name={f.key}
                                value={form[f.key]}
                                onChange={change}
                                className={`${inputCls} ${errors[f.key] ? 'border-red-400' : 'border-gray-200'}`}
                            >
                                <option value="">Select...</option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                            </select>
                        ) : (
                            <input
                                id={f.key}
                                name={f.key}
                                type={f.type ?? 'text'}
                                value={form[f.key]}
                                onChange={change}
                                placeholder={f.placeholder}
                                className={`${inputCls} ${errors[f.key] ? 'border-red-400' : 'border-gray-200'}`}
                            />
                        )}
                        {errors[f.key] && <p className="mt-1 text-xs text-red-600">{errors[f.key]}</p>}
                    </div>
                ))}
            </div>
            <Err text={serverError} />
            <div className="mt-5 flex gap-3">
                <button type="button" onClick={save} disabled={saving} className={primaryBtn}>
                    {saving ? 'Saving...' : done ? 'Save changes' : 'Save and continue'}
                </button>
                {done && (
                    <button type="button" onClick={() => setEditing(false)} className={ghostBtn}>
                        Cancel
                    </button>
                )}
            </div>
        </div>
    )
}

/* ---------- Stage 2: payment ---------- */

const methods = ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Bank or card']

const PaymentPanel = ({
    app,
    onPay,
    onRefresh,
    onContinue,
}: {
    app: ApplicationData
    onPay: (method: string) => Promise<void>
    onRefresh: () => Promise<void>
    onContinue: (() => void) | null
}) => {
    const [choice, setChoice] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const { payment } = app
    const amount = money(payment.amount)

    if (payment.status === 'paid') {
        return (
            <div>
                <PanelHead title="Payment" subtitle="Application fee received" done />
                <div className="grid gap-4 sm:grid-cols-3">
                    <KV label="Amount" value={amount} />
                    <KV label="Method" value={payment.method} />
                    <KV label="Reference" value={payment.reference ?? ''} />
                </div>
                {onContinue && (
                    <button type="button" onClick={onContinue} className={`${primaryBtn} mt-5`}>
                        Continue to courses
                    </button>
                )}
            </div>
        )
    }

    if (payment.status === 'pending') {
        const refresh = async () => {
            setBusy(true)
            setError('')
            try {
                await onRefresh()
            } catch (err) {
                setError(getErrorMessage(err, 'Could not check your payment.'))
            } finally {
                setBusy(false)
            }
        }
        return (
            <div>
                <PanelHead title="Payment" subtitle="Waiting for the administrator to confirm your payment" />
                <div className="rounded-xl bg-amber-50 p-4 text-amber-900">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                        <FaClock className="h-4 w-4" /> Payment pending
                    </p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-3">
                        <KV label="Amount" value={amount} />
                        <KV label="Method" value={payment.method} />
                        <KV label="Reference" value={payment.reference ?? ''} />
                    </div>
                    <p className="mt-3 text-sm">
                        Use this reference when you pay. Once the administrator confirms it, the next stage unlocks.
                    </p>
                </div>
                <Err text={error} />
                <button type="button" onClick={refresh} disabled={busy} className={`${ghostBtn} mt-4`}>
                    {busy ? 'Checking...' : 'Check again'}
                </button>
            </div>
        )
    }

    const pay = async () => {
        if (!choice) {
            setError('Choose a payment method first.')
            return
        }
        setBusy(true)
        setError('')
        try {
            await onPay(choice)
        } catch (err) {
            setError(getErrorMessage(err, 'Could not start the payment.'))
        } finally {
            setBusy(false)
        }
    }

    return (
        <div>
            <PanelHead title="Payment" subtitle="You must pay first. Choosing courses unlocks after payment." />
            <div className="flex items-center justify-between rounded-xl bg-green-100 px-4 py-3 text-green-900">
                <span className="text-sm">Application fee</span>
                <span className="text-2xl font-bold">{amount}</span>
            </div>
            <p className="mb-2 mt-5 text-xs font-medium text-gray-600">Pay with</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {methods.map((m) => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => {
                            setChoice(m)
                            setError('')
                        }}
                        aria-pressed={choice === m}
                        className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${choice === m
                            ? 'border-2 border-green-900 bg-green-50 font-semibold text-green-950'
                            : 'border-gray-200 bg-white text-green-900 hover:bg-green-50'
                            }`}
                    >
                        {m}
                    </button>
                ))}
            </div>
            <Err text={error} />
            <button type="button" onClick={pay} disabled={busy} className={`${primaryBtn} mt-5`}>
                {busy ? 'Processing...' : 'Pay now'}
            </button>
        </div>
    )
}

/* ---------- Stage 3: choose courses ---------- */

const CoursesPanel = ({
    app,
    done,
    locked,
    onSave,
}: {
    app: ApplicationData
    done: boolean
    locked: boolean
    onSave: (codes: string[]) => Promise<void>
}) => {
    const [editing, setEditing] = useState(false)
    const [sel, setSel] = useState<string[]>(app.courses)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const max = app.maxCourses

    if (done && !editing) {
        return (
            <div>
                <PanelHead title="Choose courses" subtitle="Your selected courses" done />
                <ul className="divide-y divide-gray-100">
                    {app.catalog
                        .filter((c) => app.courses.includes(c.code))
                        .map((c) => (
                            <li key={c.code} className="flex items-center gap-3 py-2.5 text-sm text-green-950">
                                <FaBook className="h-4 w-4 text-green-700" />
                                <span>
                                    <strong className="font-semibold">{c.code}</strong> {c.title}
                                </span>
                                <span className="ml-auto text-xs text-gray-500">{c.credits} credits</span>
                            </li>
                        ))}
                </ul>
                {!locked && (
                    <button
                        type="button"
                        onClick={() => {
                            setSel(app.courses)
                            setEditing(true)
                        }}
                        className={`${ghostBtn} mt-5`}
                    >
                        Change courses
                    </button>
                )}
            </div>
        )
    }

    const toggle = (code: string) => {
        setError('')
        if (sel.includes(code)) setSel(sel.filter((c) => c !== code))
        else if (sel.length >= max) setError(`You can choose up to ${max} courses.`)
        else setSel([...sel, code])
    }

    const save = async () => {
        if (sel.length < 1) {
            setError('Choose at least one course.')
            return
        }
        setSaving(true)
        setError('')
        try {
            await onSave(sel)
            setEditing(false)
        } catch (err) {
            setError(getErrorMessage(err, 'Could not save your courses.'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <PanelHead
                title="Choose courses"
                subtitle={`Pick the courses you want to learn (up to ${max}). Selected: ${sel.length} of ${max}`}
            />
            <div className="space-y-2">
                {app.catalog.map((c) => {
                    const on = sel.includes(c.code)
                    return (
                        <button
                            key={c.code}
                            type="button"
                            onClick={() => toggle(c.code)}
                            aria-pressed={on}
                            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm text-green-950 transition-colors ${on ? 'border-2 border-green-900 bg-green-50' : 'border-gray-200 bg-white hover:bg-green-50'
                                }`}
                        >
                            <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${on ? 'border-green-900 bg-green-900 text-white' : 'border-gray-300'
                                    }`}
                            >
                                {on && <FaCheck className="h-2.5 w-2.5" />}
                            </span>
                            <span>
                                <strong className="font-semibold">{c.code}</strong> {c.title}
                            </span>
                            <span className="ml-auto text-xs text-gray-500">{c.credits} credits</span>
                        </button>
                    )
                })}
                {app.catalog.length === 0 && <p className="text-sm text-gray-500">No courses are open for selection yet.</p>}
            </div>
            <Err text={error} />
            <div className="mt-5 flex gap-3">
                <button type="button" onClick={save} disabled={saving} className={primaryBtn}>
                    {saving ? 'Saving...' : done ? 'Save changes' : 'Save courses'}
                </button>
                {done && (
                    <button type="button" onClick={() => setEditing(false)} className={ghostBtn}>
                        Cancel
                    </button>
                )}
            </div>
        </div>
    )
}

/* ---------- Stage 4: requirements ---------- */

const RequirementsPanel = ({
    app,
    done,
    locked,
    onUpload,
    onContinue,
}: {
    app: ApplicationData
    done: boolean
    locked: boolean
    onUpload: (key: DocKey, file: File) => Promise<void>
    onContinue: () => void
}) => {
    const [error, setError] = useState('')
    const [uploading, setUploading] = useState<DocKey | null>(null)

    const handleFile = (key: DocKey) => async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        // Quick checks here. The server checks the real file contents again.
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
            setError(`${file.name}: use a PDF, JPG or PNG file.`)
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setError(`${file.name} is larger than 5 MB.`)
            return
        }
        setError('')
        setUploading(key)
        try {
            await onUpload(key, file)
        } catch (err) {
            setError(getErrorMessage(err, 'Could not upload the file.'))
        } finally {
            setUploading(null)
        }
    }

    return (
        <div>
            <PanelHead
                title="Requirements"
                subtitle="Upload all documents. PDF, JPG or PNG, up to 5 MB each."
                done={done}
            />
            <ul className="divide-y divide-gray-100">
                {docList.map((d) => {
                    const file = app.documents[d.key]
                    return (
                        <li key={d.key} className="flex items-center gap-3 py-3 text-sm text-green-950">
                            <FaFile className="h-4 w-4 shrink-0 text-green-700" />
                            <div className="min-w-0">
                                <p>{d.label}</p>
                                {file && <p className="truncate text-xs text-gray-500">{file}</p>}
                            </div>
                            {file && (
                                <span className="ml-auto shrink-0 rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800">
                                    Uploaded
                                </span>
                            )}
                            {!locked && (
                                <label
                                    className={`flex cursor-pointer items-center gap-1.5 rounded-md border border-green-900 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-50 ${file ? '' : 'ml-auto'
                                        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                                >
                                    <FaUpload className="h-3 w-3" />
                                    {uploading === d.key ? 'Uploading...' : file ? 'Replace' : 'Upload'}
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="hidden"
                                        disabled={uploading !== null}
                                        onChange={handleFile(d.key)}
                                    />
                                </label>
                            )}
                        </li>
                    )
                })}
            </ul>
            <Err text={error} />
            {done && !locked && (
                <button type="button" onClick={onContinue} className={`${primaryBtn} mt-5`}>
                    Continue to submit
                </button>
            )}
        </div>
    )
}

/* ---------- Stage 5: submit and approval ---------- */

type TlState = 'done' | 'current' | 'pending' | 'rejected'

const TimelineItem = ({ state, title, text }: { state: TlState; title: string; text: string }) => (
    <div className="flex items-start gap-3 py-2.5">
        <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${state === 'done'
                ? 'bg-green-900 text-white'
                : state === 'current'
                    ? 'bg-amber-400 text-green-950'
                    : state === 'rejected'
                        ? 'bg-red-700 text-white'
                        : 'bg-gray-200 text-gray-500'
                }`}
        >
            {state === 'done' ? <FaCheck /> : state === 'current' ? <FaClock /> : state === 'rejected' ? <FaTimesCircle /> : <FaLock />}
        </span>
        <div>
            <p className="text-sm font-semibold text-green-950">{title}</p>
            <p className="text-xs text-gray-500">{text}</p>
        </div>
    </div>
)

const SubmitPanel = ({ app, onSubmit }: { app: ApplicationData; onSubmit: () => Promise<void> }) => {
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    if (app.status !== 'draft') {
        const approved = app.status === 'approved'
        const rejected = app.status === 'rejected'
        return (
            <div>
                <PanelHead
                    title="Submit and approval"
                    subtitle={
                        approved
                            ? 'Your application has been approved'
                            : rejected
                                ? 'Your application was not approved'
                                : 'Your application is with the admissions office'
                    }
                />
                <TimelineItem state="done" title="Application submitted" text="All stages are complete." />
                <TimelineItem
                    state={approved ? 'done' : rejected ? 'rejected' : 'current'}
                    title={approved ? 'Reviewed and approved' : rejected ? 'Not approved' : 'Under review'}
                    text={
                        approved
                            ? 'Welcome to UHWF.'
                            : rejected
                                ? (app.reviewNote ?? 'Please contact the administrator.')
                                : 'Waiting for approval from the administrator.'
                    }
                />
                {!rejected && (
                    <TimelineItem
                        state={approved ? 'done' : 'pending'}
                        title="Full dashboard"
                        text={
                            approved
                                ? 'Your courses, timetable and results are now unlocked.'
                                : 'Unlocks once your application is approved.'
                        }
                    />
                )}
                {approved && (
                    <Link to="/student" className={`${primaryBtn} mt-4 inline-block`}>
                        Go to my dashboard
                    </Link>
                )}
                {rejected && (
                    <p className="mt-3 text-sm text-gray-600">
                        If you think this is a mistake, contact the administrator at{' '}
                        <a href="mailto:info@uhwf.or.tz" className="font-medium text-green-800 hover:underline">
                            info@uhwf.or.tz
                        </a>
                        .
                    </p>
                )}
            </div>
        )
    }

    const submit = async () => {
        setBusy(true)
        setError('')
        try {
            await onSubmit()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not submit your application.'))
        } finally {
            setBusy(false)
        }
    }

    return (
        <div>
            <PanelHead
                title="Submit and approval"
                subtitle="Review everything, then submit. An administrator will approve your application."
            />
            <ul className="divide-y divide-gray-100">
                {stageTitles.slice(0, 4).map((t) => (
                    <li key={t} className="flex items-center gap-3 py-2.5 text-sm text-green-950">
                        <FaCheckCircle className="h-4 w-4 text-green-600" />
                        {t}
                        <span className="ml-auto rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800">
                            Done
                        </span>
                    </li>
                ))}
            </ul>
            <p className="mt-4 text-xs text-gray-500">After you submit you can no longer change your answers.</p>
            <Err text={error} />
            <button type="button" onClick={submit} disabled={busy} className={`${primaryBtn} mt-4`}>
                {busy ? 'Submitting...' : 'Submit application'}
            </button>
        </div>
    )
}

/* ---------- Page ---------- */

const ApplicationView = ({ app }: { app: ApplicationData }) => {
    const { user } = useAuth()
    const { reload, savePersonal, pay, saveCourses, uploadDocument, submit } = useApplication()
    const done = getDone(app)
    const current = getCurrent(done)
    const [view, setView] = useState(Math.min(current, 4))

    const unlocked = (i: number) => done.slice(0, i).every(Boolean)
    const completed = done.filter(Boolean).length
    const readOnly = app.status !== 'draft'

    const pill =
        app.status === 'approved'
            ? { text: 'Approved', cls: 'bg-green-100 text-green-800' }
            : app.status === 'rejected'
                ? { text: 'Not approved', cls: 'bg-red-100 text-red-800' }
                : app.status === 'submitted'
                    ? { text: 'Waiting for approval', cls: 'bg-amber-100 text-amber-900' }
                    : { text: `Stage ${Math.min(current + 1, 5)} of 5`, cls: 'bg-green-100 text-green-800' }

    const renderPanel = () => {
        if (!unlocked(view)) {
            return (
                <div className="py-8 text-center">
                    <FaLock className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-3 font-semibold text-green-950">This stage is locked</p>
                    <p className="mt-1 text-sm text-gray-500">Complete "{stageTitles[current]}" first.</p>
                </div>
            )
        }

        switch (view) {
            case 0:
                return (
                    <PersonalPanel
                        personal={app.personal}
                        done={done[0]}
                        locked={readOnly}
                        name={user?.name ?? ''}
                        email={user?.email ?? ''}
                        onSave={async (p) => {
                            const wasDone = done[0]
                            await savePersonal(p)
                            if (!wasDone) setView(1)
                        }}
                    />
                )
            case 1:
                return (
                    <PaymentPanel
                        app={app}
                        onPay={async (m) => {
                            const next = await pay(m)
                            if (next.payment.status === 'paid') setView(2)
                        }}
                        onRefresh={reload}
                        onContinue={!readOnly && !done[2] ? () => setView(2) : null}
                    />
                )
            case 2:
                return (
                    <CoursesPanel
                        app={app}
                        done={done[2]}
                        locked={readOnly}
                        onSave={async (codes) => {
                            const wasDone = done[2]
                            await saveCourses(codes)
                            if (!wasDone) setView(3)
                        }}
                    />
                )
            case 3:
                return (
                    <RequirementsPanel
                        app={app}
                        done={done[3]}
                        locked={readOnly}
                        onUpload={async (key, file) => {
                            await uploadDocument(key, file)
                        }}
                        onContinue={() => setView(4)}
                    />
                )
            default:
                return (
                    <SubmitPanel
                        app={app}
                        onSubmit={async () => {
                            await submit()
                        }}
                    />
                )
        }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-4">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-bold text-green-950">Admission {app.intake}</h1>
                        <p className="text-sm text-gray-500">{completed} of 5 stages completed</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill.cls}`}>{pill.text}</span>
                </div>

                <div className="mb-5 mt-3 h-1.5 rounded bg-gray-100">
                    <div className="h-1.5 rounded bg-green-900 transition-all" style={{ width: `${(completed / 5) * 100}%` }} />
                </div>

                <div className="overflow-x-auto">
                    <div className="flex min-w-[34rem] items-start">
                        {stageTitles.map((title, i) => {
                            const state = done[i] ? 'done' : i === current ? 'current' : 'locked'
                            return (
                                <Fragment key={title}>
                                    <button
                                        type="button"
                                        onClick={() => setView(i)}
                                        aria-current={view === i ? 'step' : undefined}
                                        className="flex w-20 shrink-0 flex-col items-center gap-1.5"
                                    >
                                        <span
                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${state === 'done'
                                                ? 'bg-green-900 text-white'
                                                : state === 'current'
                                                    ? 'bg-amber-400 text-green-950'
                                                    : 'bg-gray-200 text-gray-500'
                                                } ${view === i ? 'ring-4 ring-green-200' : ''}`}
                                        >
                                            {state === 'done' ? <FaCheck /> : state === 'locked' ? <FaLock className="h-3 w-3" /> : i + 1}
                                        </span>
                                        <span
                                            className={`text-center text-xs leading-tight ${view === i ? 'font-semibold text-green-950' : 'text-gray-500'
                                                }`}
                                        >
                                            {title}
                                        </span>
                                    </button>
                                    {i < stageTitles.length - 1 && (
                                        <span
                                            className={`mt-[15px] h-0.5 min-w-[0.5rem] flex-1 ${done[i] ? 'bg-green-900' : 'bg-gray-200'}`}
                                        />
                                    )}
                                </Fragment>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">{renderPanel()}</section>
        </div>
    )
}

const StudentApplication = () => {
    const { app, loading, error, reload } = useApplication()
    if (!app) return <LoadState loading={loading} error={error} onRetry={reload} />
    return <ApplicationView app={app} />
}

export default StudentApplication
