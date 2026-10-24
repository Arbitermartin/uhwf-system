import { prisma } from '../prisma'
import { HttpError } from '../utils/httpError'

// The lecturer record of the signed-in person.
export async function lecturerProfileId(userId: number) {
    const profile = await prisma.lecturerProfile.findUnique({ where: { userId }, select: { id: true } })
    if (!profile) throw new HttpError(403, 'Your account has no lecturer record. Ask the administrator.')
    return profile.id
}

// A lecturer can only work with the courses that are assigned to them.
// For any other course the answer is "not found", so nothing about it is revealed.
export async function ownedCourse(courseId: number, profileId: number) {
    const course = await prisma.course.findFirst({
        where: { id: courseId, lecturerId: profileId },
        select: { id: true, code: true, title: true },
    })
    if (!course) throw new HttpError(404, 'Course not found.')
    return course
}

export async function ownedAssignment(assignmentId: number, profileId: number) {
    const assignment = await prisma.assignment.findFirst({
        where: { id: assignmentId, course: { lecturerId: profileId } },
        select: {
            id: true,
            title: true,
            maxScore: true,
            courseId: true,
            course: { select: { code: true } },
        },
    })
    if (!assignment) throw new HttpError(404, 'Assignment not found.')
    return assignment
}

// Students who are actively enrolled in the course, with the user id for notifications.
export async function activeStudents(courseId: number) {
    const rows = await prisma.enrollment.findMany({
        where: { courseId, status: 'active' },
        orderBy: { student: { user: { fullName: 'asc' } } },
        select: {
            studentId: true,
            student: { select: { userId: true, regNumber: true, user: { select: { fullName: true } } } },
        },
    })
    return rows.map((r) => ({
        studentId: r.studentId,
        userId: r.student.userId,
        regNumber: r.student.regNumber,
        name: r.student.user.fullName,
    }))
}

// Sends the same notification to many students at once.
export async function notifyStudents(
    userIds: number[],
    n: { type: string; title: string; body: string; linkUrl: string },
) {
    if (userIds.length === 0) return
    await prisma.notification.createMany({ data: userIds.map((userId) => ({ userId, ...n })) })
}
