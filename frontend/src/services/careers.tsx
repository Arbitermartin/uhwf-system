import { api } from './api'

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship'
export type JobStatus = 'open' | 'closed'
export type ApplicationStatus = 'received' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'

export const jobTypes: JobType[] = ['full_time', 'part_time', 'contract', 'internship']

export const jobTypeLabel: Record<JobType, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    internship: 'Internship',
}

export const applicationStatuses: ApplicationStatus[] = ['received', 'reviewing', 'shortlisted', 'hired', 'rejected']

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
    received: 'Received',
    reviewing: 'Reviewing',
    shortlisted: 'Shortlisted',
    hired: 'Hired',
    rejected: 'Rejected',
}

/* ============================ Admin ============================ */

export type AdminJob = {
    id: number
    title: string
    location: string
    jobType: JobType
    status: JobStatus
    deadline: string | null
    closesOn: string // yyyy-mm-dd, or "" when there is no closing date
    expired: boolean // open, but the closing date has passed
    createdAt: string
    postedBy: string
    applications: { total: number; received: number }
}

export type AdminJobFull = AdminJob & { description: string }

export type JobList = {
    jobs: AdminJob[]
    total: number
    page: number
    pageSize: number
    counts: { all: number; open: number; closed: number }
}

export type JobInput = {
    title: string
    location: string
    jobType: JobType
    description: string
    deadline: string
    open: boolean
}

export type JobApplicationRow = {
    id: number
    fullName: string
    email: string
    phone: string | null
    coverNote: string | null
    status: ApplicationStatus
    createdAt: string
}

export const listJobs = async (params: { status?: JobStatus; search?: string; page: number; pageSize: number }) =>
    (await api.get<JobList>('/admin/jobs', { params })).data

export const getJob = async (id: number) => (await api.get<{ job: AdminJobFull }>(`/admin/jobs/${id}`)).data.job

export const createJob = async (data: JobInput) => (await api.post<{ job: AdminJobFull }>('/admin/jobs', data)).data.job

export const updateJob = async (id: number, data: JobInput) =>
    (await api.patch<{ job: AdminJobFull }>(`/admin/jobs/${id}`, data)).data.job

export const setJobOpen = async (id: number, open: boolean) => {
    await api.post(`/admin/jobs/${id}/status`, { open })
}

export const deleteJob = async (id: number) => {
    await api.delete(`/admin/jobs/${id}`)
}

export const listApplications = async (jobId: number) =>
    (await api.get<{ job: { id: number; title: string }; applications: JobApplicationRow[] }>(`/admin/jobs/${jobId}/applications`)).data

export const setApplicationStatus = async (applicationId: number, status: ApplicationStatus) => {
    await api.patch(`/admin/jobs/applications/${applicationId}`, { status })
}

// A normal link: the browser downloads the PDF, and the login cookie proves it is an administrator.
export const cvLink = (applicationId: number) => `/api/admin/jobs/applications/${applicationId}/cv`

/* ============================ Public ============================ */

export type PublicJob = {
    id: number
    title: string
    location: string
    jobType: JobType
    description: string
    closesOn: string | null
    postedAt: string
}

export const listPublicJobs = async () => (await api.get<{ jobs: PublicJob[] }>('/public/jobs')).data.jobs

export const applyForJob = async (jobId: number, form: FormData) =>
    (await api.post<{ message: string }>(`/public/jobs/${jobId}/apply`, form, { timeout: 60_000 })).data.message

// Tanzania time, whatever the visitor's own time zone is
export const closesText = (day: string) =>
    new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
