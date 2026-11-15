import { Prisma } from '@prisma/client'

type Tx = Prisma.TransactionClient
export type StaffKind = 'employee' | 'lecturer'

// To change the look of the numbers, change these two lines only.
const PREFIX: Record<StaffKind, string> = { employee: 'EMP', lecturer: 'LEC' }
const WIDTH = 4 // EMP-0001

// The next free number: the highest EMP-/LEC- number already used, plus one.
// IDs typed by hand in another format are ignored by the counter.
export async function nextStaffId(tx: Tx, kind: StaffKind): Promise<string> {
    const prefix = PREFIX[kind]
    const where = { staffId: { startsWith: `${prefix}-` } }
    const rows =
        kind === 'employee'
            ? await tx.employeeProfile.findMany({ where, select: { staffId: true } })
            : await tx.lecturerProfile.findMany({ where, select: { staffId: true } })

    const pattern = new RegExp(`^${prefix}-(\\d+)$`)
    let max = 0
    for (const r of rows) {
        const m = pattern.exec(r.staffId)
        if (m) max = Math.max(max, Number(m[1]))
    }
    return `${prefix}-${String(max + 1).padStart(WIDTH, '0')}`
}

// Two people created at the same moment can be given the same number. The database refuses the
// second one, and the caller tries again with the next number.
export const isStaffIdClash = (err: unknown) =>
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002' &&
    String(err.meta?.target ?? '').toLowerCase().includes('staffid')