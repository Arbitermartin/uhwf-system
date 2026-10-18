import axios from 'axios'

export const api = axios.create({ baseURL: '/api', withCredentials: true })

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