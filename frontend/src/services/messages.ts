import { api } from './api'

export type MessageRow = {
    id: number
    name: string
    email: string
    subject: string
    preview: string
    isRead: boolean
    createdAt: string
}

export type MessageList = {
    messages: MessageRow[]
    total: number
    page: number
    pageSize: number
    counts: { all: number; unread: number; read: number }
}

export type MessageFull = {
    id: number
    name: string
    email: string
    phone: string | null
    subject: string
    message: string
    isRead: boolean
    createdAt: string
}

export const listMessages = async (params: {
    status?: 'unread' | 'read'
    search?: string
    page: number
    pageSize: number
}) => (await api.get<MessageList>('/admin/messages', { params })).data

export const getMessage = async (id: number) =>
    (await api.get<{ message: MessageFull }>(`/admin/messages/${id}`)).data.message

export const setMessageRead = async (id: number, isRead: boolean) => {
    await api.patch(`/admin/messages/${id}`, { isRead })
}

export const deleteMessage = async (id: number) => {
    await api.delete(`/admin/messages/${id}`)
}
