export type Slot = {
    id: number
    courseId: number
    courseCode: string
    courseTitle: string
    weekday: number // 1 = Monday ... 7 = Sunday
    startTime: string // "08:00"
    endTime: string // "10:00"
    room: string | null
    lecturer: string | null
}

export const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Today's weekday in Tanzania (UTC+3, no daylight saving): 1 = Monday ... 7 = Sunday
export const weekdayToday = () => {
    const d = new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCDay()
    return d === 0 ? 7 : d
}
// export type Slot = {
//     id: number
//     courseId: number
//     courseCode: string
//     courseTitle: string
//     weekday: number // 1 = Monday ... 7 = Sunday
//     startTime: string // "08:00"
//     endTime: string // "10:00"
//     room: string | null
//     lecturer: string | null
// }

// export const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// // Today's weekday in Tanzania (UTC+3, no daylight saving): 1 = Monday ... 7 = Sunday
// export const weekdayToday = () => {
//     const d = new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCDay()
//     return d === 0 ? 7 : d
// }

