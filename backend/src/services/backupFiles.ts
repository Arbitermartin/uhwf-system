import { execFile } from 'node:child_process'
import path from 'node:path'
import { env } from '../config'
import { HttpError } from '../utils/httpError'

// Backups are kept here, outside any public folder. Only ICT can download them.
export const BACKUP_DIR = path.resolve(process.cwd(), 'backups')
export const BACKUP_KEEP = 30

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000 // Tanzania: UTC+3, no daylight saving

export function parseDatabaseUrl(url: string) {
    const u = new URL(url)
    if (u.protocol !== 'postgresql:' && u.protocol !== 'postgres:') {
        throw new Error('DATABASE_URL must start with postgresql://')
    }
    return {
        host: u.hostname || 'localhost',
        port: u.port || '5432',
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: decodeURIComponent(u.pathname.replace(/^\//, '')),
    }
}

// Runs pg_dump into `outPath` (custom format, which pg_restore can read).
// The password goes in an environment variable, never on the command line, and no shell is
// used, so nothing in the settings can be run as a command.
export function pgDumpToFile(outPath: string, databaseUrl = env.DATABASE_URL, pgDump = env.PG_DUMP_PATH) {
    const db = parseDatabaseUrl(databaseUrl)

    return new Promise<void>((resolve, reject) => {
        execFile(
            pgDump,
            ['--format=custom', '--no-owner', '--no-privileges', `--file=${outPath}`],
            {
                env: {
                    ...process.env,
                    PGHOST: db.host,
                    PGPORT: db.port,
                    PGUSER: db.user,
                    PGPASSWORD: db.password,
                    PGDATABASE: db.database,
                },
                timeout: 10 * 60 * 1000,
                maxBuffer: 1024 * 1024,
                windowsHide: true,
            },
            (err, _stdout, stderr) => {
                if (!err) {
                    resolve()
                    return
                }
                if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                    reject(
                        new HttpError(
                            500,
                            'pg_dump was not found. Install the PostgreSQL tools, or set PG_DUMP_PATH in the server .env file to the full path of pg_dump.',
                        ),
                    )
                    return
                }
                reject(new Error(String(stderr).trim().slice(0, 400) || err.message))
            },
        )
    })
}

const pad = (n: number) => String(n).padStart(2, '0')

// uhwf-20261018-203400-manual.dump (the time is Tanzania time)
export function buildBackupFileName(kind: 'manual' | 'automatic', now: Date) {
    const d = new Date(now.getTime() + TZ_OFFSET_MS)
    const stamp =
        `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
        `-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
    return `uhwf-${stamp}-${kind}.dump`
}

// Turns a stored file name into a full path, and refuses anything that is not one of our files.
export function resolveBackupFile(fileName: string) {
    if (!/^uhwf-\d{8}-\d{6}-(manual|automatic)\.dump$/.test(fileName)) throw new Error('Invalid backup file name')
    const abs = path.resolve(BACKUP_DIR, fileName)
    if (!abs.startsWith(BACKUP_DIR + path.sep)) throw new Error('Invalid backup file path')
    return abs
}

// True when it is past 02:00 (Tanzania time) today and no automatic backup was made since then.
// Because it also catches up later in the day, a server that was off at 02:00 still gets its backup.
export function shouldRunAutoBackup(now: Date, lastAutomaticAt: Date | null) {
    const local = new Date(now.getTime() + TZ_OFFSET_MS)
    const todayAtTwo = new Date(
        Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 2, 0, 0) - TZ_OFFSET_MS,
    )
    if (now < todayAtTwo) return false
    return !lastAutomaticAt || lastAutomaticAt < todayAtTwo
}

export function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
