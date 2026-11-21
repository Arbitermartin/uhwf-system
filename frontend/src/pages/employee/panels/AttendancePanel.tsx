import { useCallback, useEffect, useState } from 'react'
import { FaSignInAlt, FaSignOutAlt } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import { todayTZ } from '../../../services/lecturer'
import { clockIn, clockOut, dayShort, getAttendance, minutesText, timeText } from '../../../services/staff'
import type { AttendanceReply } from '../../../services/staff'

const AttendancePanel = ({ days, onChanged }: { days: number; onChanged?: () => void }) => {
    const [data, setData] = useState<AttendanceReply | null>(null)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [now, setNow] = useState(() => Date.now())

    const load = useCallback(async () => {
        try {
            setData(await getAttendance(days))
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load your attendance.'))
        }
    }, [days])

    useEffect(() => {
        void load()
    }, [load])

    // while clocked in, the running time updates every 30 seconds
    useEffect(() => {
        const t = window.setInterval(() => setNow(Date.now()), 30_000)
        return () => window.clearInterval(t)
    }, [])

    const today = data?.days.find((d) => d.date === todayTZ()) ?? null
    const working = !!today && !today.clockOut
    const finished = !!today && !!today.clockOut

    const act = async (action: () => Promise<void>) => {
        setBusy(true)
        setError('')
        try {
            await action()
            await load()
            onChanged?.()
        } catch (err) {
            setError(getErrorMessage(err, 'That did not work. Please try again.'))
        } finally {
            setBusy(false)
        }
    }

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-green-950">Attendance</h2>
            <p className="text-sm text-gray-500">Clock in when you arrive and clock out when you leave.</p>

            <div className="mt-4 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => void act(clockIn)}
                    disabled={busy || !data || !!today}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <FaSignInAlt className="h-4 w-4" /> Clock in
                </button>
                <button
                    type="button"
                    onClick={() => void act(clockOut)}
                    disabled={busy || !working}
                    className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-5 py-2.5 text-sm font-semibold text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <FaSignOutAlt className="h-4 w-4" /> Clock out
                </button>
            </div>

            {working && today && (
                <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                    You clocked in at {timeText(today.clockIn)}. So far today: {minutesText(Math.max(0, Math.round((now - new Date(today.clockIn).getTime()) / 60_000)))}.
                </p>
            )}
            {finished && today && (
                <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                    Done for today: {timeText(today.clockIn)} to {timeText(today.clockOut as string)} ({minutesText(today.minutes ?? 0)}).
                </p>
            )}
            {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <ul className="mt-4 divide-y divide-gray-100">
                {!data && !error && <li className="py-6 text-center text-sm text-gray-500">Loading...</li>}
                {data && data.days.length === 0 && <li className="py-6 text-center text-sm text-gray-500">No attendance recorded yet.</li>}
                {data?.days.map((d) => (
                    <li key={d.date} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                        <span className="w-28 text-gray-800">{dayShort(d.date)}</span>
                        <span className="text-gray-500">
                            {timeText(d.clockIn)} to {d.clockOut ? timeText(d.clockOut) : d.date === todayTZ() ? 'now' : '?'}
                        </span>
                        <span className="w-24 text-right font-semibold text-green-950">
                            {d.minutes !== null ? minutesText(d.minutes) : d.date === todayTZ() ? 'Working' : <span className="font-medium text-amber-700">No clock-out</span>}
                        </span>
                    </li>
                ))}
            </ul>

            {data && (
                <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    This month: {data.month.daysWorked} day{data.month.daysWorked === 1 ? '' : 's'} worked, {minutesText(data.month.minutes)} in total.
                </p>
            )}
        </section>
    )
}

export default AttendancePanel
