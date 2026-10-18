import type { ApplicationStatus } from '../../../context/application-context'
import type { PayState } from '../../../services/applications'

export const statusLabel: Record<ApplicationStatus, string> = {
    draft: 'In progress',
    submitted: 'Needs review',
    approved: 'Approved',
    rejected: 'Rejected',
}

export const statusTag: Record<ApplicationStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-amber-100 text-amber-900',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
}

export const payLabel: Record<PayState, string> = {
    none: 'Not paid',
    pending: 'Pending',
    paid: 'Paid',
}

export const payTag: Record<PayState, string> = {
    none: 'bg-gray-100 text-gray-700',
    pending: 'bg-amber-100 text-amber-900',
    paid: 'bg-green-100 text-green-800',
}

export const money = (n: number) => `TZS ${n.toLocaleString('en-US')}`
