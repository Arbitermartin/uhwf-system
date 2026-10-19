import type { TicketPriority, TicketStatus } from '../../services/tickets'

export const priorityLabel: Record<TicketPriority, string> = { low: 'Low', medium: 'Medium', high: 'High' }

export const priorityTag: Record<TicketPriority, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-900',
    high: 'bg-red-100 text-red-800',
}

export const ticketStatusLabel: Record<TicketStatus, string> = { open: 'Open', resolved: 'Resolved' }

export const ticketStatusTag: Record<TicketStatus, string> = {
    open: 'bg-amber-100 text-amber-900',
    resolved: 'bg-green-100 text-green-800',
}

export const timeAgo = (iso: string) => {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} h ago`
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const dateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
