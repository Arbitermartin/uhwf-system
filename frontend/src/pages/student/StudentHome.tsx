// import { Link } from 'react-router-dom'
// import { FaBook, FaCreditCard, FaFileAlt, FaArrowRight } from 'react-icons/fa'
// import { useAuth } from '../../hooks/useAuth'
// import { useApplication } from '../../hooks/useApplication'
// import { catalog } from '../../data/courses'
// import { docList, getCurrent, getDone, stageTitles } from '../../data/application'

// const StudentHome = () => {
//     const { user } = useAuth()
//     const { app } = useApplication()
//     const done = getDone(app)
//     const current = getCurrent(done)
//     const completed = done.filter(Boolean).length
//     const chosen = catalog.filter((c) => app.courses.includes(c.code))
//     const credits = chosen.reduce((sum, c) => sum + c.credits, 0)
//     const uploaded = docList.filter((d) => app.docs[d.key] !== '').length
//     const firstName = (user?.name ?? '').split(' ')[0]

//     if (app.approved) {
//         return (
//             <div className="mx-auto max-w-4xl space-y-4">
//                 <div>
//                     <h1 className="text-2xl font-bold text-green-950">Welcome, {firstName}</h1>
//                     <p className="text-sm text-gray-500">Your application is approved. You are now a UHWF student.</p>
//                 </div>

//                 <div className="grid gap-4 sm:grid-cols-3">
//                     <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//                         <p className="text-xs text-gray-500">My courses</p>
//                         <p className="text-2xl font-bold text-green-950">{chosen.length}</p>
//                     </div>
//                     <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//                         <p className="text-xs text-gray-500">Total credits</p>
//                         <p className="text-2xl font-bold text-green-950">{credits}</p>
//                     </div>
//                     <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//                         <p className="text-xs text-gray-500">Status</p>
//                         <p className="text-2xl font-bold text-green-700">Active</p>
//                     </div>
//                 </div>

//                 <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                     <h2 className="font-semibold text-green-950">My courses</h2>
//                     <ul className="mt-3 divide-y divide-gray-100">
//                         {chosen.map((c) => (
//                             <li key={c.code} className="flex items-center gap-3 py-2.5 text-sm text-green-950">
//                                 <FaBook className="h-4 w-4 text-green-700" />
//                                 <span>
//                                     <strong className="font-semibold">{c.code}</strong> {c.title}
//                                 </span>
//                                 <span className="ml-auto text-xs text-gray-500">{c.credits} credits</span>
//                             </li>
//                         ))}
//                     </ul>
//                 </section>
//             </div>
//         )
//     }

//     return (
//         <div className="mx-auto max-w-4xl space-y-4">
//             <div>
//                 <h1 className="text-2xl font-bold text-green-950">Welcome, {firstName}</h1>
//                 <p className="text-sm text-gray-500">
//                     Finish your application to unlock your courses, timetable and results.
//                 </p>
//             </div>

//             <section className="rounded-xl border border-amber-300 bg-amber-50 p-5">
//                 <div className="flex flex-wrap items-center justify-between gap-3">
//                     <div>
//                         <p className="font-semibold text-green-950">
//                             {app.submitted ? 'Waiting for approval' : 'Complete your application'}
//                         </p>
//                         <p className="text-sm text-gray-600">
//                             {app.submitted
//                                 ? 'Your application is submitted. An administrator will review it.'
//                                 : `${completed} of 5 stages done. Next: ${stageTitles[Math.min(current, 4)]}.`}
//                         </p>
//                     </div>
//                     <Link
//                         to="/student/application"
//                         className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
//                     >
//                         {app.submitted ? 'View application' : 'Continue application'}
//                         <FaArrowRight className="h-3 w-3" />
//                     </Link>
//                 </div>
//                 <div className="mt-4 h-1.5 rounded bg-white">
//                     <div
//                         className="h-1.5 rounded bg-green-900"
//                         style={{ width: `${(completed / 5) * 100}%` }}
//                     />
//                 </div>
//             </section>

//             <div className="grid gap-4 sm:grid-cols-3">
//                 <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//                     <p className="flex items-center gap-1.5 text-xs text-gray-500">
//                         <FaCreditCard className="h-3 w-3" /> Payment
//                     </p>
//                     <p className={`text-xl font-bold ${app.paid ? 'text-green-700' : 'text-amber-700'}`}>
//                         {app.paid ? 'Paid' : 'Not paid'}
//                     </p>
//                 </div>
//                 <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//                     <p className="flex items-center gap-1.5 text-xs text-gray-500">
//                         <FaBook className="h-3 w-3" /> Courses chosen
//                     </p>
//                     <p className="text-xl font-bold text-green-950">{app.courses.length}</p>
//                 </div>
//                 <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//                     <p className="flex items-center gap-1.5 text-xs text-gray-500">
//                         <FaFileAlt className="h-3 w-3" /> Documents
//                     </p>
//                     <p className="text-xl font-bold text-green-950">{uploaded} of {docList.length}</p>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default StudentHome
import { Link } from 'react-router-dom'
import { FaBook, FaCreditCard, FaFileAlt, FaArrowRight } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { useApplication } from '../../hooks/useApplication'
import LoadState from '../../components/LoadState'
import { docList, getCurrent, getDone, stageTitles } from '../../data/application'

const StudentHome = () => {
    const { user } = useAuth()
    const { app, loading, error, reload } = useApplication()

    if (!app) return <LoadState loading={loading} error={error} onRetry={reload} />

    const done = getDone(app)
    const current = getCurrent(done)
    const completed = done.filter(Boolean).length
    const chosen = app.catalog.filter((c) => app.courses.includes(c.code))
    const credits = chosen.reduce((sum, c) => sum + c.credits, 0)
    const uploaded = docList.filter((d) => app.documents[d.key] !== '').length
    const firstName = (user?.name ?? '').split(' ')[0]
    const paid = app.payment.status === 'paid'

    if (app.status === 'approved') {
        return (
            <div className="mx-auto max-w-4xl space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">Welcome, {firstName}</h1>
                    <p className="text-sm text-gray-500">Your application is approved. You are now a UHWF student.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs text-gray-500">My courses</p>
                        <p className="text-2xl font-bold text-green-950">{chosen.length}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs text-gray-500">Total credits</p>
                        <p className="text-2xl font-bold text-green-950">{credits}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="text-2xl font-bold text-green-700">Active</p>
                    </div>
                </div>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-green-950">My courses</h2>
                    <ul className="mt-3 divide-y divide-gray-100">
                        {chosen.map((c) => (
                            <li key={c.code} className="flex items-center gap-3 py-2.5 text-sm text-green-950">
                                <FaBook className="h-4 w-4 text-green-700" />
                                <span>
                                    <strong className="font-semibold">{c.code}</strong> {c.title}
                                </span>
                                <span className="ml-auto text-xs text-gray-500">{c.credits} credits</span>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        )
    }

    const rejected = app.status === 'rejected'
    const submitted = app.status === 'submitted'

    return (
        <div className="mx-auto max-w-4xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">Welcome, {firstName}</h1>
                <p className="text-sm text-gray-500">
                    Finish your application to unlock your courses, timetable and results.
                </p>
            </div>

            <section className={`rounded-xl border p-5 ${rejected ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="font-semibold text-green-950">
                            {rejected ? 'Application not approved' : submitted ? 'Waiting for approval' : 'Complete your application'}
                        </p>
                        <p className="text-sm text-gray-600">
                            {rejected
                                ? (app.reviewNote ?? 'Please contact the administrator.')
                                : submitted
                                    ? 'Your application is submitted. An administrator will review it.'
                                    : `${completed} of 5 stages done. Next: ${stageTitles[Math.min(current, 4)]}.`}
                        </p>
                    </div>
                    <Link
                        to="/student/application"
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                    >
                        {app.status === 'draft' ? 'Continue application' : 'View application'}
                        <FaArrowRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="mt-4 h-1.5 rounded bg-white">
                    <div className="h-1.5 rounded bg-green-900" style={{ width: `${(completed / 5) * 100}%` }} />
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        <FaCreditCard className="h-3 w-3" /> Payment
                    </p>
                    <p className={`text-xl font-bold ${paid ? 'text-green-700' : 'text-amber-700'}`}>
                        {paid ? 'Paid' : app.payment.status === 'pending' ? 'Pending' : 'Not paid'}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        <FaBook className="h-3 w-3" /> Courses chosen
                    </p>
                    <p className="text-xl font-bold text-green-950">{app.courses.length}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        <FaFileAlt className="h-3 w-3" /> Documents
                    </p>
                    <p className="text-xl font-bold text-green-950">
                        {uploaded} of {docList.length}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default StudentHome
