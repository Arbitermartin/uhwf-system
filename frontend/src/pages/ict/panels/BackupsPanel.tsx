import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaClock, FaCloudUploadAlt, FaDatabase, FaDownload, FaTrash } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import { backupDownloadUrl, createBackup, deleteBackup, listBackups } from '../../../services/ict'
import type { BackupList } from '../../../services/ict'
// import type { BackupList } from '../../../services/ict'

export const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export const backupWhen = (iso: string) => {
    const d = new Date(iso)
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    return d.toDateString() === new Date().toDateString()
        ? `Today, ${time}`
        : `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`
}

const BackupsPanel = ({ viewAllTo, onChanged }: { viewAllTo?: string; onChanged?: () => void }) => {
    const [data, setData] = useState<BackupList | null>(null)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [armedId, setArmedId] = useState<number | null>(null)
    const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null)
    const armTimer = useRef<number | undefined>(undefined)

    const load = useCallback(async () => {
        try {
            setData(await listBackups())
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load the backups.'))
        }
    }, [])

    useEffect(() => {
        void load()
        return () => window.clearTimeout(armTimer.current)
    }, [load])

    const backUp = async () => {
        setBusy(true)
        setNote(null)
        try {
            await createBackup()
            setNote({ text: 'Backup completed and saved.', bad: false })
            await load()
            onChanged?.()
        } catch (err) {
            setNote({ text: getErrorMessage(err, 'The backup failed.'), bad: true })
            onChanged?.()
        } finally {
            setBusy(false)
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
        try {
            await deleteBackup(id)
            setNote({ text: 'Backup deleted.', bad: false })
            await load()
            onChanged?.()
        } catch (err) {
            setNote({ text: getErrorMessage(err, 'Could not delete the backup.'), bad: true })
        }
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-green-950">Backups</h2>
                <div className="flex items-center gap-3">
                    {viewAllTo && (
                        <Link to={viewAllTo} className="text-sm font-medium text-green-800 hover:underline">
                            View all
                        </Link>
                    )}
                    <button
                        type="button"
                        onClick={() => void backUp()}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FaCloudUploadAlt className="h-3.5 w-3.5" />
                        {busy ? 'Backing up...' : 'Back up now'}
                    </button>
                </div>
            </div>

            {busy && (
                <div className="mt-3" role="status">
                    <p className="text-xs text-gray-500">Backing up the database. This can take a moment...</p>
                    <div className="mt-1 h-2 overflow-hidden rounded bg-gray-100">
                        <div className="h-2 w-1/3 animate-pulse rounded bg-green-900" />
                    </div>
                </div>
            )}

            {note && (
                <p
                    role={note.bad ? 'alert' : 'status'}
                    className={`mt-3 rounded-lg px-3 py-2 text-sm ${note.bad ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}
                >
                    {note.text}
                </p>
            )}
            {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <ul className="mt-3 divide-y divide-gray-100">
                {!data && !error && <li className="py-4 text-sm text-gray-500">Loading...</li>}
                {data && data.backups.length === 0 && (
                    <li className="py-4 text-sm text-gray-500">No backups yet. Click "Back up now".</li>
                )}
                {data?.backups.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                        <FaDatabase className="h-4 w-4 shrink-0 text-green-900" />
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-green-950">{backupWhen(b.createdAt)}</p>
                            <p className="truncate text-xs text-gray-500">
                                {b.kind === 'automatic' ? 'Automatic' : `Manual${b.createdBy ? ` by ${b.createdBy}` : ''}`} ·{' '}
                                {formatSize(b.sizeBytes)}
                                {!b.fileExists && <span className="ml-1 font-medium text-red-700">· file missing on the server</span>}
                            </p>
                        </div>
                        {b.fileExists ? (
                            <a
                                href={backupDownloadUrl(b.id)}
                                aria-label={`Download backup from ${backupWhen(b.createdAt)}`}
                                title="Download"
                                className="rounded-md border border-green-900 p-2 text-green-900 hover:bg-green-50"
                            >
                                <FaDownload className="h-3 w-3" />
                            </a>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => void remove(b.id)}
                            aria-label={`Delete backup from ${backupWhen(b.createdAt)}`}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium ${armedId === b.id
                                ? 'border-red-700 bg-red-700 text-white'
                                : 'border-red-600 text-red-700 hover:bg-red-50'
                                }`}
                        >
                            <FaTrash className="h-3 w-3" />
                            {armedId === b.id ? 'Confirm delete' : 'Delete'}
                        </button>
                    </li>
                ))}
            </ul>

            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                <p className="flex items-center gap-1.5">
                    <FaClock className="h-3 w-3" />
                    {data?.autoBackup
                        ? `Automatic backup every day at 02:00. The last ${data.keep} are kept.`
                        : 'Automatic backups are off. Set AUTO_BACKUP=true in the server .env file to turn them on.'}
                </p>
                <p>
                    <strong className="font-semibold text-gray-700">Restoring</strong> is done on the server command line, on
                    purpose, because it replaces all current data. Example:{' '}
                    <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px] text-gray-800">
                        pg_restore --clean --if-exists --no-owner -d uhwf_db backups\file.dump
                    </code>
                </p>
                <p>
                    Uploaded student documents are <strong className="font-semibold text-gray-700">not</strong> inside these backups.
                    Copy the server's <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px] text-gray-800">uploads</code> folder
                    as well.
                </p>
            </div>
        </section>
    )
}

export default BackupsPanel
