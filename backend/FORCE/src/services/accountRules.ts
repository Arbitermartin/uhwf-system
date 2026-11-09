// Who may an ICT person manage? Nothing here touches the database, so it can be tested alone.

type Who = { id: number; role: string }

// Returns a message when ICT may NOT manage this account, or null when it is allowed.
//
// Administrators are off limits. If ICT could reset an administrator's password, anyone with an
// ICT account could sign in as an administrator and gain more power than ICT was given.
// Your own account is also excluded, so nobody locks themselves out by accident.
export function whyNotManageable(actor: Who, target: Who): string | null {
    if (target.id === actor.id) return 'Use your own profile page for your own account.'
    if (target.role === 'admin') return 'Administrator accounts can only be managed by an administrator.'
    return null
}
