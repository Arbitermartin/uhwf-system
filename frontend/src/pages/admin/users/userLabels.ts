import type { Role } from '../../../context/auth-context'
import type { UserStatus } from '../../../services/users'

export const roleLabel: Record<Role, string> = {
    admin: 'Administrator',
    lecturer: 'Lecturer',
    student: 'Student',
    employee: 'Employee',
    ict: 'ICT',
}

export const roleTag: Record<Role, string> = {
    admin: 'bg-purple-100 text-purple-900',
    lecturer: 'bg-amber-100 text-amber-900',
    student: 'bg-green-100 text-green-900',
    employee: 'bg-lime-100 text-lime-900',
    ict: 'bg-sky-100 text-sky-900',
}

export const statusTag: Record<UserStatus, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-amber-100 text-amber-900',
    suspended: 'bg-red-100 text-red-800',
}

export const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

export const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('')