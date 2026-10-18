export type LStudent = {
    id: number
    name: string
    reg: string
    attendancePct: number // overall attendance so far
}

export type LecturerCourse = {
    code: string
    title: string
    enrolled: number // total enrolled (the list below shows a sample)
    studentIds: number[]
}

export type Assignment = {
    id: number
    title: string
    courseCode: string
    due: string
    submitted: number
    total: number
    toGrade: number
}

export type Announcement = {
    id: number
    courseCode: string
    text: string
    postedAt: string // ISO date
}

export const GRADE_MAX = 20
export const AT_RISK_ATTENDANCE = 75 // percent
export const AT_RISK_GRADE = 8

// SAMPLE DATA: later this comes from the database through the API.
// The backend must return only students enrolled in THIS lecturer's courses.
const names = [
    'Neema Mollel', 'Hassan Said', 'Grace Lyimo', 'Daniel Mwakyusa',
    'Furaha Ndege', 'Emmanuel Oloo', 'Salma Bakari', 'Rehema Tarimo',
    'Joseph Kileo', 'Asha Mushi', 'Peter Massawe', 'Zawadi Komba',
]
const attendance = [96, 88, 72, 91, 100, 68, 94, 85, 79, 97, 90, 74]

export const students: LStudent[] = names.map((name, i) => ({
    id: i,
    name,
    reg: `UHWF/2026/${String(i + 1).padStart(3, '0')}`,
    attendancePct: attendance[i],
}))

export const lecturerCourses: LecturerCourse[] = [
    { code: 'WLM101', title: 'Wildlife management basics', enrolled: 32, studentIds: [0, 1, 2, 3, 4, 5] },
    { code: 'LUP102', title: 'Land use planning', enrolled: 28, studentIds: [3, 4, 5, 6, 7, 8] },
    { code: 'HWC103', title: 'Human-wildlife conflict', enrolled: 26, studentIds: [6, 7, 8, 9, 10, 11] },
]

export const assignments: Assignment[] = [
    { id: 1, title: 'Field report 1', courseCode: 'WLM101', due: '12 Oct', submitted: 22, total: 32, toGrade: 8 },
    { id: 2, title: 'Case study: land use', courseCode: 'LUP102', due: '16 Oct', submitted: 18, total: 28, toGrade: 6 },
]

// Task 1 grades out of 20. Blank means not graded yet.
const sampleGrades = ['16', '12', '7', '18', '', '9', '15', '14', '6', '19', '', '11']
export const initialGrades: Record<string, string> = {}
lecturerCourses.forEach((c) =>
    c.studentIds.forEach((id) => {
        initialGrades[`${c.code}:${id}`] = sampleGrades[id]
    }),
)

export const initialAnnouncements: Announcement[] = [
    { id: 1, courseCode: 'WLM101', text: "Bring your field notebook to Friday's session.", postedAt: '2026-10-12' },
    { id: 2, courseCode: 'LUP102', text: 'The case study brief is on the course page.', postedAt: '2026-10-11' },
    { id: 3, courseCode: 'HWC103', text: 'A guest speaker joins us next Tuesday.', postedAt: '2026-10-07' },
]