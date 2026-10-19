// import { useEffect, useRef, useState } from 'react'
// import type { ReactNode } from 'react'
// import {
//     FaServer,
//     FaDatabase,
//     FaTicketAlt,
//     FaCloudUploadAlt,
//     FaShieldAlt,
//     FaClock,
//     FaDownload,
// } from 'react-icons/fa'
// import { useStoredState } from '../../hooks/useStoredState'
// import {
//     BACKUP_KEEP,
//     BACKUP_SIZE,
//     DISK_WARNING,
//     FAILED_LOGINS_24H,
//     RESOURCES,
//     initialBackups,
//     initialLogs,
//     initialTickets,
// } from '../../data/ict'
// import type { BackupItem, LogEntry, LogLevel, Priority, Ticket } from '../../data/ict'

// type LogFilter = 'All' | LogLevel

// const levelClass: Record<LogLevel, string> = {
//     Error: 'bg-red-100 text-red-800',
//     Warning: 'bg-amber-100 text-amber-900',
//     Info: 'bg-green-100 text-green-800',
// }

// const priorityClass: Record<Priority, string> = {
//     High: 'bg-red-100 text-red-800',
//     Medium: 'bg-amber-100 text-amber-900',
//     Low: 'bg-green-100 text-green-800',
// }

// const clock = (iso: string) =>
//     new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

// const dateTime = (iso: string) =>
//     new Date(iso).toLocaleString('en-GB', {
//         day: 'numeric',
//         month: 'short',
//         hour: '2-digit',
//         minute: '2-digit',
//     })

// const backupLabel = (iso: string) =>
//     new Date(iso).toDateString() === new Date().toDateString()
//         ? `Today, ${clock(iso)}`
//         : dateTime(iso)

// const StatCard = ({
//     label,
//     value,
//     note,
//     icon,
//     valueClass = 'text-green-950',
//     noteClass = 'text-gray-500',
//     highlight,
// }: {
//     label: string
//     value: string
//     note: string
//     icon: ReactNode
//     valueClass?: string
//     noteClass?: string
//     highlight?: boolean
// }) => (
//     <div
//         className={`rounded-xl border bg-white p-4 shadow-sm ${highlight ? 'border-amber-400' : 'border-gray-200'
//             }`}
//     >
//         <p className="flex items-center gap-1.5 text-xs text-gray-500">
//             {icon} {label}
//         </p>
//         <p className={`mt-1 text-xl font-bold ${valueClass}`}>{value}</p>
//         <p className={`text-xs ${noteClass}`}>{note}</p>
//     </div>
// )

// const ResourceBar = ({ label, value, warn }: { label: string; value: number; warn?: boolean }) => (
//     <div>
//         <div className="flex justify-between text-sm text-gray-700">
//             <span>{label}</span>
//             <span className={warn ? 'font-medium text-amber-800' : ''}>
//                 {value}%{warn ? ' (warning)' : ''}
//             </span>
//         </div>
//         <div
//             className="mt-1 h-2 rounded bg-gray-100"
//             role="progressbar"
//             aria-label={label}
//             aria-valuenow={value}
//             aria-valuemin={0}
//             aria-valuemax={100}
//         >
//             <div
//                 className={`h-2 rounded ${warn ? 'bg-amber-500' : 'bg-green-500'}`}
//                 style={{ width: `${value}%` }}
//             />
//         </div>
//     </div>
// )

// // Stops spreadsheet programs from running text that starts with = + - @ as a formula
// const csvCell = (value: string) => {
//     const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
//     return `"${safe.replace(/"/g, '""')}"`
// }

// const IctDashboard = () => {
//     // System-wide data (not per user). MOCK storage: the database will hold this later.
//     const [tickets, setTickets] = useStoredState<Ticket[]>('uhwf_ict_tickets', initialTickets)
//     const [logs, setLogs] = useStoredState<LogEntry[]>('uhwf_ict_logs', initialLogs)
//     const [backups, setBackups] = useStoredState<BackupItem[]>('uhwf_ict_backups', initialBackups)
//     const [maintenance, setMaintenance] = useStoredState<boolean>('uhwf_ict_maintenance', false)

//     const [filter, setFilter] = useState<LogFilter>('All')
//     const [progress, setProgress] = useState<number | null>(null)
//     const [armedId, setArmedId] = useState<number | null>(null)
//     const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null)
//     const timer = useRef<number | undefined>(undefined)

//     const openTickets = tickets.filter((t) => t.status === 'Open').length
//     const lastBackup = backups[0]
//     const diskWarn = RESOURCES.disk >= DISK_WARNING
//     const visibleLogs = logs.filter((l) => filter === 'All' || l.level === filter)

//     // Stop the backup timer if the page is closed mid-backup
//     useEffect(() => () => window.clearInterval(timer.current), [])

//     // The "Confirm restore" button turns back to "Restore" after 4 seconds
//     useEffect(() => {
//         if (armedId === null) return
//         const t = window.setTimeout(() => setArmedId(null), 4000)
//         return () => window.clearTimeout(t)
//     }, [armedId])

//     const addLog = (level: LogLevel, message: string) =>
//         setLogs((prev) =>
//             [{ id: Date.now() + Math.random(), at: new Date().toISOString(), level, message }, ...prev].slice(0, 100),
//         )

//     const startBackup = () => {
//         if (progress !== null) return
//         setNote(null)
//         setProgress(0)
//         let p = 0
//         // TODO: await axios.post('/api/ict/backups') and show the real progress from the server.
//         // The server runs the real database dump (for example pg_dump) and stores the file.
//         timer.current = window.setInterval(() => {
//             p += 10
//             if (p >= 100) {
//                 window.clearInterval(timer.current)
//                 setBackups((prev) =>
//                     [{ id: Date.now(), at: new Date().toISOString(), kind: 'Manual' as const, size: BACKUP_SIZE }, ...prev].slice(
//                         0,
//                         BACKUP_KEEP,
//                     ),
//                 )
//                 addLog('Info', `Manual database backup completed (${BACKUP_SIZE})`)
//                 setNote({ text: 'Backup completed and saved.', bad: false })
//                 setProgress(null)
//             } else {
//                 setProgress(p)
//             }
//         }, 200)
//     }

//     const download = () =>
//         setNote({
//             text: 'Downloads work once the server creates real backup files. This is a demo list.',
//             bad: false,
//         })

//     const restore = (b: BackupItem) => {
//         if (armedId !== b.id) {
//             setArmedId(b.id)
//             setNote({
//                 text: 'Restoring replaces all current data. Click "Confirm restore" to continue.',
//                 bad: true,
//             })
//             return
//         }
//         setArmedId(null)
//         // TODO: await axios.post(`/api/ict/backups/${b.id}/restore`). The server must check
//         // that the user is ICT, and should ask for the password again before restoring.
//         setMaintenance(true)
//         addLog('Warning', `Database restore started from backup of ${dateTime(b.at)}`)
//         setNote({
//             text: `Restore of "${backupLabel(b.at)}" started. The site is in maintenance mode until it finishes.`,
//             bad: false,
//         })
//     }

//     const toggleMaintenance = () => {
//         const next = !maintenance
//         // TODO: await axios.patch('/api/ict/maintenance', { on: next })
//         setMaintenance(next)
//         addLog(next ? 'Warning' : 'Info', `Maintenance mode turned ${next ? 'on' : 'off'}`)
//     }

//     const resolveTicket = (t: Ticket) => {
//         // TODO: await axios.patch(`/api/tickets/${t.id}`, { status: 'Resolved' })
//         // The server should also send a notification to the person who opened the ticket.
//         setTickets((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: 'Resolved' } : x)))
//         addLog('Info', `Ticket #${t.id} resolved by ICT`)
//     }

//     const exportLogs = () => {
//         const rows = [
//             ['Time', 'Level', 'Message'],
//             ...logs.map((l) => [new Date(l.at).toISOString(), l.level, l.message]),
//         ]
//         const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n')
//         const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
//         const a = document.createElement('a')
//         a.href = url
//         a.download = 'uhwf-system-logs.csv'
//         a.click()
//         URL.revokeObjectURL(url)
//     }

//     return (
//         <div className="mx-auto max-w-5xl space-y-4">
//             {/* Heading */}
//             <div className="flex flex-wrap items-center justify-between gap-3">
//                 <div>
//                     <h1 className="text-2xl font-bold text-green-950">ICT dashboard</h1>
//                     <p className="text-sm text-gray-500">
//                         System health, backups, logs and support in one place.
//                     </p>
//                 </div>
//                 <span
//                     role="status"
//                     className={`rounded-full px-3 py-1 text-xs font-semibold ${maintenance ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-800'
//                         }`}
//                 >
//                     {maintenance ? 'Maintenance mode on' : 'System online'}
//                 </span>
//             </div>

//             {/* Status cards */}
//             <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
//                 <StatCard
//                     label="Server"
//                     value="Online"
//                     note="Up 41 days (sample)"
//                     icon={<FaServer className="h-3 w-3" />}
//                     valueClass="text-green-700"
//                 />
//                 <StatCard
//                     label="Database"
//                     value="Healthy"
//                     note={`${BACKUP_SIZE} used (sample)`}
//                     icon={<FaDatabase className="h-3 w-3" />}
//                     valueClass="text-green-700"
//                 />
//                 <StatCard
//                     label="Open tickets"
//                     value={String(openTickets)}
//                     note={openTickets > 0 ? 'Need action' : 'All clear'}
//                     icon={<FaTicketAlt className="h-3 w-3" />}
//                     valueClass={openTickets > 0 ? 'text-amber-700' : 'text-green-700'}
//                     noteClass={openTickets > 0 ? 'text-amber-700' : 'text-gray-500'}
//                     highlight={openTickets > 0}
//                 />
//                 <StatCard
//                     label="Last backup"
//                     value={lastBackup ? backupLabel(lastBackup.at) : 'None yet'}
//                     note={lastBackup ? 'Successful' : 'Run a backup now'}
//                     icon={<FaCloudUploadAlt className="h-3 w-3" />}
//                     noteClass={lastBackup ? 'text-green-700' : 'text-amber-700'}
//                 />
//                 <StatCard
//                     label="Failed logins"
//                     value={String(FAILED_LOGINS_24H)}
//                     note="Last 24 hours (sample)"
//                     icon={<FaShieldAlt className="h-3 w-3" />}
//                 />
//             </div>

//             <div className="grid gap-4 lg:grid-cols-2">
//                 {/* Backup and restore */}
//                 <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                     <div className="flex items-center justify-between gap-2">
//                         <h2 className="font-semibold text-green-950">Backup and restore</h2>
//                         <button
//                             type="button"
//                             onClick={startBackup}
//                             disabled={progress !== null}
//                             className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
//                         >
//                             <FaCloudUploadAlt className="h-3.5 w-3.5" />
//                             {progress !== null ? 'Backing up...' : 'Back up now'}
//                         </button>
//                     </div>

//                     {progress !== null && (
//                         <div className="mt-3">
//                             <p className="text-xs text-gray-500">Backing up database...</p>
//                             <div
//                                 className="mt-1 h-2 rounded bg-gray-100"
//                                 role="progressbar"
//                                 aria-label="Backup progress"
//                                 aria-valuenow={progress}
//                                 aria-valuemin={0}
//                                 aria-valuemax={100}
//                             >
//                                 <div className="h-2 rounded bg-green-900 transition-all" style={{ width: `${progress}%` }} />
//                             </div>
//                         </div>
//                     )}

//                     {note && (
//                         <p
//                             role="status"
//                             className={`mt-3 rounded-lg px-3 py-2 text-sm ${note.bad ? 'bg-amber-50 text-amber-900' : 'bg-green-50 text-green-800'
//                                 }`}
//                         >
//                             {note.text}
//                         </p>
//                     )}

//                     <ul className="mt-3 divide-y divide-gray-100">
//                         {backups.slice(0, 5).map((b) => (
//                             <li key={b.id} className="flex items-center gap-3 py-2.5 text-sm">
//                                 <FaDatabase className="h-4 w-4 shrink-0 text-green-900" />
//                                 <div className="min-w-0 flex-1">
//                                     <p className="font-medium text-green-950">{backupLabel(b.at)}</p>
//                                     <p className="text-xs text-gray-500">
//                                         {b.kind} · {b.size} · Success
//                                     </p>
//                                 </div>
//                                 <button
//                                     type="button"
//                                     onClick={download}
//                                     aria-label={`Download backup from ${backupLabel(b.at)}`}
//                                     className="rounded-md border border-green-900 p-2 text-green-900 hover:bg-green-50"
//                                 >
//                                     <FaDownload className="h-3 w-3" />
//                                 </button>
//                                 <button
//                                     type="button"
//                                     onClick={() => restore(b)}
//                                     className={`rounded-md border px-3 py-1.5 text-xs font-medium ${armedId === b.id
//                                         ? 'border-red-700 bg-red-700 text-white'
//                                         : 'border-green-900 text-green-900 hover:bg-green-50'
//                                         }`}
//                                 >
//                                     {armedId === b.id ? 'Confirm restore' : 'Restore'}
//                                 </button>
//                             </li>
//                         ))}
//                         {backups.length === 0 && (
//                             <li className="py-3 text-sm text-gray-500">No backups yet. Click "Back up now".</li>
//                         )}
//                     </ul>

//                     <p className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
//                         <FaClock className="h-3 w-3" />
//                         Automatic backup every day at 02:00. Last {BACKUP_KEEP} are kept.
//                     </p>
//                 </section>

//                 {/* Server resources + maintenance */}
//                 <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                     <h2 className="font-semibold text-green-950">Server resources</h2>
//                     <p className="text-xs text-gray-500">Sample values. The server will report real ones.</p>
//                     <div className="mt-4 space-y-4">
//                         <ResourceBar label="CPU" value={RESOURCES.cpu} />
//                         <ResourceBar label="Memory" value={RESOURCES.memory} />
//                         <ResourceBar label="Disk" value={RESOURCES.disk} warn={diskWarn} />
//                     </div>

//                     <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
//                         <div>
//                             <p className="text-sm font-medium text-green-950">Maintenance mode</p>
//                             <p className="text-xs text-gray-500">Shows a notice on the public site</p>
//                         </div>
//                         <button
//                             type="button"
//                             role="switch"
//                             aria-checked={maintenance}
//                             aria-label="Maintenance mode"
//                             onClick={toggleMaintenance}
//                             className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${maintenance ? 'bg-amber-600' : 'bg-green-200'
//                                 }`}
//                         >
//                             <span
//                                 className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${maintenance ? 'left-[22px]' : 'left-0.5'
//                                     }`}
//                             />
//                         </button>
//                     </div>
//                 </section>
//             </div>

//             {/* Support tickets */}
//             <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                 <h2 className="font-semibold text-green-950">Support tickets</h2>
//                 <ul className="mt-2 divide-y divide-gray-100">
//                     {tickets.map((t) => (
//                         <li key={t.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
//                             <span className="w-10 text-gray-500">#{t.id}</span>
//                             <div className="min-w-0 flex-1">
//                                 <p className="font-medium text-green-950">{t.subject}</p>
//                                 <p className="text-xs text-gray-500">{t.requester}</p>
//                             </div>
//                             <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityClass[t.priority]}`}>
//                                 {t.priority}
//                             </span>
//                             {t.status === 'Open' ? (
//                                 <button
//                                     type="button"
//                                     onClick={() => resolveTicket(t)}
//                                     className="rounded-md border border-green-900 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-900 hover:text-white"
//                                 >
//                                     Resolve
//                                 </button>
//                             ) : (
//                                 <span className="rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
//                                     Resolved
//                                 </span>
//                             )}
//                         </li>
//                     ))}
//                 </ul>
//             </section>

//             {/* System logs */}
//             <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                 <div className="flex flex-wrap items-center justify-between gap-3">
//                     <h2 className="font-semibold text-green-950">System logs</h2>
//                     <div className="flex flex-wrap gap-2">
//                         {(['All', 'Error', 'Warning', 'Info'] as LogFilter[]).map((f) => (
//                             <button
//                                 key={f}
//                                 type="button"
//                                 onClick={() => setFilter(f)}
//                                 aria-pressed={filter === f}
//                                 className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === f
//                                     ? 'border-green-900 bg-green-900 text-white'
//                                     : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
//                                     }`}
//                             >
//                                 {f === 'Error' ? 'Errors' : f === 'Warning' ? 'Warnings' : f}
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 <ul className="mt-2 divide-y divide-gray-100">
//                     {visibleLogs.length === 0 && (
//                         <li className="py-3 text-sm text-gray-500">No log entries for this filter.</li>
//                     )}
//                     {visibleLogs.slice(0, 12).map((l) => (
//                         <li key={l.id} className="flex items-start gap-3 py-2.5 text-sm">
//                             <span className="w-28 shrink-0 text-xs text-gray-500">{dateTime(l.at)}</span>
//                             <span className={`w-16 shrink-0 rounded px-2 py-0.5 text-center text-xs font-medium ${levelClass[l.level]}`}>
//                                 {l.level}
//                             </span>
//                             <span className="text-gray-700">{l.message}</span>
//                         </li>
//                     ))}
//                 </ul>

//                 <button
//                     type="button"
//                     onClick={exportLogs}
//                     className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-green-900 hover:underline"
//                 >
//                     <FaDownload className="h-3.5 w-3.5" /> Export logs (CSV)
//                 </button>
//             </section>
//         </div>
//     )
// }

// export default IctDashboard
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { FaCloudUploadAlt, FaDatabase, FaServer, FaShieldAlt, FaSyncAlt, FaTicketAlt } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { getOverview, setMaintenance } from '../../services/ict'
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
