import type { Role } from '../context/auth-context'

// Where each role lands after signing in
export const roleHome: Record<Role, string> = {
    admin: '/admin',
    lecturer: '/lecturer',
    student: '/student',
    employee: '/employee',
    ict: '/ict',
}