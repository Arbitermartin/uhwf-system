import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { FaCloudUploadAlt, FaDatabase, FaServer, FaShieldAlt, FaSyncAlt, FaTicketAlt } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { getOverview, sendTestEmail, setMaintenance } from '../../services/ict'
import type { IctOverview } from '../../services/ict'
import BackupsPanel, { backupWhen, formatSize } from './panels/BackupsPanel'
import LogsPanel from './panels/LogsPanel'
import TicketsPanel from './panels/TicketsPanel'

const StatCard = ({
    label,
    value,
    note,
    icon,
    valueClass = 'text-green-950',
    noteClass = 'text-gray-500',
    highlight,
}: {
    label: string
    value: string
    note: string
    icon: ReactNode
    valueClass?: string
    noteClass?: string
    highlight?: boolean
}) => (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${highlight ? 'border-amber-400' : 'border-gray-200'}`}>
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
            {icon} {label}
        </p>
        <p className={`mt-1 text-xl font-bold ${valueClass}`}>{value}</p>
        <p className={`text-xs ${noteClass}`}>{note}</p>
    </div>
)

const ResourceBar = ({ label, value }: { label: string; value: number | null }) => {
    if (value === null) {
        return (
            <div className="flex justify-between text-sm text-gray-500">
                <span>{label}</span>
                <span>Not available</span>
            </div>
        )
    }
    const level = value >= 90 ? 'danger' : value >= 75 ? 'warn' : 'ok'
    return (
        <div>
            <div className="flex justify-between text-sm text-gray-700">
                <span>{label}</span>
                <span className={level === 'danger' ? 'font-medium text-red-700' : level === 'warn' ? 'font-medium text-amber-800' : ''}>
                    {value}%{level === 'danger' ? ' (critical)' : level === 'warn' ? ' (warning)' : ''}
                </span>
            </div>
            <div
                className="mt-1 h-2 rounded bg-gray-100"
                role="progressbar"
                aria-label={label}
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={`h-2 rounded ${level === 'danger' ? 'bg-red-600' : level === 'warn' ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    )
}

const uptimeText = (seconds: number) => {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d} d ${h} h`
    if (h > 0) return `${h} h ${m} min`
    return `${m} min`
}

const REFRESH_MS = 60_000

const IctDashboard = () => {
    const [overview, setOverview] = useState<IctOverview | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [toggling, setToggling] = useState(false)
    const [mailBusy, setMailBusy] = useState(false)
    const [mailNote, setMailNote] = useState<{ text: string; bad: boolean } | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setOverview(await getOverview())
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load the system status.'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void load()
        const t = window.setInterval(() => void load(), REFRESH_MS)
        return () => window.clearInterval(t)
    }, [load])

    const toggleMaintenance = async () => {
        if (!overview) return
        setToggling(true)
        setError('')
        try {
            const on = await setMaintenance(!overview.maintenance)
            setOverview({ ...overview, maintenance: on })
        } catch (err) {
            setError(getErrorMessage(err, 'Could not change maintenance mode.'))
        } finally {
            setToggling(false)
        }
    }

    const testEmail = async () => {
        setMailBusy(true)
        setMailNote(null)
        try {
            setMailNote({ text: await sendTestEmail(), bad: false })
        } catch (err) {
            setMailNote({ text: getErrorMessage(err, 'The test email failed.'), bad: true })
        } finally {
            setMailBusy(false)
        }
    }

    // a backup older than 36 hours is a warning when automatic backups are meant to run every day
    const backupAgeHours = overview?.lastBackup
        ? (Date.now() - new Date(overview.lastBackup.createdAt).getTime()) / 3_600_000
        : null
    const backupStale = overview?.autoBackup && (backupAgeHours === null || backupAgeHours > 36)

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">ICT dashboard</h1>
                    <p className="text-sm text-gray-500">System health, backups, logs and support in one place.</p>
                </div>
                <div className="flex items-center gap-2">
                    {overview && (
                        <span
                            role="status"
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${overview.maintenance ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-800'
                                }`}
                        >
                            {overview.maintenance ? 'Maintenance mode on' : 'System online'}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => void load()}
                        disabled={loading}
                        aria-label="Refresh the status"
                        className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-1.5 text-sm font-medium text-green-900 hover:bg-green-50 disabled:opacity-60"
                    >
                        <FaSyncAlt className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {!overview && !error && <p className="py-6 text-center text-sm text-gray-500">Loading the system status...</p>}

            {overview && (
                <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                        <StatCard
                            label="API server"
                            value="Online"
                            note={`Running for ${uptimeText(overview.server.uptimeSeconds)}`}
                            icon={<FaServer className="h-3 w-3" />}
                            valueClass="text-green-700"
                        />
                        <StatCard
                            label="Database"
                            value={overview.database.ok ? 'Healthy' : 'Unreachable'}
                            note={
                                overview.database.ok && overview.database.sizeBytes !== null
                                    ? `${formatSize(overview.database.sizeBytes)} · ${overview.database.latencyMs} ms`
                                    : 'Check the PostgreSQL service'
                            }
                            icon={<FaDatabase className="h-3 w-3" />}
                            valueClass={overview.database.ok ? 'text-green-700' : 'text-red-700'}
                            noteClass={overview.database.ok ? 'text-gray-500' : 'text-red-700'}
                            highlight={!overview.database.ok}
                        />
                        <StatCard
                            label="Open tickets"
                            value={String(overview.openTickets)}
                            note={overview.openTickets > 0 ? 'Need action' : 'All clear'}
                            icon={<FaTicketAlt className="h-3 w-3" />}
                            valueClass={overview.openTickets > 0 ? 'text-amber-700' : 'text-green-700'}
                            noteClass={overview.openTickets > 0 ? 'text-amber-700' : 'text-gray-500'}
                            highlight={overview.openTickets > 0}
                        />
                        <StatCard
                            label="Last backup"
                            value={overview.lastBackup ? backupWhen(overview.lastBackup.createdAt) : 'None yet'}
                            note={
                                overview.lastBackup
                                    ? backupStale
                                        ? 'Older than expected'
                                        : overview.lastBackup.kind === 'automatic'
                                            ? 'Automatic'
                                            : 'Manual'
                                    : 'Run a backup now'
                            }
                            icon={<FaCloudUploadAlt className="h-3 w-3" />}
                            valueClass={backupStale ? 'text-amber-700' : 'text-green-950'}
                            noteClass={backupStale || !overview.lastBackup ? 'text-amber-700' : 'text-green-700'}
                            highlight={!!backupStale}
                        />
                        <StatCard
                            label="Failed logins"
                            value={String(overview.failedLogins24h)}
                            note="Last 24 hours"
                            icon={<FaShieldAlt className="h-3 w-3" />}
                            valueClass={overview.failedLogins24h >= 20 ? 'text-red-700' : 'text-green-950'}
                        />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <BackupsPanel viewAllTo="/ict/backups" onChanged={() => void load()} />

                        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="font-semibold text-green-950">Server resources</h2>
                            <p className="text-xs text-gray-500">Of the computer that runs the server, measured just now.</p>
                            <div className="mt-4 space-y-4">
                                <ResourceBar label="CPU" value={overview.resources.cpu} />
                                <ResourceBar label="Memory" value={overview.resources.memory} />
                                <ResourceBar label="Disk" value={overview.resources.disk} />
                            </div>

                            <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
                                <div>
                                    <p className="text-sm font-medium text-green-950">Maintenance mode</p>
                                    <p className="text-xs text-gray-500">
                                        A notice shows on the public website, and only administrators and ICT can sign in.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={overview.maintenance}
                                    aria-label="Maintenance mode"
                                    disabled={toggling}
                                    onClick={() => void toggleMaintenance()}
                                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${overview.maintenance ? 'bg-amber-600' : 'bg-green-200'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${overview.maintenance ? 'left-[22px]' : 'left-0.5'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="mt-5 border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-green-950">Email</p>
                                        <p className="text-xs text-gray-500">
                                            Used for "forgot password" links.{' '}
                                            {overview.mail.configured ? `Sending through ${overview.mail.host}.` : 'Not set up yet.'}
                                        </p>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${overview.mail.configured ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'
                                            }`}
                                    >
                                        {overview.mail.configured ? 'Set up' : 'Not set up'}
                                    </span>
                                </div>

                                {overview.mail.configured ? (
                                    <button
                                        type="button"
                                        onClick={() => void testEmail()}
                                        disabled={mailBusy}
                                        className="mt-3 rounded-lg border border-green-900 px-4 py-1.5 text-sm font-medium text-green-900 hover:bg-green-50 disabled:opacity-60"
                                    >
                                        {mailBusy ? 'Sending...' : 'Send a test email to me'}
                                    </button>
                                ) : (
                                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                                        Add the SMTP_ settings to the server .env file, then restart it. Until then, a reset link is
                                        printed in the server window instead of being emailed (development only).
                                    </p>
                                )}
                                {mailNote && (
                                    <p
                                        role={mailNote.bad ? 'alert' : 'status'}
                                        className={`mt-3 rounded-lg px-3 py-2 text-sm ${mailNote.bad ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}
                                    >
                                        {mailNote.text}
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>
                </>
            )}

            <TicketsPanel pageSize={5} viewAllTo="/ict/tickets" onChanged={() => void load()} />
            <LogsPanel pageSize={8} viewAllTo="/ict/logs" />
        </div>
    )
}

export default IctDashboard

