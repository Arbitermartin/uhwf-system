// // import { useEffect, useState } from 'react'
// // import type { ChangeEvent } from 'react'
// // import { FaCheckCircle, FaCopy, FaEye, FaEyeSlash, FaMagic } from 'react-icons/fa'
// // import { getErrorMessage, getFieldErrors } from '../../../services/api'
// // import { createUser, listDepartments } from '../../../services/users'
// // import type { CreatableRole, Department, UserCreate, UserDetail } from '../../../services/users'
// // import ModalShell from './ModalShell'
// // import { roleLabel } from './userLabels'

// // type Form = {
// //     role: CreatableRole
// //     fullName: string
// //     email: string
// //     phone: string
// //     gender: '' | 'female' | 'male'
// //     password: string
// //     staffId: string
// //     departmentId: string
// //     qualification: string
// //     position: string
// // }

// // type Errors = Partial<Record<keyof Form, string>>

// // const roleOptions: { value: CreatableRole; label: string }[] = [
// //     { value: 'lecturer', label: roleLabel.lecturer },
// //     { value: 'employee', label: roleLabel.employee },
// //     { value: 'ict', label: 'ICT officer' },
// //     { value: 'admin', label: roleLabel.admin },
// // ]

// // const inputBase =
// //     'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

// // // Unbiased random number below max, using the browser's secure random generator
// // const randomInt = (max: number) => {
// //     const buf = new Uint32Array(1)
// //     const limit = Math.floor(0x100000000 / max) * max
// //     let x: number
// //     do {
// //         crypto.getRandomValues(buf)
// //         x = buf[0]
// //     } while (x >= limit)
// //     return x % max
// // }

// // // 12 characters with upper case, lower case and digits. Look-alike characters (0 O 1 l I) are left out.
// // const generatePassword = () => {
// //     const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
// //     const lower = 'abcdefghijkmnopqrstuvwxyz'
// //     const digits = '23456789'
// //     const all = upper + lower + digits
// //     const pick = (set: string) => set[randomInt(set.length)]
// //     const chars = [pick(upper), pick(lower), pick(digits)]
// //     while (chars.length < 12) chars.push(pick(all))
// //     for (let i = chars.length - 1; i > 0; i--) {
// //         const j = randomInt(i + 1)
// //             ;[chars[i], chars[j]] = [chars[j], chars[i]]
// //     }
// //     return chars.join('')
// // }

// // const validate = (f: Form): Errors => {
// //     const e: Errors = {}
// //     if (f.fullName.trim().length < 2) e.fullName = 'Enter the full name.'
// //     if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address.'
// //     if (f.phone.trim() && !/^[+\d\s-]{9,16}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.'
// //     if (f.password.length < 8) e.password = 'Use at least 8 characters.'
// //     else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Use letters and numbers.'
// //     if (f.role === 'lecturer' || f.role === 'employee') {
// //         if (f.staffId.trim().length < 3) e.staffId = 'Staff ID is too short.'
// //         if (!f.departmentId) e.departmentId = 'Choose a department.'
// //     }
// //     if (f.role === 'employee' && f.position.trim().length < 2) e.position = 'Position is too short.'
// //     return e
// // }

// // const AddUserModal = ({
// //     defaultRole,
// //     onClose,
// //     onCreated,
// // }: {
// //     defaultRole?: CreatableRole
// //     onClose: () => void
// //     onCreated: (user: UserDetail) => void
// // }) => {
// //     const [form, setForm] = useState<Form>({
// //         role: defaultRole ?? 'lecturer',
// //         fullName: '',
// //         email: '',
// //         phone: '',
// //         gender: '',
// //         password: generatePassword(),
// //         staffId: '',
// //         departmentId: '',
// //         qualification: '',
// //         position: '',
// //     })
// //     const [errors, setErrors] = useState<Errors>({})
// //     const [departments, setDepartments] = useState<Department[]>([])
// //     const [departmentsError, setDepartmentsError] = useState('')
// //     const [showPassword, setShowPassword] = useState(true)
// //     const [saving, setSaving] = useState(false)
// //     const [serverError, setServerError] = useState('')
// //     const [created, setCreated] = useState<{ user: UserDetail; password: string } | null>(null)
// //     const [copyNote, setCopyNote] = useState('')

// //     useEffect(() => {
// //         let cancelled = false
// //         listDepartments()
// //             .then((d) => {
// //                 if (!cancelled) setDepartments(d)
// //             })
// //             .catch((err) => {
// //                 if (!cancelled) setDepartmentsError(getErrorMessage(err, 'Could not load departments.'))
// //             })
// //         return () => {
// //             cancelled = true
// //         }
// //     }, [])

// //     const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
// //         const { name, value } = e.target
// //         setForm((prev) => ({ ...prev, [name]: value }))
// //         if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
// //         setServerError('')
// //     }

// //     const save = async () => {
// //         const found = validate(form)
// //         setErrors(found)
// //         if (Object.keys(found).length > 0) return

// //         const payload: UserCreate = {
// //             role: form.role,
// //             fullName: form.fullName.trim(),
// //             email: form.email.trim(),
// //             phone: form.phone.trim(),
// //             gender: form.gender,
// //             password: form.password,
// //         }
// //         if (form.role === 'lecturer') {
// //             payload.staffId = form.staffId.trim()
// //             payload.departmentId = Number(form.departmentId)
// //             payload.qualification = form.qualification.trim()
// //         } else if (form.role === 'employee') {
// //             payload.staffId = form.staffId.trim()
// //             payload.departmentId = Number(form.departmentId)
// //             payload.position = form.position.trim()
// //         }

// //         setSaving(true)
// //         setServerError('')
// //         try {
// //             const user = await createUser(payload)
// //             setCreated({ user, password: form.password })
// //         } catch (err) {
// //             setErrors(getFieldErrors(err) as Errors)
// //             setServerError(getErrorMessage(err, 'Could not create the account.'))
// //         } finally {
// //             setSaving(false)
// //         }
// //     }

// //     const copyCredentials = async () => {
// //         if (!created) return
// //         try {
// //             await navigator.clipboard.writeText(`Email: ${created.user.email}\nPassword: ${created.password}`)
// //             setCopyNote('Copied.')
// //         } catch {
// //             setCopyNote('Could not copy. Select the password and copy it by hand.')
// //         }
// //     }

// //     const finish = () => {
// //         if (created) onCreated(created.user)
// //     }

// //     const cls = (key: keyof Form) => `${inputBase} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`

// //     const field = (key: keyof Form, label: string, type = 'text', placeholder?: string) => (
// //         <div>
// //             <label htmlFor={key} className="mb-1 block text-xs font-medium text-gray-600">
// //                 {label}
// //             </label>
// //             <input
// //                 id={key}
// //                 name={key}
// //                 type={type}
// //                 value={form[key]}
// //                 onChange={change}
// //                 placeholder={placeholder}
// //                 className={cls(key)}
// //             />
// //             {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
// //         </div>
// //     )

// //     const departmentField = (
// //         <div>
// //             <label htmlFor="departmentId" className="mb-1 block text-xs font-medium text-gray-600">
// //                 Department
// //             </label>
// //             <select id="departmentId" name="departmentId" value={form.departmentId} onChange={change} className={cls('departmentId')}>
// //                 <option value="">Select...</option>
// //                 {departments.map((d) => (
// //                     <option key={d.id} value={d.id}>
// //                         {d.name}
// //                     </option>
// //                 ))}
// //             </select>
// //             {errors.departmentId && <p className="mt-1 text-xs text-red-600">{errors.departmentId}</p>}
// //             {departmentsError && <p className="mt-1 text-xs text-red-600">{departmentsError}</p>}
// //         </div>
// //     )

// //     /* ---------- Step 2: the account exists. Show the password once. ---------- */
// //     if (created) {
// //         return (
// //             <ModalShell title="Account created" onClose={finish}>
// //                 <div className="text-center">
// //                     <FaCheckCircle className="mx-auto h-12 w-12 text-green-600" />
// //                     <p className="mt-3 font-semibold text-green-950">{created.user.fullName}</p>
// //                     <p className="text-sm text-gray-500">{roleLabel[created.user.role]}</p>
// //                 </div>

// //                 <dl className="mt-5 space-y-3 rounded-lg bg-green-50 p-4 text-sm">
// //                     <div>
// //                         <dt className="text-xs text-gray-500">Email (sign-in name)</dt>
// //                         <dd className="font-medium text-green-950">{created.user.email}</dd>
// //                     </div>
// //                     <div>
// //                         <dt className="text-xs text-gray-500">Temporary password</dt>
// //                         <dd>
// //                             <input
// //                                 readOnly
// //                                 value={created.password}
// //                                 aria-label="Temporary password"
// //                                 onFocus={(e) => e.currentTarget.select()}
// //                                 className="w-full rounded-md border border-green-200 bg-white px-3 py-2 font-mono text-sm text-green-950"
// //                             />
// //                         </dd>
// //                     </div>
// //                 </dl>

// //                 <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
// //                     This password is shown only now and cannot be looked up later. Share it securely, and ask the
// //                     user to change it after their first login.
// //                 </p>
// //                 {copyNote && (
// //                     <p role="status" className="mt-2 text-sm text-gray-600">
// //                         {copyNote}
// //                     </p>
// //                 )}

// //                 <div className="mt-6 flex justify-end gap-3">
// //                     <button
// //                         type="button"
// //                         onClick={copyCredentials}
// //                         className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-5 py-2 text-sm font-medium text-green-900 hover:bg-green-50"
// //                     >
// //                         <FaCopy className="h-3.5 w-3.5" /> Copy
// //                     </button>
// //                     <button
// //                         type="button"
// //                         onClick={finish}
// //                         className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
// //                     >
// //                         Done
// //                     </button>
// //                 </div>
// //             </ModalShell>
// //         )
// //     }

// //     /* ---------- Step 1: the form ---------- */
// //     return (
// //         <ModalShell
// //             title="Add user"
// //             subtitle="Create an account for staff. Students apply through the Admission page."
// //             onClose={onClose}
// //             wide
// //         >
// //             <div className="space-y-4">
// //                 {serverError && (
// //                     <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
// //                         {serverError}
// //                     </div>
// //                 )}

// //                 <div className="grid gap-4 sm:grid-cols-2">
// //                     <div>
// //                         <label htmlFor="role" className="mb-1 block text-xs font-medium text-gray-600">
// //                             Role
// //                         </label>
// //                         <select id="role" name="role" value={form.role} onChange={change} className={cls('role')}>
// //                             {roleOptions.map((r) => (
// //                                 <option key={r.value} value={r.value}>
// //                                     {r.label}
// //                                 </option>
// //                             ))}
// //                         </select>
// //                     </div>
// //                     <div />
// //                     {field('fullName', 'Full name', 'text', 'Juma Kimaro')}
// //                     {field('email', 'Email', 'email', 'name@uhwf.or.tz')}
// //                     {field('phone', 'Phone (optional)', 'tel', '+255 ...')}
// //                     <div>
// //                         <label htmlFor="gender" className="mb-1 block text-xs font-medium text-gray-600">
// //                             Gender (optional)
// //                         </label>
// //                         <select id="gender" name="gender" value={form.gender} onChange={change} className={cls('gender')}>
// //                             <option value="">Not set</option>
// //                             <option value="female">Female</option>
// //                             <option value="male">Male</option>
// //                         </select>
// //                     </div>
// //                 </div>

// //                 {form.role === 'lecturer' && (
// //                     <div className="border-t border-gray-100 pt-4">
// //                         <h3 className="mb-3 text-sm font-semibold text-green-900">Lecturer record</h3>
// //                         <div className="grid gap-4 sm:grid-cols-2">
// //                             {field('staffId', 'Staff ID', 'text', 'LEC-0002')}
// //                             {departmentField}
// //                             {field('qualification', 'Qualification (optional)', 'text', 'Masters')}
// //                         </div>
// //                     </div>
// //                 )}

// //                 {form.role === 'employee' && (
// //                     <div className="border-t border-gray-100 pt-4">
// //                         <h3 className="mb-3 text-sm font-semibold text-green-900">Employee record</h3>
// //                         <div className="grid gap-4 sm:grid-cols-2">
// //                             {field('staffId', 'Staff ID', 'text', 'EMP-0002')}
// //                             {departmentField}
// //                             {field('position', 'Position', 'text', 'Accountant')}
// //                         </div>
// //                     </div>
// //                 )}

// //                 <div className="border-t border-gray-100 pt-4">
// //                     <label htmlFor="password" className="mb-1 block text-xs font-medium text-gray-600">
// //                         Temporary password
// //                     </label>
// //                     <div className="flex gap-2">
// //                         <div className="relative flex-1">
// //                             <input
// //                                 id="password"
// //                                 name="password"
// //                                 type={showPassword ? 'text' : 'password'}
// //                                 autoComplete="new-password"
// //                                 value={form.password}
// //                                 onChange={change}
// //                                 className={`${cls('password')} pr-10 font-mono`}
// //                             />
// //                             <button
// //                                 type="button"
// //                                 onClick={() => setShowPassword((s) => !s)}
// //                                 aria-label={showPassword ? 'Hide password' : 'Show password'}
// //                                 className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-green-700"
// //                             >
// //                                 {showPassword ? <FaEyeSlash /> : <FaEye />}
// //                             </button>
// //                         </div>
// //                         <button
// //                             type="button"
// //                             onClick={() => {
// //                                 setForm((prev) => ({ ...prev, password: generatePassword() }))
// //                                 setErrors((prev) => ({ ...prev, password: undefined }))
// //                             }}
// //                             className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50"
// //                         >
// //                             <FaMagic className="h-3.5 w-3.5" /> Generate
// //                         </button>
// //                     </div>
// //                     {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
// //                     <p className="mt-1 text-xs text-gray-500">
// //                         A strong password is already filled in. You will see it once more after the account is created.
// //                     </p>
// //                 </div>

// //                 <div className="flex justify-end gap-3 pt-2">
// //                     <button
// //                         type="button"
// //                         onClick={onClose}
// //                         className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
// //                     >
// //                         Cancel
// //                     </button>
// //                     <button
// //                         type="button"
// //                         onClick={save}
// //                         disabled={saving}
// //                         className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
// //                     >
// //                         {saving ? 'Creating...' : 'Create account'}
// //                     </button>
// //                 </div>
// //             </div>
// //         </ModalShell>
// //     )
// // }

// // export default AddUserModal
// import { useEffect, useState } from 'react'
// import type { ChangeEvent } from 'react'
// import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
// import { getErrorMessage, getFieldErrors } from '../../../services/api'
// import { inviteUser } from '../../../services/invitations'
// import type { Delivery } from '../../../services/invitations'
// import { listDepartments } from '../../../services/users'
// import type { CreatableRole, Department, UserDetail } from '../../../services/users'
// import ModalShell from './ModalShell'

// type Form = {
//     role: CreatableRole
//     fullName: string
//     email: string
//     phone: string
//     gender: '' | 'female' | 'male'
//     staffId: string
//     departmentId: string
//     qualification: string
//     position: string
// }
// type Errors = Partial<Record<keyof Form, string>>

// const roleOptions: { value: CreatableRole; label: string }[] = [
//     { value: 'lecturer', label: 'Lecturer' },
//     { value: 'employee', label: 'Employee' },
//     { value: 'ict', label: 'ICT officer' },
//     { value: 'admin', label: 'Administrator' },
// ]

// const roleName: Record<CreatableRole, string> = {
//     lecturer: 'Lecturer',
//     employee: 'Employee',
//     ict: 'ICT officer',
//     admin: 'Administrator',
//     'Hr Officer': 'HR Officer',
// }

// const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

// const validate = (f: Form): Errors => {
//     const e: Errors = {}
//     if (f.fullName.trim().length < 2) e.fullName = 'Enter the full name.'
//     if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address.'
//     if (f.phone.trim() && !/^[+\d\s-]{9,16}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.'
//     if (f.role === 'lecturer' || f.role === 'employee') {
//         if (f.staffId.trim().length < 3) e.staffId = 'Enter the staff ID (at least 3 characters).'
//         if (!f.departmentId) e.departmentId = 'Choose a department.'
//     }
//     if (f.role === 'employee' && f.position.trim().length < 2) e.position = 'Enter the position.'
//     return e
// }

// // Creates a staff account and emails the person an invitation. Nobody types a password here:
// // the person opens the link in the email (it works for 60 minutes, once) and chooses their own.
// const AddUserModal = ({
//     defaultRole,
//     onClose,
//     onCreated,
// }: {
//     defaultRole?: CreatableRole
//     onClose: () => void
//     onCreated: (user: UserDetail) => void
// }) => {
//     const [form, setForm] = useState<Form>({
//         role: defaultRole ?? 'lecturer',
//         fullName: '',
//         email: '',
//         phone: '',
//         gender: '',
//         staffId: '',
//         departmentId: '',
//         qualification: '',
//         position: '',
//     })
//     const [departments, setDepartments] = useState<Department[]>([])
//     const [errors, setErrors] = useState<Errors>({})
//     const [serverError, setServerError] = useState('')
//     const [saving, setSaving] = useState(false)
//     const [result, setResult] = useState<{ user: UserDetail; invitation: Delivery } | null>(null)

//     useEffect(() => {
//         let cancelled = false
//         listDepartments()
//             .then((d) => {
//                 if (!cancelled) setDepartments(d)
//             })
//             .catch(() => undefined) // the department list just stays empty
//         return () => {
//             cancelled = true
//         }
//     }, [])

//     const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//         const { name, value } = e.target
//         setForm((prev) => ({ ...prev, [name]: value }))
//         if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
//         setServerError('')
//     }

//     const save = async () => {
//         const found = validate(form)
//         setErrors(found)
//         if (Object.keys(found).length > 0) return

//         setSaving(true)
//         setServerError('')
//         try {
//             const needsDepartment = form.role === 'lecturer' || form.role === 'employee'
//             const reply = await inviteUser({
//                 role: form.role,
//                 fullName: form.fullName.trim(),
//                 email: form.email.trim(),
//                 phone: form.phone.trim(),
//                 gender: form.gender,
//                 ...(needsDepartment && { staffId: form.staffId.trim(), departmentId: Number(form.departmentId) }),
//                 ...(form.role === 'lecturer' && { qualification: form.qualification.trim() }),
//                 ...(form.role === 'employee' && { position: form.position.trim() }),
//             })
//             setResult(reply)
//         } catch (err) {
//             setErrors(getFieldErrors(err) as Errors)
//             setServerError(getErrorMessage(err, 'Could not create the account.'))
//         } finally {
//             setSaving(false)
//         }
//     }

//     const cls = (k: keyof Form) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

//     // ---------- after the account is created ----------
//     if (result) {
//         const { user, invitation } = result
//         return (
//             <ModalShell title="Account created" onClose={() => onCreated(user)}>
//                 <div className="text-center">
//                     {invitation.sent ? (
//                         <FaCheckCircle className="mx-auto h-14 w-14 text-green-600" />
//                     ) : (
//                         <FaExclamationTriangle className="mx-auto h-14 w-14 text-amber-500" />
//                     )}
//                     <h3 className="mt-3 text-lg font-semibold text-green-950">
//                         {invitation.sent ? 'Invitation sent' : 'Account created, but no invitation was sent'}
//                     </h3>
//                     <p className={`mt-2 text-sm leading-relaxed ${invitation.sent ? 'text-gray-600' : 'text-amber-900'}`}>{invitation.message}</p>
//                 </div>

//                 <dl className="mt-5 space-y-2 rounded-lg bg-green-50 p-4 text-sm">
//                     <div className="flex justify-between gap-3">
//                         <dt className="text-gray-500">Name</dt>
//                         <dd className="font-medium text-green-950">{user.fullName}</dd>
//                     </div>
//                     <div className="flex justify-between gap-3">
//                         <dt className="text-gray-500">Email</dt>
//                         <dd className="break-all font-medium text-green-950">{user.email}</dd>
//                     </div>
//                     <div className="flex justify-between gap-3">
//                         <dt className="text-gray-500">Role</dt>
//                         <dd className="font-medium text-green-950">{roleName[form.role]}</dd>
//                     </div>
//                     <div className="flex justify-between gap-3">
//                         <dt className="text-gray-500">Status</dt>
//                         <dd className="font-medium text-amber-800">Pending activation</dd>
//                     </div>
//                 </dl>

//                 <p className="mt-4 text-xs leading-relaxed text-gray-500">
//                     No password was created or shown. The person chooses their own when they open the link. The link works for 60
//                     minutes and only once. If it expires, use the paper-plane button next to this person in the Users list to send a
//                     new one.
//                 </p>

//                 <div className="mt-5 flex justify-end">
//                     <button
//                         type="button"
//                         onClick={() => onCreated(user)}
//                         className="rounded-lg bg-amber-400 px-6 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
//                     >
//                         Done
//                     </button>
//                 </div>
//             </ModalShell>
//         )
//     }

//     // ---------- the form ----------
//     const showDepartment = form.role === 'lecturer' || form.role === 'employee'

//     return (
//         <ModalShell title="Add user" subtitle="The person is emailed an invitation to activate the account." onClose={onClose} wide>
//             <div className="space-y-4">
//                 {serverError && (
//                     <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//                         {serverError}
//                     </p>
//                 )}

//                 <div className="grid gap-4 sm:grid-cols-2">
//                     <div>
//                         <label htmlFor="role" className="mb-1 block text-xs font-medium text-gray-600">
//                             Role
//                         </label>
//                         <select id="role" name="role" value={form.role} onChange={change} className={cls('role')}>
//                             {roleOptions.map((r) => (
//                                 <option key={r.value} value={r.value}>
//                                     {r.label}
//                                 </option>
//                             ))}
//                         </select>
//                     </div>
//                     <div>
//                         <label htmlFor="gender" className="mb-1 block text-xs font-medium text-gray-600">
//                             Gender (optional)
//                         </label>
//                         <select id="gender" name="gender" value={form.gender} onChange={change} className={cls('gender')}>
//                             <option value="">Not set</option>
//                             <option value="female">Female</option>
//                             <option value="male">Male</option>
//                         </select>
//                     </div>
//                 </div>

//                 <div className="grid gap-4 sm:grid-cols-2">
//                     <div>
//                         <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-gray-600">
//                             Full name
//                         </label>
//                         <input id="fullName" name="fullName" value={form.fullName} onChange={change} maxLength={100} className={cls('fullName')} />
//                         {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
//                     </div>
//                     <div>
//                         <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-600">
//                             Official email
//                         </label>
//                         <input id="email" name="email" type="email" value={form.email} onChange={change} placeholder="name@uhwf.or.tz" className={cls('email')} />
//                         {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
//                     </div>
//                 </div>

//                 <div>
//                     <label htmlFor="phone" className="mb-1 block text-xs font-medium text-gray-600">
//                         Phone (optional)
//                     </label>
//                     <input id="phone" name="phone" type="tel" value={form.phone} onChange={change} placeholder="+255 ..." className={cls('phone')} />
//                     {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
//                 </div>

//                 {showDepartment && (
//                     <div className="grid gap-4 sm:grid-cols-2">
//                         <div>
//                             <label htmlFor="staffId" className="mb-1 block text-xs font-medium text-gray-600">
//                                 Staff ID
//                             </label>
//                             <input id="staffId" name="staffId" value={form.staffId} onChange={change} placeholder={form.role === 'lecturer' ? 'LEC-0001' : 'EMP-0001'} className={cls('staffId')} />
//                             {errors.staffId && <p className="mt-1 text-xs text-red-600">{errors.staffId}</p>}
//                         </div>
//                         <div>
//                             <label htmlFor="departmentId" className="mb-1 block text-xs font-medium text-gray-600">
//                                 Department
//                             </label>
//                             <select id="departmentId" name="departmentId" value={form.departmentId} onChange={change} className={cls('departmentId')}>
//                                 <option value="">Select...</option>
//                                 {departments.map((d) => (
//                                     <option key={d.id} value={d.id}>
//                                         {d.name}
//                                     </option>
//                                 ))}
//                             </select>
//                             {errors.departmentId && <p className="mt-1 text-xs text-red-600">{errors.departmentId}</p>}
//                         </div>
//                     </div>
//                 )}

//                 {form.role === 'lecturer' && (
//                     <div>
//                         <label htmlFor="qualification" className="mb-1 block text-xs font-medium text-gray-600">
//                             Qualification (optional)
//                         </label>
//                         <input id="qualification" name="qualification" value={form.qualification} onChange={change} placeholder="MSc Wildlife Management" className={cls('qualification')} />
//                     </div>
//                 )}

//                 {form.role === 'employee' && (
//                     <div>
//                         <label htmlFor="position" className="mb-1 block text-xs font-medium text-gray-600">
//                             Position
//                         </label>
//                         <input id="position" name="position" value={form.position} onChange={change} placeholder="Accountant" className={cls('position')} />
//                         {errors.position && <p className="mt-1 text-xs text-red-600">{errors.position}</p>}
//                     </div>
//                 )}

//                 <p className="rounded-lg bg-green-50 p-3 text-xs leading-relaxed text-gray-600">
//                     No password is set here. The person receives an email with a secure link that works for{' '}
//                     <strong>60 minutes</strong> and only once, and chooses their own password.
//                 </p>

//                 <div className="flex justify-end gap-3 pt-1">
//                     <button
//                         type="button"
//                         onClick={onClose}
//                         className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
//                     >
//                         Cancel
//                     </button>
//                     <button
//                         type="button"
//                         onClick={() => void save()}
//                         disabled={saving}
//                         className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
//                     >
//                         {saving ? 'Creating...' : 'Create and send invitation'}
//                     </button>
//                 </div>
//             </div>
//         </ModalShell>
//     )
// }

// export default AddUserModal
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { inviteUser } from '../../../services/invitations'
import type { Delivery } from '../../../services/invitations'
import { listDepartments } from '../../../services/users'
import type { CreatableRole, Department, UserDetail } from '../../../services/users'
import ModalShell from './ModalShell'

type Form = {
    role: CreatableRole
    fullName: string
    email: string
    phone: string
    gender: '' | 'female' | 'male'
    departmentId: string
    qualification: string
    position: string
}
type Errors = Partial<Record<keyof Form, string>>

const roleOptions: { value: CreatableRole; label: string }[] = [
    { value: 'lecturer', label: 'Lecturer' },
    { value: 'employee', label: 'Employee' },
    { value: 'ict', label: 'ICT officer' },
    { value: 'admin', label: 'Administrator' },
]

const roleName: Record<CreatableRole, string> = {
    lecturer: 'Lecturer',
    employee: 'Employee',
    ict: 'ICT officer',
    admin: 'Administrator',
    'Hr Officer': 'HR Officer',
}

const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

// The staff ID is made by the server. This reads it from the new account to show it.
type WithStaff = { lecturer?: { staffId: string } | null; employee?: { staffId: string } | null }
const staffIdOf = (u: unknown) => {
    const s = u as WithStaff
    return s.lecturer?.staffId ?? s.employee?.staffId ?? null
}

const validate = (f: Form): Errors => {
    const e: Errors = {}
    if (f.fullName.trim().length < 2) e.fullName = 'Enter the full name.'
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address.'
    if (f.phone.trim() && !/^[+\d\s-]{9,16}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.'
    if (f.role === 'lecturer' || f.role === 'employee') {
        if (!f.departmentId) e.departmentId = 'Choose a department.'
    }
    if (f.role === 'employee' && f.position.trim().length < 2) e.position = 'Enter the position.'
    return e
}

// Creates a staff account and emails the person an invitation. Nobody types a password or a staff ID
// here: the server makes the staff ID, and the person opens the link in the email (it works for
// 60 minutes, once) and chooses their own password.
const AddUserModal = ({
    defaultRole,
    onClose,
    onCreated,
}: {
    defaultRole?: CreatableRole
    onClose: () => void
    onCreated: (user: UserDetail) => void
}) => {
    const [form, setForm] = useState<Form>({
        role: defaultRole ?? 'lecturer',
        fullName: '',
        email: '',
        phone: '',
        gender: '',
        departmentId: '',
        qualification: '',
        position: '',
    })
    const [departments, setDepartments] = useState<Department[]>([])
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [saving, setSaving] = useState(false)
    const [result, setResult] = useState<{ user: UserDetail; invitation: Delivery } | null>(null)

    useEffect(() => {
        let cancelled = false
        listDepartments()
            .then((d) => {
                if (!cancelled) setDepartments(d)
            })
            .catch(() => undefined) // the department list just stays empty
        return () => {
            cancelled = true
        }
    }, [])

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof Form]) setErrors((prev) => ({ ...prev, [name]: undefined }))
        setServerError('')
    }

    const save = async () => {
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSaving(true)
        setServerError('')
        try {
            const needsDepartment = form.role === 'lecturer' || form.role === 'employee'
            const reply = await inviteUser({
                role: form.role,
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                gender: form.gender,
                ...(needsDepartment && { departmentId: Number(form.departmentId) }),
                ...(form.role === 'lecturer' && { qualification: form.qualification.trim() }),
                ...(form.role === 'employee' && { position: form.position.trim() }),
            })
            setResult(reply)
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not create the account.'))
        } finally {
            setSaving(false)
        }
    }

    const cls = (k: keyof Form) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    // ---------- after the account is created ----------
    if (result) {
        const { user, invitation } = result
        const staffId = staffIdOf(user)
        return (
            <ModalShell title="Account created" onClose={() => onCreated(user)}>
                <div className="text-center">
                    {invitation.sent ? (
                        <FaCheckCircle className="mx-auto h-14 w-14 text-green-600" />
                    ) : (
                        <FaExclamationTriangle className="mx-auto h-14 w-14 text-amber-500" />
                    )}
                    <h3 className="mt-3 text-lg font-semibold text-green-950">
                        {invitation.sent ? 'Invitation sent' : 'Account created, but no invitation was sent'}
                    </h3>
                    <p className={`mt-2 text-sm leading-relaxed ${invitation.sent ? 'text-gray-600' : 'text-amber-900'}`}>{invitation.message}</p>
                </div>

                <dl className="mt-5 space-y-2 rounded-lg bg-green-50 p-4 text-sm">
                    <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Name</dt>
                        <dd className="font-medium text-green-950">{user.fullName}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Email</dt>
                        <dd className="break-all font-medium text-green-950">{user.email}</dd>
                    </div>
                    {staffId && (
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-500">Staff ID</dt>
                            <dd className="font-medium text-green-950">{staffId}</dd>
                        </div>
                    )}
                    <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Role</dt>
                        <dd className="font-medium text-green-950">{roleName[form.role]}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Status</dt>
                        <dd className="font-medium text-amber-800">Pending activation</dd>
                    </div>
                </dl>

                <p className="mt-4 text-xs leading-relaxed text-gray-500">
                    No password was created or shown. The person chooses their own when they open the link. The link works for 60
                    minutes and only once. If it expires, use the paper-plane button next to this person in the Users list to send a
                    new one.
                </p>

                <div className="mt-5 flex justify-end">
                    <button
                        type="button"
                        onClick={() => onCreated(user)}
                        className="rounded-lg bg-amber-400 px-6 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                    >
                        Done
                    </button>
                </div>
            </ModalShell>
        )
    }

    // ---------- the form ----------
    const showDepartment = form.role === 'lecturer' || form.role === 'employee'

    return (
        <ModalShell title="Add user" subtitle="The person is emailed an invitation to activate the account." onClose={onClose} wide>
            <div className="space-y-4">
                {serverError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="role" className="mb-1 block text-xs font-medium text-gray-600">
                            Role
                        </label>
                        <select id="role" name="role" value={form.role} onChange={change} className={cls('role')}>
                            {roleOptions.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="gender" className="mb-1 block text-xs font-medium text-gray-600">
                            Gender (optional)
                        </label>
                        <select id="gender" name="gender" value={form.gender} onChange={change} className={cls('gender')}>
                            <option value="">Not set</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                        </select>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-gray-600">
                            Full name
                        </label>
                        <input id="fullName" name="fullName" value={form.fullName} onChange={change} maxLength={100} className={cls('fullName')} />
                        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
                    </div>
                    <div>
                        <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-600">
                            Official email
                        </label>
                        <input id="email" name="email" type="email" value={form.email} onChange={change} placeholder="name@uhwf.or.tz" className={cls('email')} />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="phone" className="mb-1 block text-xs font-medium text-gray-600">
                        Phone (optional)
                    </label>
                    <input id="phone" name="phone" type="tel" value={form.phone} onChange={change} placeholder="+255 ..." className={cls('phone')} />
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                </div>

                {showDepartment && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="mb-1 block text-xs font-medium text-gray-600">Staff ID</p>
                            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                                Created automatically ({form.role === 'lecturer' ? 'LEC-0001' : 'EMP-0001'} style)
                            </p>
                        </div>
                        <div>
                            <label htmlFor="departmentId" className="mb-1 block text-xs font-medium text-gray-600">
                                Department
                            </label>
                            <select id="departmentId" name="departmentId" value={form.departmentId} onChange={change} className={cls('departmentId')}>
                                <option value="">Select...</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                            {errors.departmentId && <p className="mt-1 text-xs text-red-600">{errors.departmentId}</p>}
                        </div>
                    </div>
                )}

                {form.role === 'lecturer' && (
                    <div>
                        <label htmlFor="qualification" className="mb-1 block text-xs font-medium text-gray-600">
                            Qualification (optional)
                        </label>
                        <input id="qualification" name="qualification" value={form.qualification} onChange={change} placeholder="MSc Wildlife Management" className={cls('qualification')} />
                    </div>
                )}

                {form.role === 'employee' && (
                    <div>
                        <label htmlFor="position" className="mb-1 block text-xs font-medium text-gray-600">
                            Position
                        </label>
                        <input id="position" name="position" value={form.position} onChange={change} placeholder="Accountant" className={cls('position')} />
                        {errors.position && <p className="mt-1 text-xs text-red-600">{errors.position}</p>}
                    </div>
                )}

                <p className="rounded-lg bg-green-50 p-3 text-xs leading-relaxed text-gray-600">
                    No password is set here. The person receives an email with a secure link that works for{' '}
                    <strong>60 minutes</strong> and only once, and chooses their own password.
                </p>

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
                        {saving ? 'Creating...' : 'Create and send invitation'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

export default AddUserModal