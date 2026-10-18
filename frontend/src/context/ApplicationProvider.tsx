// import { useEffect, useState } from 'react'
// import { Outlet } from 'react-router-dom'
// import { ApplicationContext, emptyApplication } from './application-context'
// import type { Application } from './application-context'
// import { useAuth } from '../hooks/useAuth'

// const read = (key: string): Application => {
//     try {
//         const raw = localStorage.getItem(key)
//         if (!raw) return emptyApplication
//         const saved = JSON.parse(raw) as Partial<Application>
//         return {
//             ...emptyApplication,
//             ...saved,
//             personal: { ...emptyApplication.personal, ...saved.personal },
//             docs: { ...emptyApplication.docs, ...saved.docs },
//         }
//     } catch {
//         return emptyApplication
//     }
// }

// // Wraps all student pages so the sidebar and the pages share one application.
// export const ApplicationProvider = () => {
//     const { user } = useAuth()
//     const key = `uhwf_application_${user?.email ?? 'guest'}`
//     const [app, setApp] = useState<Application>(() => read(key))

//     // MOCK storage: the backend will save the application in the database instead.
//     useEffect(() => {
//         try {
//             localStorage.setItem(key, JSON.stringify(app))
//         } catch {
//             /* storage unavailable: keep it in memory only */
//         }
//     }, [key, app])

//     const update = (patch: Partial<Application>) =>
//         setApp((prev) => ({ ...prev, ...patch }))
//     const reset = () => setApp(emptyApplication)

//     return (
//         <ApplicationContext.Provider value={{ app, update, reset }}>
//             <Outlet />
//         </ApplicationContext.Provider>
//     )
// }
import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ApplicationContext } from './application-context'
import type { ApplicationData, DocKey, Personal } from './application-context'
import { api, getErrorMessage } from '../services/api'

type Reply = { application: ApplicationData }

// Wraps all student pages so the sidebar and the pages share one application, loaded from the server.
export const ApplicationProvider = () => {
    const [app, setApp] = useState<ApplicationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const reload = useCallback(async () => {
        try {
            const res = await api.get<Reply>('/application')
            setApp(res.data.application)
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load your application.'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void reload()
    }, [reload])

    // Errors are thrown on purpose: the form that called the action shows the message.
    const keep = (res: { data: Reply }) => {
        setApp(res.data.application)
        return res.data.application
    }

    const value = {
        app,
        loading,
        error,
        reload,
        savePersonal: async (p: Personal) => keep(await api.put<Reply>('/application/personal', p)),
        pay: async (method: string) => keep(await api.post<Reply>('/application/payment', { method })),
        saveCourses: async (codes: string[]) => keep(await api.put<Reply>('/application/courses', { codes })),
        uploadDocument: async (type: DocKey, file: File) => {
            const body = new FormData()
            body.append('file', file)
            return keep(await api.post<Reply>(`/application/documents/${type}`, body))
        },
        submit: async () => keep(await api.post<Reply>('/application/submit')),
    }

    return (
        <ApplicationContext.Provider value={value}>
            <Outlet />
        </ApplicationContext.Provider>
    )
}
