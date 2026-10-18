import { useContext } from 'react'
import { ApplicationContext } from '../context/application-context'

export const useApplication = () => {
    const ctx = useContext(ApplicationContext)
    if (!ctx) throw new Error('useApplication must be used inside student routes')
    return ctx
}