import { api } from './api'
import type { Role } from '../context/auth-context'

export type TicketPriority = 'low' | 'medium' | 'high'
export type TicketStatus = 'open' | 'resolved'

export const ticketCategories = [
    'Login or password',
    'Application or payment',
    'Courses or grades',
    'Website problem',
    'Other',
] as const
export type TicketCategory = (typeof ticketCategories)[number]

export type TicketComment = {
    id: number
    body: string
    isInternal: boolean
    createdAt: string
    author: { id: number; fullName: string; role: Role }
}

export type TicketDetail = {
    id: number
    subject: string
    category: string
    priority: TicketPriority
    status: TicketStatus
    createdAt: string
    resolvedAt: string | null
    requester: { id: number; fullName: string; email: string; role: Role }
    assignedTo: { id: number; fullName: string } | null
    comments: TicketComment[]
}

export type MyTicket = {
    id: number
    subject: string
    category: string
    priority: TicketPriority
    status: TicketStatus
    createdAt: string
    resolvedAt: string | null
    comments: number
}

export type NewTicket = {
    subject: string
    description: string
    priority: TicketPriority
    category: TicketCategory
}

export const createTicket = async (data: NewTicket) =>
    (await api.post<{ ticket: TicketDetail }>('/tickets', data)).data.ticket

export const listMyTickets = async () => (await api.get<{ tickets: MyTicket[] }>('/tickets/mine')).data.tickets

export const getTicket = async (id: number) => (await api.get<{ ticket: TicketDetail }>(`/tickets/${id}`)).data.ticket

export const addTicketComment = async (id: number, body: string, isInternal = false) =>
    (await api.post<{ ticket: TicketDetail }>(`/tickets/${id}/comments`, { body, isInternal })).data.ticket
