// import { useEffect, useState } from 'react'
// import { useSearchParams } from 'react-router-dom'
// import { FaSearch, FaEye, FaEdit, FaTrash, FaPlus } from 'react-icons/fa'
// import { useAuth } from '../../hooks/useAuth'
// import { getErrorMessage } from '../../services/api'
// import { listUsers } from '../../services/users'
// import type { UserList, UserRow, UserStatus } from '../../services/users'
// import type { Role } from '../../context/auth-context'
// import UserViewModal from './users/UserViewModal'
// import UserEditModal from './users/UserEditModal'
// import ConfirmDeleteModal from './users/ConfirmDeleteModal'
// import { formatDate, formatDateTime, initials, roleLabel, roleTag, statusTag } from './users/userLabels'
// import AddUserModal from './users/AddUserModal'
// import type { CreatableRole } from '../../services/users'

// const PAGE_SIZE = 10

// const tabs: { key: Role | 'all'; label: string }[] = [
//     { key: 'all', label: 'All' },
//     { key: 'student', label: 'Students' },
//     { key: 'lecturer', label: 'Lecturers' },
//     { key: 'employee', label: 'Employees' },
//     { key: 'ict', label: 'ICT' },
//     { key: 'admin', label: 'Admins' },
// ]

// const titles: Record<Role | 'all', { title: string; subtitle: string }> = {
//     all: { title: 'Users', subtitle: 'Everyone with an account. View, edit or delete one by one.' },
//     student: { title: 'Students', subtitle: 'Student accounts and applicants.' },
//     lecturer: { title: 'Lecturers', subtitle: 'Lecturer accounts.' },
//     employee: { title: 'Employees', subtitle: 'Employee accounts.' },
//     ict: { title: 'ICT', subtitle: 'ICT accounts.' },
//     admin: { title: 'Administrators', subtitle: 'Administrator accounts.' },
// }

// const UsersPage = ({ fixedRole }: { fixedRole?: Role }) => {
//     const { user: me } = useAuth()
//     const [searchParams, setSearchParams] = useSearchParams()

//     const [tab, setTab] = useState<Role | 'all'>('all')
//     const role: Role | 'all' = fixedRole ?? tab

//     const [searchInput, setSearchInput] = useState('')
//     const [search, setSearch] = useState('')
//     const [status, setStatus] = useState<UserStatus | ''>('')
//     const [page, setPage] = useState(1)
//     const [reloadKey, setReloadKey] = useState(0)

//     const [data, setData] = useState<UserList | null>(null)
//     const [loading, setLoading] = useState(true)
//     const [error, setError] = useState('')
//     const [notice, setNotice] = useState('')
//     // "/admin/users?new=1" (from the dashboard's Add user button) opens the form straight away
//     const [adding, setAdding] = useState(searchParams.get('new') === '1')

//     const [viewId, setViewId] = useState<number | null>(null)
//     const [editId, setEditId] = useState<number | null>(null)
//     const [deleting, setDeleting] = useState<UserRow | null>(null)

//     useEffect(() => {
//         if (searchParams.has('new')) setSearchParams({}, { replace: true })
//     }, [searchParams, setSearchParams])

//     // Wait until the admin stops typing before asking the server
//     useEffect(() => {
//         const t = window.setTimeout(() => {
//             setSearch(searchInput.trim())
//             setPage(1)
//         }, 300)
//         return () => window.clearTimeout(t)
//     }, [searchInput])

//     useEffect(() => {
//         let cancelled = false
//         setLoading(true)
//         setError('')
//         listUsers({
//             search: search || undefined,
//             role: role === 'all' ? undefined : role,
//             status: status || undefined,
//             page,
//             pageSize: PAGE_SIZE,
//         })
//             .then((res) => {
//                 if (!cancelled) setData(res)
//             })
//             .catch((err) => {
//                 if (!cancelled) setError(getErrorMessage(err, 'Could not load users.'))
//             })
//             .finally(() => {
//                 if (!cancelled) setLoading(false)
//             })
//         return () => {
//             cancelled = true
//         }
//     }, [search, role, status, page, reloadKey])

//     // If the last user on a page was deleted, step back one page
//     useEffect(() => {
//         if (data && data.users.length === 0 && page > 1) setPage(page - 1)
//     }, [data, page])

//     const refresh = () => setReloadKey((k) => k + 1)

//     const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
//     const from = data && data.total > 0 ? (data.page - 1) * PAGE_SIZE + 1 : 0
//     const to = data ? Math.min(data.page * PAGE_SIZE, data.total) : 0
//     const { title, subtitle } = titles[role]

//     const switchTab = (key: Role | 'all') => {
//         setTab(key)
//         setPage(1)
//         setNotice('')
//     }

//     return (
//         <div className="mx-auto max-w-6xl space-y-4">
//             <div>
//                 <h1 className="text-2xl font-bold text-green-950">{title}</h1>
//                 <p className="text-sm text-gray-500">{subtitle}</p>
//             </div>

//             {notice && (
//                 <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
//                     {notice}
//                 </p>
//             )}

//             <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                 {/* Role tabs */}
//                 {!fixedRole && (
//                     <div className="flex flex-wrap gap-2">
//                         {tabs.map((t) => (
//                             <button
//                                 key={t.key}
//                                 type="button"
//                                 onClick={() => switchTab(t.key)}
//                                 aria-pressed={tab === t.key}
//                                 className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key
//                                     ? 'border-green-900 bg-green-900 text-white'
//                                     : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
//                                     }`}
//                             >
//                                 {t.label}
//                                 {data && <span className="ml-1.5 text-xs opacity-80">{data.counts[t.key]}</span>}
//                             </button>
//                         ))}
//                     </div>
//                 )}

//                 {/* Search and status filter */}
//                 <div className={`flex flex-wrap items-center gap-3 ${fixedRole ? '' : 'mt-4'}`}>
//                     <div className="flex min-w-[14rem] max-w-sm flex-1 items-center gap-2 rounded-lg bg-green-50 px-3">
//                         <FaSearch className="h-3.5 w-3.5 text-gray-400" />
//                         <input
//                             type="text"
//                             value={searchInput}
//                             onChange={(e) => setSearchInput(e.target.value)}
//                             placeholder="Search name, email or phone"
//                             aria-label="Search users"
//                             className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
//                         />
//                     </div>
//                     <select
//                         value={status}
//                         onChange={(e) => {
//                             setStatus(e.target.value as UserStatus | '')
//                             setPage(1)
//                         }}
//                         aria-label="Filter by status"
//                         className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500"
//                     >
//                         <option value="">All statuses</option>
//                         <option value="active">Active</option>
//                         <option value="pending">Pending</option>
//                         <option value="suspended">Suspended</option>
//                     </select>
//                 </div>

//                 {error && (
//                     <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
//                         {error}
//                     </p>
//                 )}

//                 {/* Table */}
//                 <div className="mt-4 overflow-x-auto">
//                     <table className="w-full min-w-[46rem] text-left text-sm">
//                         <thead>
//                             <tr className="text-xs text-gray-500">
//                                 <th className="py-2 font-normal">User</th>
//                                 <th className="py-2 font-normal">Role</th>
//                                 <th className="py-2 font-normal">Status</th>
//                                 <th className="py-2 font-normal">Phone</th>
//                                 <th className="py-2 font-normal">Joined</th>
//                                 <th className="py-2 font-normal">Last login</th>
//                                 <th className="py-2 text-right font-normal">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {loading && !data && (
//                                 <tr>
//                                     <td colSpan={7} className="border-t border-gray-100 py-8 text-center text-gray-500">
//                                         Loading users...
//                                     </td>
//                                 </tr>
//                             )}
//                             {data && data.users.length === 0 && (
//                                 <tr>
//                                     <td colSpan={7} className="border-t border-gray-100 py-8 text-center text-gray-500">
//                                         No users found.
//                                     </td>
//                                 </tr>
//                             )}
//                             {data?.users.map((u) => {
//                                 const isMe = u.id === me?.id
//                                 return (
//                                     <tr key={u.id} className="border-t border-gray-100">
//                                         <td className="py-3">
//                                             <div className="flex items-center gap-3">
//                                                 <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-xs font-semibold text-green-950">
//                                                     {initials(u.fullName)}
//                                                 </span>
//                                                 <div className="min-w-0">
//                                                     <p className="truncate font-medium text-green-950">
//                                                         {u.fullName}
//                                                         {isMe && <span className="ml-2 text-xs font-normal text-gray-500">(you)</span>}
//                                                     </p>
//                                                     <p className="truncate text-xs text-gray-500">{u.email}</p>
//                                                 </div>
//                                             </div>
//                                         </td>
//                                         <td className="py-3">
//                                             <span className={`rounded px-2 py-0.5 text-xs font-medium ${roleTag[u.role]}`}>
//                                                 {roleLabel[u.role]}
//                                             </span>
//                                         </td>
//                                         <td className="py-3">
//                                             <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusTag[u.status]}`}>
//                                                 {u.status}
//                                             </span>
//                                         </td>
//                                         <td className="py-3 text-gray-600">{u.phone ?? '-'}</td>
//                                         <td className="py-3 text-gray-600">{formatDate(u.createdAt)}</td>
//                                         <td className="py-3 text-gray-600">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</td>
//                                         <td className="py-3">
//                                             <div className="flex justify-end gap-2">
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => setViewId(u.id)}
//                                                     aria-label={`View ${u.fullName}`}
//                                                     title="View"
//                                                     className="rounded-md border border-green-900 p-2 text-green-900 hover:bg-green-50"
//                                                 >
//                                                     <FaEye className="h-3.5 w-3.5" />
//                                                 </button>
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => setEditId(u.id)}
//                                                     aria-label={`Edit ${u.fullName}`}
//                                                     title="Edit"
//                                                     className="rounded-md border border-amber-500 p-2 text-amber-700 hover:bg-amber-50"
//                                                 >
//                                                     <FaEdit className="h-3.5 w-3.5" />
//                                                 </button>
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => setDeleting(u)}
//                                                     disabled={isMe}
//                                                     aria-label={`Delete ${u.fullName}`}
//                                                     title={isMe ? 'You cannot delete your own account' : 'Delete'}
//                                                     className="rounded-md border border-red-600 p-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
//                                                 >
//                                                     <FaTrash className="h-3.5 w-3.5" />
//                                                 </button>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 )
//                             })}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Pagination */}
//                 {data && data.total > 0 && (
//                     <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
//                         <p>
//                             Showing {from} to {to} of {data.total}
//                         </p>
//                         <div className="flex gap-2">
//                             <button
//                                 type="button"
//                                 onClick={() => setPage(page - 1)}
//                                 disabled={page <= 1}
//                                 className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
//                             >
//                                 Previous
//                             </button>
//                             <span className="px-2 py-1.5">
//                                 Page {page} of {totalPages}
//                             </span>
//                             <button
//                                 type="button"
//                                 onClick={() => setPage(page + 1)}
//                                 disabled={page >= totalPages}
//                                 className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
//                             >
//                                 Next
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </section>

//             {viewId !== null && (
//                 <UserViewModal
//                     userId={viewId}
//                     onClose={() => setViewId(null)}
//                     onEdit={(id) => {
//                         setViewId(null)
//                         setEditId(id)
//                     }}
//                 />
//             )}

//             {editId !== null && (
//                 <UserEditModal
//                     userId={editId}
//                     currentUserId={me?.id}
//                     onClose={() => setEditId(null)}
//                     onSaved={() => {
//                         setEditId(null)
//                         setNotice('User updated.')
//                         refresh()
//                     }}
//                 />
//             )}

//             {deleting && (
//                 <ConfirmDeleteModal
//                     user={deleting}
//                     onClose={() => setDeleting(null)}
//                     onDeleted={() => {
//                         setDeleting(null)
//                         setNotice('User deleted.')
//                         refresh()
//                     }}
//                 />
//             )}
//         </div>
//     )
// }

// export default UsersPage
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FaSearch, FaEye, FaEdit, FaTrash, FaPlus, FaKey } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../services/api'
import { listUsers } from '../../services/users'
import type { CreatableRole, UserList, UserRow, UserStatus } from '../../services/users'
import type { Role } from '../../context/auth-context'
import UserViewModal from './users/UserViewModal'
import UserEditModal from './users/UserEditModal'
import ConfirmDeleteModal from './users/ConfirmDeleteModal'
import AddUserModal from './users/AddUserModal'
import { formatDate, formatDateTime, initials, roleLabel, roleTag, statusTag } from './users/userLabels'
import ResetPasswordModal from './users/resetPasswordModal'


const PAGE_SIZE = 10

const tabs: { key: Role | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'student', label: 'Students' },
    { key: 'lecturer', label: 'Lecturers' },
    { key: 'employee', label: 'Employees' },
    { key: 'ict', label: 'ICT' },
    { key: 'admin', label: 'Admins' },
]

const titles: Record<Role | 'all', { title: string; subtitle: string }> = {
    all: { title: 'Users', subtitle: 'Everyone with an account. View, edit or delete one by one.' },
    student: { title: 'Students', subtitle: 'Student accounts and applicants.' },
    lecturer: { title: 'Lecturers', subtitle: 'Lecturer accounts.' },
    employee: { title: 'Employees', subtitle: 'Employee accounts.' },
    ict: { title: 'ICT', subtitle: 'ICT accounts.' },
    admin: { title: 'Administrators', subtitle: 'Administrator accounts.' },
}

const UsersPage = ({ fixedRole }: { fixedRole?: Role }) => {
    const { user: me } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()

    const [tab, setTab] = useState<Role | 'all'>('all')
    const role: Role | 'all' = fixedRole ?? tab

    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<UserStatus | ''>('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const [data, setData] = useState<UserList | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    // "/admin/users?new=1" (from the dashboard's Add user button) opens the form straight away
    const [adding, setAdding] = useState(searchParams.get('new') === '1')
    const [viewId, setViewId] = useState<number | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [resetting, setResetting] = useState<UserRow | null>(null)
    const [deleting, setDeleting] = useState<UserRow | null>(null)

    useEffect(() => {
        if (searchParams.has('new')) setSearchParams({}, { replace: true })
    }, [searchParams, setSearchParams])

    // Wait until the admin stops typing before asking the server
    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 300)
        return () => window.clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError('')
        listUsers({
            search: search || undefined,
            role: role === 'all' ? undefined : role,
            status: status || undefined,
            page,
            pageSize: PAGE_SIZE,
        })
            .then((res) => {
                if (!cancelled) setData(res)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load users.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [search, role, status, page, reloadKey])

    // If the last user on a page was deleted, step back one page
    useEffect(() => {
        if (data && data.users.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const refresh = () => setReloadKey((k) => k + 1)

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
    const from = data && data.total > 0 ? (data.page - 1) * PAGE_SIZE + 1 : 0
    const to = data ? Math.min(data.page * PAGE_SIZE, data.total) : 0
    const { title, subtitle } = titles[role]

    const switchTab = (key: Role | 'all') => {
        setTab(key)
        setPage(1)
        setNotice('')
    }

    return (
        <div className="mx-auto max-w-6xl space-y-4">
            {/* Heading with the Add user button (hidden on the Students page: students apply through Admission) */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">{title}</h1>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
                {fixedRole !== 'student' && (
                    <button
                        type="button"
                        onClick={() => {
                            setNotice('')
                            setAdding(true)
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-300"
                    >
                        <FaPlus className="h-3 w-3" /> Add user
                    </button>
                )}
            </div>

            {notice && (
                <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
                    {notice}
                </p>
            )}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                {/* Role tabs */}
                {!fixedRole && (
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => switchTab(t.key)}
                                aria-pressed={tab === t.key}
                                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key
                                    ? 'border-green-900 bg-green-900 text-white'
                                    : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
                                    }`}
                            >
                                {t.label}
                                {data && <span className="ml-1.5 text-xs opacity-80">{data.counts[t.key]}</span>}
                            </button>
                        ))}
                    </div>
                )}

                {/* Search and status filter */}
                <div className={`flex flex-wrap items-center gap-3 ${fixedRole ? '' : 'mt-4'}`}>
                    <div className="flex min-w-[14rem] max-w-sm flex-1 items-center gap-2 rounded-lg bg-green-50 px-3">
                        <FaSearch className="h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search name, email or phone"
                            aria-label="Search users"
                            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value as UserStatus | '')
                            setPage(1)
                        }}
                        aria-label="Filter by status"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>

                {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                {/* Table */}
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[46rem] text-left text-sm">
                        <thead>
                            <tr className="text-xs text-gray-500">
                                <th className="py-2 font-normal">User</th>
                                <th className="py-2 font-normal">Role</th>
                                <th className="py-2 font-normal">Status</th>
                                <th className="py-2 font-normal">Phone</th>
                                <th className="py-2 font-normal">Joined</th>
                                <th className="py-2 font-normal">Last login</th>
                                <th className="py-2 text-right font-normal">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !data && (
                                <tr>
                                    <td colSpan={7} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        Loading users...
                                    </td>
                                </tr>
                            )}
                            {data && data.users.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                            {data?.users.map((u) => {
                                const isMe = u.id === me?.id
                                return (
                                    <tr key={u.id} className="border-t border-gray-100">
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-xs font-semibold text-green-950">
                                                    {initials(u.fullName)}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-green-950">
                                                        {u.fullName}
                                                        {isMe && <span className="ml-2 text-xs font-normal text-gray-500">(you)</span>}
                                                    </p>
                                                    <p className="truncate text-xs text-gray-500">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${roleTag[u.role]}`}>
                                                {roleLabel[u.role]}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusTag[u.status]}`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-gray-600">{u.phone ?? '-'}</td>
                                        <td className="py-3 text-gray-600">{formatDate(u.createdAt)}</td>
                                        <td className="py-3 text-gray-600">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</td>
                                        <td className="py-3">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewId(u.id)}
                                                    aria-label={`View ${u.fullName}`}
                                                    title="View"
                                                    className="rounded-md border border-green-900 p-2 text-green-900 hover:bg-green-50"
                                                >
                                                    <FaEye className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditId(u.id)}
                                                    aria-label={`Edit ${u.fullName}`}
                                                    title="Edit"
                                                    className="rounded-md border border-amber-500 p-2 text-amber-700 hover:bg-amber-50"
                                                >
                                                    <FaEdit className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setResetting(u)}
                                                    disabled={isMe}
                                                    aria-label={`Reset password for ${u.fullName}`}
                                                    title={isMe ? 'Use Change password for your own account' : 'Reset password'}
                                                    className="rounded-md border border-sky-600 p-2 text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                                >
                                                    <FaKey className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleting(u)}
                                                    disabled={isMe}
                                                    aria-label={`Delete ${u.fullName}`}
                                                    title={isMe ? 'You cannot delete your own account' : 'Delete'}
                                                    className="rounded-md border border-red-600 p-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                                >
                                                    <FaTrash className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data && data.total > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                        <p>
                            Showing {from} to {to} of {data.total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="px-2 py-1.5">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages}
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {adding && (
                <AddUserModal
                    defaultRole={fixedRole && fixedRole !== 'student' ? (fixedRole as CreatableRole) : undefined}
                    onClose={() => setAdding(false)}
                    onCreated={(created) => {
                        setAdding(false)
                        setNotice(`Account created for ${created.fullName}.`)
                        refresh()
                    }}
                />
            )}

            {viewId !== null && (
                <UserViewModal
                    userId={viewId}
                    onClose={() => setViewId(null)}
                    onEdit={(id) => {
                        setViewId(null)
                        setEditId(id)
                    }}
                />
            )}

            {editId !== null && (
                <UserEditModal
                    userId={editId}
                    currentUserId={me?.id}
                    onClose={() => setEditId(null)}
                    onSaved={() => {
                        setEditId(null)
                        setNotice('User updated.')
                        refresh()
                    }}
                />
            )}
            {resetting && (
                <ResetPasswordModal
                    user={resetting}
                    onClose={() => setResetting(null)}
                    onDone={() => {
                        setResetting(null)
                        setNotice('Password reset.')
                    }}
                />
            )}

            {deleting && (
                <ConfirmDeleteModal
                    user={deleting}
                    onClose={() => setDeleting(null)}
                    onDeleted={() => {
                        setDeleting(null)
                        setNotice('User deleted.')
                        refresh()
                    }}
                />
            )}
        </div>
    )
}

export default UsersPage