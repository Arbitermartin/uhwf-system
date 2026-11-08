import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../../services/api'
import { getAccount } from '../../../services/ictAccounts'
import type { AccountDetail, ActivityEntry } from '../../../services/ictAccounts'
import ModalShell from '../../admin/users/ModalShell'
import { formatDate, formatDateTime, roleLabel, roleTag, statusTag } from '../../admin/users/userLabels'

const levelTag = {
    error: 'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-900',
    info: 'bg-green-100 text-green-800',
} as const

const Item = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div>
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="break-words text-sm font-medium text-green-950">{value ? value : '-'}</dd>
    </div>
)

const AccountDetailsModal = ({ id, onClose }: { id: number; onClose: () => void }) => {
    const [data, setData] = useState<{ account: AccountDetail; activity: ActivityEntry[] } | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        getAccount(id)
            .then((d) => {
                if (!cancelled) setData(d)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load this account.'))
            })
        return () => {
            cancelled = true
        }
    }, [id])

    const a = data?.account

    return (
        <ModalShell title={a ? a.name : 'Account'} subtitle={a?.email} onClose={onClose} wide>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {!data && !error && <p className="py-6 text-center text-sm text-gray-500">Loading...</p>}

            {data && a && (
                <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${roleTag[a.role]}`}>{roleLabel[a.role]}</span>
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusTag[a.status]}`}>{a.status}</span>
                        {a.mustChangePassword && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">Must change password</span>
                        )}
                    </div>

                    <dl className="grid gap-3 rounded-lg bg-green-50 p-4 sm:grid-cols-2">
                        <Item label="Reference (reg. number or staff ID)" value={a.reference} />
                        <Item label="Phone" value={a.phone} />
                        <Item label="Last sign-in" value={a.lastLoginAt ? formatDateTime(a.lastLoginAt) : 'Has never signed in'} />
                        <Item label="Account created" value={formatDate(a.createdAt)} />
                    </dl>

                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-green-900">Recent activity</h3>
                        {data.activity.length === 0 ? (
                            <p className="text-sm text-gray-500">Nothing recorded for this account yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                                {data.activity.map((l) => (
                                    <li key={l.id} className="flex items-start gap-3 p-3 text-sm">
                                        <span className="w-28 shrink-0 text-xs text-gray-500">{formatDateTime(l.createdAt)}</span>
                                        <span className={`w-16 shrink-0 rounded px-2 py-0.5 text-center text-xs font-medium ${levelTag[l.level]}`}>{l.level}</span>
                                        <span className="min-w-0 flex-1 break-words text-gray-700">{l.message}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            )}
        </ModalShell>
    )
}

export default AccountDetailsModal
