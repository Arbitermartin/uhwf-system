
// import { createContext } from 'react'

// export type Role = 'student' | 'lecturer' | 'employee' | 'ict' | 'admin'

// export type User = {
//     id: number
//     name: string
//     email: string
//     role: Role
//     photo?: string
// }

// export type AuthContextValue = {
//     user: User | null
//     loading: boolean
//     login: (identifier: string, password: string) => Promise<User>
//     logout: () => Promise<void>
// }

// export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
import { createContext } from 'react'

export type Role = 'student' | 'lecturer' | 'employee' | 'ict' | 'admin'

export type User = {
    id: number
    name: string
    email: string
    role: Role
    photo?: string
    // true while the person is still using a temporary password
    mustChangePassword: boolean
}

export type AuthContextValue = {
    user: User | null
    loading: boolean
    login: (identifier: string, password: string) => Promise<User>
    logout: () => Promise<void>
    // replaces the signed-in user, for example after the password was changed
    updateUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)