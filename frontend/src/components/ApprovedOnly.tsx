import { Navigate, Outlet } from 'react-router-dom'
import { useApplication } from '../hooks/useApplication'

// Blocks pages that unlock only after the administrator approves the application.
const ApprovedOnly = () => {
    const { app, loading } = useApplication()

    if (!app && loading) {
        return <p className="py-16 text-center text-sm text-gray-500">Loading...</p>
    }
    return app?.status === 'approved' ? <Outlet /> : <Navigate to="/student/application" replace />
}

export default ApprovedOnly
