import { api } from './api'
import type { ApplicationStatus } from '../context/application-context'
import type { PayState } from './applications'

export type AdminDashboardData = {
    stats: {
        totalUsers: number
        newUsersThisMonth: number
        students: number
        newStudentsThisMonth: number
        lecturers: number
        newLecturersThisMonth: number
        courses: number
        needsReview: number
        pendingPayments: number
    }
    // last 6 months, oldest first. month looks like "2026-10"
    registrations: { month: string; count: number }[]
    roles: { students: number; lecturers: number; employees: number; staff: number }
    recent: {
        id: number
        status: ApplicationStatus
        submittedAt: string | null
        student: { name: string; email: string }
        paymentStatus: PayState
    }[]
}

export const getAdminDashboard = async () =>
    (await api.get<AdminDashboardData>('/admin/dashboard')).data
