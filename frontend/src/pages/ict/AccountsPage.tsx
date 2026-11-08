import { useEffect, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../services/api'
import type { Role } from '../../context/auth-context'
import {
    listAccounts,
    resetAccountPassword,
    setAccountStatus,
    signAccountOut,
} from '../../services/ictAccounts'
import type { AccountList, AccountRow, AccountStatus } from '../../services/ictAccounts'
import { formatDateTime, initials, roleLabel, roleTag, statusTag } from '../admin/users/userLabels'
import AccountDetailsModal from './accounts/AccountDetailsModal'
import ConfirmModal from './accounts/ConfirmModal'
import TempPasswordModal from './accounts/TempPasswordModal'

const PAGE_SIZE = 15

type Tab = AccountStatus | 'all'

const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'suspended', label: 'Suspended' },
]

const roles: Role[] = ['student', 'lecturer', 'employee', 'ict', 'admin']

type Dialog =
    | { kind: 'details'; id: number }
    | { kind: 'reset'; account: AccountRow }
    | { kind: 'password'; account: AccountRow; password: string }
    | { kind: 'signout'; account: AccountRow }
    | { kind: 'status'; account: AccountRow; to: 'active' | 'suspended' }

const AccountsPage = () => {
    const { user } = useAuth()
    const [tab, setTab] = useState<Tab>('all')
    const [role, setRole] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const [data, setData] = useState<AccountList | null>(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [dialog, setDialog] = useState<Dialog | null>(null)

    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 300)
        return () => window.clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        let cancelled = false
        listAccounts({
            search: search || undefined,
            role: role ? (role as Role) : undefined,
            status: tab === 'all' ? undefined : tab,
            page,
            pageSize: PAGE_SIZE,
        })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the accounts.'))
            })
        return () => {
            cancelled = true
        }
    }, [tab, role, search, page, reloadKey])

    useEffect(() => {
        if (data && data.accounts.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const refresh = () => setReloadKey((k) => k + 1)
    const done = (message: string) => {
        setDialog(null)
        setNotice(message)
        refresh()
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
    const from = data && data.total > 0 ? (data.page - 1) * PAGE_SIZE + 1 : 0
    const to = data ? Math.min(data.page * PAGE_SIZE, data.total) : 0

    return (
        <div className="mx-auto max-w-6xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">User accounts</h1>
                <p className="text-sm text-gray-500">
                    Help people who cannot sign in: reset a password, sign someone out everywhere, or suspend an account. Creating
                    users, deleting them and changing roles is done by the administrator.
                </p>
            </div>

            {notice && (
                <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
                    {notice}
                </p>
            )}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            aria-pressed={tab === t.key}
                            onClick={() => {
                                setTab(t.key)
                                setPage(1)
                                setNotice('')
                            }}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t.key ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                                }`}
                        >
                            {t.label}
                            {data && <span className="ml-1.5 text-xs opacity-80">{data.counts[t.key]}</span>}
                        </button>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex min-w-[14rem] max-w-sm flex-1 items-center gap-2 rounded-lg bg-green-50 px-3">
                        <FaSearch className="h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by name or email"
                            aria-label="Search accounts"
                            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>
                    <select
                        value={role}
                        onChange={(e) => {
                            setRole(e.target.value)
                            setPage(1)
                        }}
                        aria-label="Filter by role"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All roles</option>
                        {roles.map((r) => (
                            <option key={r} value={r}>
                                {roleLabel[r]}
                            </option>
                        ))}
                    </select>
                </div>

                {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[48rem] text-left text-sm">
                        <thead>
                            <tr className="text-xs text-gray-500">
                                <th className="py-2 font-normal">Account</th>
                                <th className="py-2 font-normal">Role</th>
                                <th className="py-2 font-normal">Status</th>
                                <th className="py-2 font-normal">Last sign-in</th>
                                <th className="py-2 font-normal" title="Failed sign-in attempts in the last 24 hours">
                                    Failed (24h)
                                </th>
                                <th className="py-2 text-right font-normal">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data && !error && (
                                <tr>
                                    <td colSpan={6} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        Loading accounts...
                                    </td>
                                </tr>
                            )}
                            {data && data.accounts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        No accounts found.
                                    </td>
                                </tr>
                            )}
                            {data?.accounts.map((a) => (
                                <tr key={a.id} className="border-t border-gray-100">
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-xs font-semibold text-green-950">
                                                {initials(a.name)}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-green-950">{a.name}</p>
                                                <p className="truncate text-xs text-gray-500">{a.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${roleTag[a.role]}`}>{roleLabel[a.role]}</span>
                                    </td>
                                    <td className="py-3">
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusTag[a.status]}`}>{a.status}</span>
                                        {a.mustChangePassword && (
                                            <span className="ml-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900" title="Using a temporary password">
                                                Temp password
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 text-gray-600">{a.lastLoginAt ? formatDateTime(a.lastLoginAt) : 'Never'}</td>
                                    <td className="py-3">
                                        <span
                                            className={
                                                a.failedLogins24h >= 10
                                                    ? 'font-semibold text-red-700'
                                                    : a.failedLogins24h >= 3
                                                        ? 'font-semibold text-amber-700'
                                                        : 'text-gray-600'
                                            }
                                        >
                                            {a.failedLogins24h}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setDialog({ kind: 'details', id: a.id })}
                                                className="rounded-md border border-green-900 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-50"
                                            >
                                                Details
                                            </button>
                                            {a.manageable ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDialog({ kind: 'reset', account: a })}
                                                        className="rounded-md border border-amber-500 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                                                    >
                                                        Reset password
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDialog({ kind: 'signout', account: a })}
                                                        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Sign out
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDialog({ kind: 'status', account: a, to: a.status === 'suspended' ? 'active' : 'suspended' })}
                                                        className={`rounded-md border px-3 py-1 text-xs font-medium ${a.status === 'suspended'
                                                            ? 'border-green-900 text-green-900 hover:bg-green-50'
                                                            : 'border-red-600 text-red-700 hover:bg-red-50'
                                                            }`}
                                                    >
                                                        {a.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="self-center text-xs text-gray-400">
                                                    {a.id === user?.id ? 'This is you' : 'Managed by the administrator'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40"
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
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {dialog?.kind === 'details' && <AccountDetailsModal id={dialog.id} onClose={() => setDialog(null)} />}

            {dialog?.kind === 'reset' && (
                <ConfirmModal
                    title="Reset password?"
                    who={`${dialog.account.name} (${dialog.account.email})`}
                    message="A new temporary password is made and shown to you once. The person is signed out of every device and must choose their own password at the next sign-in. Their old password stops working now."
                    confirmLabel="Reset password"
                    onClose={() => setDialog(null)}
                    onConfirm={async () => {
                        const password = await resetAccountPassword(dialog.account.id)
                        setDialog({ kind: 'password', account: dialog.account, password })
                        refresh()
                    }}
                />
            )}

            {dialog?.kind === 'password' && (
                <TempPasswordModal
                    name={dialog.account.name}
                    email={dialog.account.email}
                    password={dialog.password}
                    onClose={() => {
                        setDialog(null)
                        setNotice(`The password of ${dialog.account.name} was reset.`)
                    }}
                />
            )}

            {dialog?.kind === 'signout' && (
                <ConfirmModal
                    title="Sign out everywhere?"
                    who={`${dialog.account.name} (${dialog.account.email})`}
                    message="Every device where this person is signed in is signed out now. Their password does not change, and they can sign in again straight away."
                    confirmLabel="Sign out"
                    onClose={() => setDialog(null)}
                    onConfirm={async () => done(await signAccountOut(dialog.account.id))}
                />
            )}

            {dialog?.kind === 'status' && (
                <ConfirmModal
                    title={dialog.to === 'suspended' ? 'Suspend this account?' : 'Reactivate this account?'}
                    who={`${dialog.account.name} (${dialog.account.email})`}
                    message={
                        dialog.to === 'suspended'
                            ? 'The person is signed out at once and cannot sign in until the account is reactivated. Nothing is deleted.'
                            : 'The person can sign in again with their current password.'
                    }
                    confirmLabel={dialog.to === 'suspended' ? 'Suspend account' : 'Reactivate account'}
                    danger={dialog.to === 'suspended'}
                    onClose={() => setDialog(null)}
                    onConfirm={async () => {
                        await setAccountStatus(dialog.account.id, dialog.to)
                        done(`${dialog.account.name} was ${dialog.to === 'suspended' ? 'suspended' : 'reactivated'}.`)
                    }}
                />
            )}
        </div>
    )
}

export default AccountsPage
