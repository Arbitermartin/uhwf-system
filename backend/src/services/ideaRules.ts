import { z } from 'zod'

// Rules for the innovation portal. Nothing here touches the database, so it can be tested alone.

// Administrators, ICT and employees review ideas
export const REVIEWER_ROLES = ['admin', 'ict', 'employee'] as const
export const isReviewer = (role: string) => (REVIEWER_ROLES as readonly string[]).includes(role)

export const IDEA_CATEGORIES = ['Conservation', 'Community', 'Technology', 'Education', 'Operations', 'Other'] as const
export const IDEA_STATUSES = ['submitted', 'under_review', 'needs_info', 'approved', 'not_selected'] as const
// What the administrator can set. "submitted" only happens when an idea is first sent.
export const DECISION_STATUSES = ['under_review', 'needs_info', 'approved', 'not_selected'] as const
export const RECOMMENDATIONS = ['support', 'needs_work', 'not_now'] as const

type Who = { id: number; role: string }

// Only the person who shared an idea and the reviewers can see it.
export const canSee = (viewer: Who, authorId: number) => viewer.id === authorId || isReviewer(viewer.role)

export type FeedbackKind = 'review' | 'reply' | 'none'

// What a comment from this person is.
// The author can only reply: nobody reviews their own idea, even if they are an administrator.
export function feedbackKind(viewer: Who, authorId: number): FeedbackKind {
    if (viewer.id === authorId) return 'reply'
    if (isReviewer(viewer.role)) return 'review'
    return 'none'
}

// Returns a message when this person may NOT set the final decision, or null when they may.
export function whyCannotDecide(viewer: Who, authorId: number): string | null {
    if (viewer.role !== 'admin') return 'Only the administrator makes the final decision.'
    if (viewer.id === authorId) return 'Another administrator must decide on your own idea.'
    return null
}

export type IdeaStatus = (typeof IDEA_STATUSES)[number]

// The first review moves a new idea to "under review". An answer to a question moves it back there.
export function statusAfterFeedback(status: IdeaStatus, kind: FeedbackKind): IdeaStatus {
    if (kind === 'review' && status === 'submitted') return 'under_review'
    if (kind === 'reply' && status === 'needs_info') return 'under_review'
    return status
}

export const ideaSchema = z.object({
    title: z.string().trim().min(3, 'Enter a short title (at least 3 characters).').max(120, 'The title is too long.'),
    category: z.enum(IDEA_CATEGORIES, { errorMap: () => ({ message: 'Choose a category.' }) }),
    description: z.string().trim().min(20, 'Describe your idea in at least 20 characters.').max(4000, 'The description is too long.'),
})

const score = z.number({ invalid_type_error: 'Choose a score from 1 to 5.' }).int('Use a whole number.').min(1, 'From 1 to 5.').max(5, 'From 1 to 5.')

export const feedbackSchema = z.object({
    comment: z.string().trim().min(1, 'Write a comment.').max(2000, 'The comment is too long.'),
    recommendation: z.enum(RECOMMENDATIONS).optional(),
    impact: score.optional(),
    feasibility: score.optional(),
    effort: score.optional(),
})

export const statusSchema = z.object({
    status: z.enum(DECISION_STATUSES, { errorMap: () => ({ message: 'Choose a status.' }) }),
})

// A review needs a recommendation, all three scores and a real comment. A reply needs only a comment.
// Returns the problems as { field: message }, or {} when everything is fine.
export function checkFeedback(kind: FeedbackKind, f: z.infer<typeof feedbackSchema>): Record<string, string> {
    const errors: Record<string, string> = {}
    if (kind === 'review') {
        if (!f.recommendation) errors.recommendation = 'Choose a recommendation.'
        if (f.impact === undefined) errors.impact = 'Score the impact from 1 to 5.'
        if (f.feasibility === undefined) errors.feasibility = 'Score the feasibility from 1 to 5.'
        if (f.effort === undefined) errors.effort = 'Score the effort from 1 to 5.'
        if (f.comment.length < 10) errors.comment = 'Write at least 10 characters of feedback.'
    } else if (f.comment.length < 5) {
        errors.comment = 'Write a reply first (at least 5 characters).'
    }
    return errors
}
