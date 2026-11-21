import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../../services/api'
import { todayTZ } from '../../../services/lecturer'
import { getAttendanceBoard, minutesText, timeText } from '../../../services/staff'
import type { AttendanceBoardReply } from '../../../services/staff'

const stateInfo = {
    absent: { label: 'Not clocked in', cls: 'bg-gray-100 text-gray-700' },
    working: { label: 'Working now', cls: 'bg-green-100 text-green-800' },
    done: { label: 'Clocked out', cls: 'bg-sky-100 text-sky-900' },
} as const

const AttendanceBoard = () => {
    const [date, setDate] = useState(todayTZ())
    const [data, setData] = useState<AttendanceBoardReply | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        setData(null)
        getAttendanceBoard(date)
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the attendance.'))
            })
        return () => {
            cancelled = true
        }
    }, [date])

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <label className="text-xs text-gray-600">
                    Day
                    <input
                        type="date"
                        value={date}
                        max={todayTZ()}
                        onChange={(e) => e.target.value && setDate(e.target.value)}
                        className="mt-1 block rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                    />
                </label>
                {data && (
                    <p className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">{data.summary.present} present</span>
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-900">{data.summary.working} working now</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{data.summary.absent} not clocked in</span>
                    </p>
                )}
            </div>

            {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead>
                        <tr className="text-xs text-gray-500">
                            <th className="py-2 font-normal">Employee</th>
                            <th className="py-2 font-normal">Clock in</th>
                            <th className="py-2 font-normal">Clock out</th>
                            <th className="py-2 font-normal">Hours</th>
                            <th className="py-2 font-normal">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!data && !error && (
                            <tr>
                                <td colSpan={5} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        )}
                        {data && data.rows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                    There are no active employees yet.
                                </td>
                            </tr>
                        )}
                        {data?.rows.map((r) => (
                            <tr key={r.id} className="border-t border-gray-100">
                                <td className="py-3">
                                    <p className="font-medium text-green-950">{r.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {r.position} · {r.staffId}
                                    </p>
                                </td>
                                <td className="py-3 text-gray-700">{r.clockIn ? timeText(r.clockIn) : '-'}</td>
                                <td className="py-3 text-gray-700">{r.clockOut ? timeText(r.clockOut) : '-'}</td>
                                <td className="py-3 font-medium text-green-950">{r.minutes !== null ? minutesText(r.minutes) : '-'}</td>
                                <td className="py-3">
                                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${stateInfo[r.state].cls}`}>{stateInfo[r.state].label}</span>
                                    {r.state === 'working' && data.date !== todayTZ() && <span className="ml-1 text-xs text-amber-700">no clock-out</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default AttendanceBoard
