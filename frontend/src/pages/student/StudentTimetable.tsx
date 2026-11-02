// import { useEffect, useState } from 'react'
// import TimetableView from '../../components/TimetableView'
// import { getErrorMessage } from '../../services/api'
// import { getMyTimetable } from '../../services/student'
// import type { Slot } from '../../services/timetable'

// const StudentTimetable = () => {
//     const [slots, setSlots] = useState<Slot[] | null>(null)
//     const [error, setError] = useState('')

//     useEffect(() => {
//         let cancelled = false
//         getMyTimetable()
//             .then((s) => {
//                 if (!cancelled) setSlots(s)
//             })
//             .catch((err) => {
//                 if (!cancelled) setError(getErrorMessage(err, 'Could not load your timetable.'))
//             })
//         return () => {
//             cancelled = true
//         }
//     }, [])

//     return (
//         <div className="mx-auto max-w-3xl space-y-4">
//             <div>
//                 <h1 className="text-2xl font-bold text-green-950">Timetable</h1>
//                 <p className="text-sm text-gray-500">Your weekly classes. Times are set by your lecturers.</p>
//             </div>

//             {error && (
//                 <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
//                     {error}
//                 </p>
//             )}
//             {!slots && !error && <p className="py-8 text-center text-sm text-gray-500">Loading your timetable...</p>}
//             {slots && (
//                 <TimetableView
//                     slots={slots}
//                     showLecturer
//                     emptyText="No class times have been set yet for your courses. Your lecturers add them, and they will appear here."
//                 />
//             )}
//         </div>
//     )
// }

// export default StudentTimetable

import { useEffect, useState } from 'react'
import TimetableView from '../../components/TimetableView'
import { getErrorMessage } from '../../services/api'
import { getMyTimetable } from '../../services/student'
import type { Slot } from '../../services/timetable'

const StudentTimetable = () => {
    const [slots, setSlots] = useState<Slot[] | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        getMyTimetable()
            .then((s) => {
                if (!cancelled) setSlots(s)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load your timetable.'))
            })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">Timetable</h1>
                <p className="text-sm text-gray-500">Your weekly classes. Times are set by your lecturers.</p>
            </div>

            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            {!slots && !error && <p className="py-8 text-center text-sm text-gray-500">Loading your timetable...</p>}
            {slots && (
                <TimetableView
                    slots={slots}
                    showLecturer
                    emptyText="No class times have been set yet for your courses. Your lecturers add them, and they will appear here."
                />
            )}
        </div>
    )
}

export default StudentTimetable
