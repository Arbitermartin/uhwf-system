import fs from 'node:fs/promises'
import os from 'node:os'
import { prisma } from '../prisma'

// ---------- Machine usage (of the computer that runs this server) ----------

const cpuTimes = () =>
    os.cpus().reduce(
        (acc, c) => {
            const t = c.times
            acc.idle += t.idle
            acc.total += t.user + t.nice + t.sys + t.idle + t.irq
            return acc
        },
        { idle: 0, total: 0 },
    )

// Measured over a short moment, so it also works on Windows (os.loadavg() is always 0 there)
export async function cpuUsagePercent() {
    const a = cpuTimes()
    await new Promise((resolve) => setTimeout(resolve, 400))
    const b = cpuTimes()
    const total = b.total - a.total
    return total > 0 ? Math.round((1 - (b.idle - a.idle) / total) * 100) : 0
}

export const memoryUsagePercent = () => Math.round((1 - os.freemem() / os.totalmem()) * 100)

// The disk that holds the server folder. null if the system cannot tell.
export async function diskUsagePercent() {
    try {
        const s = await fs.statfs(process.cwd())
        return s.blocks > 0 ? Math.round((1 - s.bavail / s.blocks) * 100) : null
    } catch {
        return null
    }
}

// ---------- Database ----------

export async function databaseInfo() {
    const started = Date.now()
    try {
        const rows = await prisma.$queryRaw<{ size: bigint }[]>`SELECT pg_database_size(current_database()) AS size`
        return { ok: true, latencyMs: Date.now() - started, sizeBytes: Number(rows[0].size) }
    } catch {
        return { ok: false, latencyMs: null, sizeBytes: null }
    }
}

// ---------- Maintenance mode ----------

const MAINTENANCE_KEY = 'maintenance.on'
let cache: { on: boolean; at: number } | null = null

// Remembered for 5 seconds so a busy site does not ask the database on every request
export async function isMaintenanceOn() {
    if (cache && Date.now() - cache.at < 5000) return cache.on
    const row = await prisma.setting.findUnique({ where: { key: MAINTENANCE_KEY } })
    const on = row?.value === 'true'
    cache = { on, at: Date.now() }
    return on
}

export async function setMaintenance(on: boolean) {
    await prisma.setting.upsert({
        where: { key: MAINTENANCE_KEY },
        update: { value: String(on) },
        create: { key: MAINTENANCE_KEY, value: String(on) },
    })
    cache = { on, at: Date.now() }
}
