import type { ReactNode } from 'react'
import { weekdayNames, weekdayToday } from '../services/timetable'
import type { Slot } from '../services/timetable'

// The week as cards, one per day that has classes. Today is highlighted.
const TimetableView = ({
    slots,
    showLecturer = false,
    renderActions,
    emptyText,
}: {
    slots: Slot[]
    showLecturer?: boolean
    renderActions?: (slot: Slot) => ReactNode
    emptyText: string
}) => {
    const today = weekdayToday()

    if (slots.length === 0) {
        return <p className="rounded-xl border border-dashed border-green-200 bg-green-50 p-8 text-center text-sm text-gray-600">{emptyText}</p>
    }

    const days = weekdayNames
        .map((name, i) => ({ name, weekday: i + 1, slots: slots.filter((s) => s.weekday === i + 1) }))
        .filter((d) => d.slots.length > 0)

    const hasToday = days.some((d) => d.weekday === today)

    return (
        <div className="space-y-3">
            {!hasToday && <p className="text-sm text-gray-500">No classes today.</p>}
            {days.map((d) => (
                <section
                    key={d.weekday}
                    className={`rounded-xl border bg-white p-4 shadow-sm ${d.weekday === today ? 'border-amber-400' : 'border-gray-200'}`}
                >
                    <h3 className="flex items-center gap-2 font-semibold text-green-950">
                        {d.name}
                        {d.weekday === today && (
                            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-green-950">Today</span>
                        )}
                    </h3>
                    <ul className="mt-2 divide-y divide-gray-100">
                        {d.slots.map((s) => (
                            <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                                <span className="w-28 shrink-0 font-medium text-green-900">
                                    {s.startTime} to {s.endTime}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="font-semibold text-green-950">{s.courseCode}</span>{' '}
                                    <span className="text-gray-700">{s.courseTitle}</span>
                                    <span className="block text-xs text-gray-500">
                                        {s.room ? `Room: ${s.room}` : 'Room not set'}
                                        {showLecturer && s.lecturer ? ` · ${s.lecturer}` : ''}
                                    </span>
                                </span>
                                {renderActions?.(s)}
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    )
}

export default TimetableView
