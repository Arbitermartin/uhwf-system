// import axios from 'axios'

// // export const api = axios.create({ baseURL: '/api', withCredentials: true })

// export const api = axios.create({
//     baseURL: '/api',
//     withCredentials: true,
// })
// // export const api = axios.create({
// //     baseURL: import.meta.env.VITE_API_URL,
// //     withCredentials: true,
// // })


// export const getErrorMessage = (
//     err: unknown,
//     fallback = 'Something went wrong. Please try again.',
// ) => {
//     if (axios.isAxiosError(err)) {
//         const message = (err.response?.data as { message?: string } | undefined)?.message
//         if (message) return message
//         if (!err.response) return 'Cannot reach the server. Is the backend running?'
//     }
//     return fallback
// }

// // Field-by-field messages from the server (for example { email: 'Enter a valid email address.' })
// export const getFieldErrors = (err: unknown): Record<string, string> => {
//     if (axios.isAxiosError(err)) {
//         const errors = (err.response?.data as { errors?: Record<string, string> } | undefined)?.errors
//         if (errors) return errors
//     }
//     return {}
// }
// export async function getHealth() {
//     const res = await api.get('/health')
//     return res.data
// }
// export async function getAdmissions() {
//     const res = await api.get("/admissions")
//     return res.data
// }
import axios from 'axios'

export const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
})

// NEW: some hosts block PATCH, PUT and DELETE. Send them as POST and say which method is meant.
// The backend (app.ts) turns them back into the real method before any route runs.
// api.interceptors.request.use((config) => {
//     const method = config.method?.toUpperCase()
//     if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
//         config.method = 'post'
//         config.headers.set('X-HTTP-Method-Override', method)
//     }
//     return config
// })
api.interceptors.request.use((config) => {
    const method = config.method?.toUpperCase()
    if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
        config.method = 'post'
        config.headers.set('X-HTTP-Method-Override', method)
    }
    if (config.method === 'get') {
        config.params = { ...config.params, _t: Date.now() }
    }
    return config
})

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const url: string = err.config?.url ?? ''
        const isAuthCall = url.startsWith('/auth/login') || url.startsWith('/auth/me')
        if (axios.isAxiosError(err) && err.response?.status === 401 && !isAuthCall) {
            if (window.location.pathname !== '/login') window.location.replace('/login')
        }
        return Promise.reject(err)
    },
)

export const getErrorMessage = (
    err: unknown,
    fallback = 'Something went wrong. Please try again.',
) => {
    if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { message?: string } | undefined)?.message
        if (message) return message
        if (!err.response) return 'Cannot reach the server. Is the backend running?'
    }
    return fallback
}

// Field-by-field messages from the server (for example { email: 'Enter a valid email address.' })
export const getFieldErrors = (err: unknown): Record<string, string> => {
    if (axios.isAxiosError(err)) {
        const errors = (err.response?.data as { errors?: Record<string, string> } | undefined)?.errors
        if (errors) return errors
    }
    return {}
}

export async function getHealth() {
    const res = await api.get('/health')
    return res.data
}

export async function getAdmissions() {
    const res = await api.get('/admissions')
    return res.data
}
