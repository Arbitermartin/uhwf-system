import type { ReactNode } from 'react'
import BackupsPanel from './panels/BackupsPanel'
import LogsPanel from './panels/LogsPanel'
import TicketsPanel from './panels/TicketsPanel'

const Page = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
    <div className="mx-auto max-w-5xl space-y-4">
        <div>
            <h1 className="text-2xl font-bold text-green-950">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        {children}
    </div>
)

export const IctTicketsPage = () => (
    <Page title="Support tickets" subtitle="Problems reported by students, lecturers and staff.">
        <TicketsPanel pageSize={10} />
    </Page>
)

export const IctLogsPage = () => (
    <Page title="System logs" subtitle="Sign-ins, changes made by administrators, backups and errors.">
        <LogsPanel pageSize={20} />
    </Page>
)

export const IctBackupsPage = () => (
    <Page title="Backup and restore" subtitle="Database backups made by hand or automatically.">
        <BackupsPanel />
    </Page>
)
