// // import { Navigate, Outlet } from 'react-router-dom'
// // import { useAuth } from '../hooks/useAuth'
// // import type { Role } from '../context/auth-context'

// // const ProtectedRoute = ({ roles }: { roles?: Role[] }) => {
// //     const { user } = useAuth()

// //     if (!user) return <Navigate to="/login" replace />
// //     if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

// //     return <Outlet />
// // }

// // export default ProtectedRoute
// import { Navigate, Outlet } from 'react-router-dom'
// import { useAuth } from '../hooks/useAuth'
// import type { Role } from '../context/auth-context'

// const ProtectedRoute = ({ roles }: { roles?: Role[] }) => {
//     const { user, loading } = useAuth()

//     // Wait for the server to answer, otherwise a refresh would bounce you to /login
//     if (loading) {
//         return (
//             <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
//                 Loading...
//             </div>
//         )
//     }
//     if (!user) return <Navigate to="/login" replace />
//     if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

//     return <Outlet />
// }

// export default ProtectedRoute
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../context/auth-context'

const ProtectedRoute = ({ roles }: { roles?: Role[] }) => {
    const { user, loading } = useAuth()
    const location = useLocation()

    // Wait for the server to answer, otherwise a refresh would bounce you to /login
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
                Loading...
            </div>
        )
    }
    if (!user) return <Navigate to="/login" replace />

    // Someone with a temporary password can only see the change-password page
    if (user.mustChangePassword && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />
    }

    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

    return <Outlet />
}

export default ProtectedRoute