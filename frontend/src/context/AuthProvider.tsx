// // import { useState } from 'react'
// // import type { ReactNode } from 'react'
// // import { AuthContext } from './auth-context'
// // import type { Role, User } from './auth-context'

// // const nameFromEmail = (email: string) =>
// //     email
// //         .split('@')[0]
// //         .split(/[._-]/)
// //         .filter(Boolean)
// //         .map((p) => p[0].toUpperCase() + p.slice(1))
// //         .join(' ') || 'Student'

// // const STORAGE_KEY = 'uhwf_user'

// // // MOCK users: replace with a real API response when the backend is ready.
// // const mockUsers: Record<Role, User> = {
// //     admin: { name: 'System Admin', email: 'admin@uhwf.or.tz', role: 'admin' },
// //     student: { name: 'Student User', email: 'student@uhwf.or.tz', role: 'student' },
// //     lecturer: { name: 'Lecturer User', email: 'lecturer@uhwf.or.tz', role: 'lecturer' },
// //     employee: { name: 'Employee User', email: 'employee@uhwf.or.tz', role: 'employee' },
// //     ict: { name: 'ICT Officer', email: 'helpdesk@uhwf.or.tz', role: 'ict' },
// // }

// // const readStoredUser = (): User | null => {
// //     try {
// //         const raw = localStorage.getItem(STORAGE_KEY)
// //         return raw ? (JSON.parse(raw) as User) : null
// //     } catch {
// //         return null
// //     }
// // }

// // export const AuthProvider = ({ children }: { children: ReactNode }) => {
// //     const [user, setUser] = useState<User | null>(readStoredUser)

// //     // const login = (role: Role = 'admin') => {
// //     //     const next = mockUsers[role]
// //     //     setUser(next)
// //     //     try {
// //     //         localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
// //     //     } catch {
// //     //         /* storage unavailable: keep the session in memory only */
// //     //     }
// //     // }
// //     const login = (role: Role = 'admin', email?: string) => {
// //         const base = mockUsers[role]
// //         const next: User =
// //             role === 'admin' || !email ? base : { ...base, email, name: nameFromEmail(email) }
// //         setUser(next)
// //         try {
// //             localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
// //         } catch {
// //             /* storage unavailable: keep the session in memory only */
// //         }
// //     }

// //     const logout = () => {
// //         setUser(null)
// //         try {
// //             localStorage.removeItem(STORAGE_KEY)
// //         } catch {
// //             /* ignore */
// //         }
// //     }

// //     return (
// //         <AuthContext.Provider value={{ user, login, logout }}>
// //             {children}
// //         </AuthContext.Provider>
// //     )
// // }
// import { useEffect, useState } from 'react'
// import type { ReactNode } from 'react'
// import { AuthContext } from './auth-context'
// import type { User } from './auth-context'
// import { api } from '../services/api'

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//     const [user, setUser] = useState<User | null>(null)
//     const [loading, setLoading] = useState(true)

//     // On every page load, ask the server who is signed in (the cookie holds the session).
//     useEffect(() => {
//         api
//             .get<{ user: User }>('/auth/me')
//             .then((res) => setUser(res.data.user))
//             .catch(() => setUser(null))
//             .finally(() => setLoading(false))
//     }, [])

//     const login = async (identifier: string, password: string) => {
//         const res = await api.post<{ user: User }>('/auth/login', { identifier, password })
//         setUser(res.data.user)
//         return res.data.user
//     }

//     const logout = async () => {
//         try {
//             await api.post('/auth/logout')
//         } finally {
//             setUser(null)
//         }
//     }

//     return (
//         <AuthContext.Provider value={{ user, loading, login, logout }}>
//             {children}
//         </AuthContext.Provider>
//     )
// }
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './auth-context'
import type { User } from './auth-context'
import { api } from '../services/api'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // On every page load, ask the server who is signed in (the cookie holds the session).
    useEffect(() => {
        api
            .get<{ user: User }>('/auth/me')
            .then((res) => setUser(res.data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false))
    }, [])

    const login = async (identifier: string, password: string) => {
        const res = await api.post<{ user: User }>('/auth/login', { identifier, password })
        setUser(res.data.user)
        return res.data.user
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } finally {
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser: setUser }}>
            {children}
        </AuthContext.Provider>
    )
}