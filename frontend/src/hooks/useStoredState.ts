import { useEffect, useState } from 'react'

// Like useState, but remembers the value in the browser.
// MOCK storage: with the backend, this data is saved in the database instead.
export function useStoredState<T>(key: string, initial: T) {
    const [value, setValue] = useState<T>(() => {
        try {
            const raw = localStorage.getItem(key)
            return raw ? (JSON.parse(raw) as T) : initial
        } catch {
            return initial
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch {
            /* storage unavailable: keep it in memory only */
        }
    }, [key, value])

    return [value, setValue] as const
}