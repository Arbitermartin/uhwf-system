// import type { Application, DocKey } from '../context/application-context'

// export const stageTitles = [
//     'Self registration',
//     'Payment',
//     'Choose courses',
//     'Requirements',
//     'Submit and approval',
// ]

// export const docList: { key: DocKey; label: string }[] = [
//     { key: 'photo', label: 'Passport-size photo' },
//     { key: 'id', label: 'National ID or passport' },
//     { key: 'cert', label: 'Academic certificates' },
//     { key: 'birth', label: 'Birth certificate' },
// ]

// // A stage is "done" because of the data, so the stages can never get out of sync.
// export const getDone = (a: Application): boolean[] => [
//     Object.values(a.personal).every((v) => v.trim() !== ''),
//     a.paid,
//     a.courses.length > 0,
//     docList.every((d) => a.docs[d.key] !== ''),
//     a.submitted,
// ]

// export const getCurrent = (done: boolean[]) => {
//     const i = done.findIndex((d) => !d)
//     return i === -1 ? done.length : i
// }
import type { ApplicationData, DocKey } from '../context/application-context'

export const stageTitles = [
    'Self registration',
    'Payment',
    'Choose courses',
    'Requirements',
    'Submit and approval',
]

export const docList: { key: DocKey; label: string }[] = [
    { key: 'photo', label: 'Passport-size photo' },
    { key: 'id', label: 'National ID or passport' },
    { key: 'cert', label: 'Academic certificates' },
    { key: 'birth', label: 'Birth certificate' },
]

// A stage is "done" because of the data, so the stages can never get out of sync.
export const getDone = (a: ApplicationData): boolean[] => [
    Object.values(a.personal).every((v) => v.trim() !== ''),
    a.payment.status === 'paid',
    a.courses.length > 0,
    docList.every((d) => a.documents[d.key] !== ''),
    a.status !== 'draft',
]

export const getCurrent = (done: boolean[]) => {
    const i = done.findIndex((d) => !d)
    return i === -1 ? done.length : i
}
