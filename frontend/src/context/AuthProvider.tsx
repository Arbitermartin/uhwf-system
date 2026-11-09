
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
//         <AuthContext.Provider value={{ user, loading, login, logout, updateUser: setUser }}>
//             {children}
//         </AuthContext.Provider>
//     )
// }
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './auth-context'
import type { User } from './auth-context'
import { api } from '../services/api'
import { useIdleTimeout } from '../hooks/useIdleTimeout'
import { IdleWarning } from '../components/IdleWarning'

const IDLE_MS = 2 * 60 * 1000
const WARN_MS = 30 * 1000

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api
            .get<{ user: User }>('/auth/me')
            .then((res) => setUser(res.data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false))
    }, [])

    // Sign out in one tab = sign out in all tabs
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'uhwf_logout') {
                setUser(null)
                window.location.replace('/login')
            }
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const login = async (identifier: string, password: string) => {
        const res = await api.post<{ user: User }>('/auth/login', { identifier, password })
        setUser(res.data.user)
        return res.data.user
    }

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout')
        } finally {
            setUser(null)
            try { localStorage.setItem('uhwf_logout', String(Date.now())) } catch { /* ignore */ }
            window.location.replace('/login')
        }
    }, [])

    const { warning, secondsLeft, stay } = useIdleTimeout({
        enabled: !!user,
        idleMs: IDLE_MS,
        warnMs: WARN_MS,
        onTimeout: logout,
    })

    const handleStay = () => {
        stay()
        api.get('/auth/me').catch(() => logout())
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser: setUser }}>
            {children}
            {user && warning && (
                <IdleWarning secondsLeft={secondsLeft} onStay={handleStay} onLogout={logout} />
            )}
        </AuthContext.Provider>
    )
}