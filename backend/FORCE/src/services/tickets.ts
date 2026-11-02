import type { Prisma, Role } from '@prisma/client'
import { prisma } from '../prisma'

export const ticketInclude = {
    requester: { select: { id: true, fullName: true, email: true, role: true } },
    assignedTo: { select: { id: true, fullName: true } },
    comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, fullName: true, role: true } } },
    },
} satisfies Prisma.SupportTicketInclude

type TicketWithDetail = Prisma.SupportTicketGetPayload<{ include: typeof ticketInclude }>

// A person can open their own reports. ICT can open all of them. Anyone else gets "not found",
// so nobody can find out whether a report with a given number exists.
export async function findTicketFor(id: number, viewer: { id: number; role: Role }) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id }, include: ticketInclude })
    if (!ticket) return null
    if (viewer.role !== 'ict' && ticket.requesterId !== viewer.id) return null
    return ticket
}

// Internal notes are private to ICT: the person who reported the problem never receives them.
export function toTicketDetail(t: TicketWithDetail, viewerRole: Role) {
    return {
        id: t.id,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        createdAt: t.createdAt,
        resolvedAt: t.resolvedAt,
        requester: t.requester,
        assignedTo: t.assignedTo,
        comments: t.comments
            .filter((c) => viewerRole === 'ict' || !c.isInternal)
            .map((c) => ({
                id: c.id,
                body: c.body,
                isInternal: c.isInternal,
                createdAt: c.createdAt,
                author: c.author,
            })),
    }
}

// Tells every active ICT user (except `exceptUserId`) that something needs their attention.
export async function notifyIct(title: string, body: string, exceptUserId: number) {
    const icts = await prisma.user.findMany({
        where: { role: 'ict', status: 'active', id: { not: exceptUserId } },
        select: { id: true },
    })
    if (icts.length === 0) return
    await prisma.notification.createMany({
        data: icts.map((u) => ({ userId: u.id, type: 'ticket', title, body, linkUrl: '/ict/tickets' })),
    })
}
