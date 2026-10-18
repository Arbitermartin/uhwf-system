// import { createContext } from 'react'

// export type Personal = {
//     dob: string
//     gender: string
//     nationality: string
//     phone: string
//     region: string
//     kinName: string
//     kinPhone: string
// }

// export type DocKey = 'photo' | 'id' | 'cert' | 'birth'

// export type Application = {
//     personal: Personal
//     paid: boolean
//     method: string
//     courses: string[] // course codes
//     docs: Record<DocKey, string> // uploaded file name, '' = not uploaded
//     submitted: boolean
//     approved: boolean
// }

// export const emptyApplication: Application = {
//     personal: {
//         dob: '',
//         gender: '',
//         nationality: 'Tanzanian',
//         phone: '',
//         region: '',
//         kinName: '',
//         kinPhone: '',
//     },
//     paid: false,
//     method: '',
//     courses: [],
//     docs: { photo: '', id: '', cert: '', birth: '' },
//     submitted: false,
//     approved: false,
// }

// export type ApplicationContextValue = {
//     app: Application
//     update: (patch: Partial<Application>) => void
//     reset: () => void
// }

// export const ApplicationContext = createContext<ApplicationContextValue | undefined>(undefined)
import { createContext } from 'react'

export type DocKey = 'photo' | 'id' | 'cert' | 'birth'
export type ApplicationStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export type Personal = {
    dob: string // yyyy-mm-dd
    gender: '' | 'female' | 'male'
    nationality: string
    phone: string
    region: string
    kinName: string
    kinPhone: string
}

export type CatalogCourse = { code: string; title: string; credits: number }

// Everything about the student's application, as the server sends it.
export type ApplicationData = {
    id: number
    intake: string
    status: ApplicationStatus
    fee: number
    maxCourses: number
    personal: Personal
    payment: {
        status: 'none' | 'pending' | 'paid'
        method: string
        reference: string | null
        amount: number
    }
    courses: string[] // course codes
    catalog: CatalogCourse[]
    documents: Record<DocKey, string> // uploaded file name, '' = not uploaded
    submittedAt: string | null
    reviewNote: string | null
}

export type ApplicationContextValue = {
    app: ApplicationData | null
    loading: boolean
    error: string
    reload: () => Promise<void>
    // Each action saves on the server and returns the updated application.
    savePersonal: (p: Personal) => Promise<ApplicationData>
    pay: (method: string) => Promise<ApplicationData>
    saveCourses: (codes: string[]) => Promise<ApplicationData>
    uploadDocument: (type: DocKey, file: File) => Promise<ApplicationData>
    submit: () => Promise<ApplicationData>
}

export const ApplicationContext = createContext<ApplicationContextValue | undefined>(undefined)
