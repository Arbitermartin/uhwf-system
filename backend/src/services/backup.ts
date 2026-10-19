import fs from 'node:fs/promises'
import { env } from '../config'
import { prisma } from '../prisma'
import { HttpError } from '../utils/httpError'
import {
    BACKUP_DIR,
    BACKUP_KEEP,
    buildBackupFileName,
    formatSize,
    pgDumpToFile,
    resolveBackupFile,
    shouldRunAutoBackup,
} from './backupFiles'

type Level = 'error' | 'warning' | 'info'

const log = (level: Level, message: string, userId: number | null) =>
    prisma.activityLog.create({ data: { userId, level, message } }).catch(() => undefined)

let running = false

// Makes one backup: runs pg_dump, records it in the database, and removes the oldest ones.
export async function runBackup(kind: 'manual' | 'automatic', userId: number | null) {
    if (running) throw new HttpError(409, 'A backup is already running.')
    running = true

    const fileName = buildBackupFileName(kind, new Date())
    const file = resolveBackupFile(fileName)
    const label = kind === 'manual' ? 'Manual' : 'Automatic'

    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true })
        await pgDumpToFile(file)

        const { size } = await fs.stat(file)
        if (size === 0) throw new Error('The backup file is empty.')

        // const backup = await prisma.backup.create({
        //     data: { kind, fileName, sizeBytes: BigInt(size), createdById: userId },
        // })
        const sizeMb = Math.ceil(size / (1024 * 1024))

        const backup = await prisma.backup.create({
            data: {
                kind,
                fileName,
                sizeMb,
                createdById: userId,
            },
        })
        // const sizeMb = Math.ceil(size / (1024 * 1024))

        // const backup = await prisma.backup.create({
        //     data: {
        //         kind,
        //         fileName,
        //         sizeBytes: BigInt(size),
        //         sizeMb,
        //         createdById: userId,
        //     },
        // })
        await log('info', `${label} database backup completed (${formatSize(size)})`, userId)
        await applyRetention()
        return backup
    } catch (err) {
        await fs.rm(file, { force: true }) // never keep a half-written file
        const reason = err instanceof Error ? err.message : 'unknown error'
        await log('error', `${label} database backup failed: ${reason}`, userId)
        throw err instanceof HttpError ? err : new HttpError(500, `The backup failed: ${reason}`)
    } finally {
        running = false
    }
}

// Keep the newest BACKUP_KEEP backups, delete the rest (files and records)
async function applyRetention() {
    const old = await prisma.backup.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: BACKUP_KEEP,
        select: { id: true, fileName: true },
    })
    for (const b of old) {
        await fs.rm(resolveBackupFile(b.fileName), { force: true })
        await prisma.backup.delete({ where: { id: b.id } })
    }
}

// Checks every 5 minutes whether today's automatic backup is due (see shouldRunAutoBackup).
export function startBackupScheduler() {
    if (!env.autoBackup) {
        console.log('Automatic backups are off (set AUTO_BACKUP=true in .env to turn them on).')
        return
    }

    let lastFailure = 0
    const tick = async () => {
        // after a failure, wait an hour before trying again, so the log is not flooded
        if (Date.now() - lastFailure < 60 * 60 * 1000) return
        try {
            const last = await prisma.backup.findFirst({
                where: { kind: 'automatic' },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
            })
            if (shouldRunAutoBackup(new Date(), last?.createdAt ?? null)) await runBackup('automatic', null)
        } catch (err) {
            lastFailure = Date.now()
            console.error('Automatic backup failed:', err instanceof Error ? err.message : err)
        }
    }

    setTimeout(() => void tick(), 30_000).unref()
    setInterval(() => void tick(), 5 * 60 * 1000).unref()
    console.log('Automatic backups are on: every day at 02:00 (Tanzania time).')
}
