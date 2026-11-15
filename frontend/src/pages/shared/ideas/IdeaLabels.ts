import type { IdeaStatus, Recommendation } from '../../../services/ideas'

export const statusLabel: Record<IdeaStatus, string> = {
    submitted: 'Submitted',
    under_review: 'Under review',
    needs_info: 'Needs more info',
    approved: 'Approved',
    not_selected: 'Not selected',
}

export const statusTag: Record<IdeaStatus, string> = {
    submitted: 'bg-sky-100 text-sky-900',
    under_review: 'bg-amber-100 text-amber-900',
    needs_info: 'bg-purple-100 text-purple-900',
    approved: 'bg-green-100 text-green-800',
    not_selected: 'bg-gray-100 text-gray-700',
}

// the four steps of the progress line, and which one an idea has reached
export const steps = ['Submitted', 'Under review', 'Feedback', 'Decision']
export const stepReached: Record<IdeaStatus, number> = { submitted: 0, under_review: 1, needs_info: 2, approved: 3, not_selected: 3 }

export const reviewerRoleLabel: Record<string, string> = { admin: 'Administrator', ict: 'ICT', employee: 'Employee' }

export const reviewerRoleTag: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-900',
    ict: 'bg-sky-100 text-sky-900',
    employee: 'bg-green-100 text-green-800',
}

export const recLabel: Record<Recommendation, string> = { support: 'Support', needs_work: 'Needs work', not_now: 'Not now' }

export const recTag: Record<Recommendation, string> = {
    support: 'bg-green-100 text-green-800',
    needs_work: 'bg-amber-100 text-amber-900',
    not_now: 'bg-gray-100 text-gray-700',
}

export const when = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Dar_es_Salaam' })

export const REVIEWER_ROLES = ['admin', 'ict', 'employee']
