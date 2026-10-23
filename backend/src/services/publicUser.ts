import type { User } from '@prisma/client'

// The version of a user that is safe to send to the browser (never the password hash).
// The photo is a link to our own protected route, not a path on disk. The ?v= number
// changes whenever the user changes, so the browser fetches a new photo straight away.
export const toPublicUser = (
    u: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'photoUrl' | 'mustChangePassword' | 'updatedAt'>,
) => ({
    id: u.id,
    name: u.fullName,
    email: u.email,
    role: u.role,
    photo: u.photoUrl ? `/api/photos/${u.id}?v=${u.updatedAt.getTime()}` : undefined,
    mustChangePassword: u.mustChangePassword,
})
