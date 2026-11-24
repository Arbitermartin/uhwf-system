// import type { IconType } from 'react-icons'
// import {
//     FaBriefcase,
//     FaChalkboardTeacher,
//     FaCog,
//     FaGlobe,
//     FaGraduationCap,
//     FaLifeRing,
//     FaServer,
//     FaUserCircle,
//     FaUsers,
// } from 'react-icons/fa'
// import type { Role } from '../context/auth-context'

// // The same shape as the menu items in DashboardLayout
// export type NavItem = { label: string; to: string; icon: IconType; end?: boolean; needsApproval?: boolean }

// type GroupRule = { label: string; icon: IconType; paths: string[] }

// // Which menu items belong together. A path is the part after the role: "/admin/users" is "users".
// // Items that are not listed here stay as normal links, so nothing is ever lost from a menu.
// export const groupRules: Record<Role, GroupRule[]> = {
//     admin: [
//         { label: 'People', icon: FaUsers, paths: ['users', 'students', 'lecturers', 'employees', 'partners'] },
//         { label: 'Academics', icon: FaGraduationCap, paths: ['courses', 'enrollments', 'applications'] },
//         { label: 'Staff and jobs', icon: FaBriefcase, paths: ['staff-work', 'careers'] },
//         { label: 'Website', icon: FaGlobe, paths: ['news', 'events', 'videos', 'messages'] },
//     ],
//     student: [
//         { label: 'Study', icon: FaGraduationCap, paths: ['courses', 'timetable', 'results'] },
//         { label: 'My account', icon: FaUserCircle, paths: ['profile', 'notifications', 'support'] },
//     ],
//     lecturer: [
//         { label: 'Teaching', icon: FaChalkboardTeacher, paths: ['courses', 'attendance', 'assignments', 'grades', 'timetable'] },
//         { label: 'Communication', icon: FaGlobe, paths: ['announcements', 'messages'] },
//     ],
//     employee: [
//         { label: 'My work', icon: FaBriefcase, paths: ['tasks', 'attendance', 'leave'] },
//         { label: 'Communication', icon: FaGlobe, paths: ['announcements', 'messages'] },
//     ],
//     ict: [
//         { label: 'Support', icon: FaLifeRing, paths: ['tickets', 'accounts'] },
//         { label: 'System', icon: FaServer, paths: ['logs', 'backups', 'server', 'database', 'maintenance', 'security'] },
//         { label: 'Settings', icon: FaCog, paths: ['settings'] },
//     ],
//     member: [
//         { label: 'Community', icon: FaGlobe, paths: ['events', 'news', 'donate', 'ideas'] },
//         { label: 'My account', icon: FaUserCircle, paths: ['notifications', 'profile', 'support'] },
//     ],
// }

// export type NavEntry =
//     | { kind: 'link'; item: NavItem }
//     | { kind: 'group'; label: string; icon: IconType; items: NavItem[] }

// // "/admin/users" becomes "users". A path with no role in front ("/events") is used as it is.
// const pathKey = (to: string, role: Role) => {
//     const rest = to.replace(/^\//, '')
//     return rest.startsWith(`${role}/`) ? rest.slice(role.length + 1) : rest
// }

// // Arranges a flat menu into links and dropdown groups.
// //  - the order of the original menu is kept
// //  - a group sits where its first item was
// //  - a group with a single item is just shown as that link
// //  - an item that no group claims stays a normal link
// export function buildNav(items: NavItem[], role: Role): NavEntry[] {
//     const rules = groupRules[role]
//     const groupOf = (item: NavItem) => (item.end ? undefined : rules.find((r) => r.paths.includes(pathKey(item.to, role))))

//     const entries: NavEntry[] = []
//     const emitted = new Set<string>()

//     for (const item of items) {
//         const rule = groupOf(item)
//         if (!rule) {
//             entries.push({ kind: 'link', item })
//             continue
//         }
//         if (emitted.has(rule.label)) continue
//         emitted.add(rule.label)

//         const members = items.filter((i) => groupOf(i) === rule)
//         if (members.length < 2) entries.push({ kind: 'link', item: members[0] })
//         else entries.push({ kind: 'group', label: rule.label, icon: rule.icon, items: members })
//     }

//     // "Settings" is always the last entry, however late other items were added to the menu
//     const isLast = (e: NavEntry) => e.kind === 'link' && pathKey(e.item.to, role) === 'settings'
//     return [...entries.filter((e) => !isLast(e)), ...entries.filter(isLast)]
// }

// // Is this menu item the page that is open now?
// export const isActive = (item: NavItem, pathname: string) =>
//     item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)


import type { IconType } from 'react-icons'
import {
    FaBriefcase,
    FaChalkboardTeacher,
    FaCog,
    FaGlobe,
    FaGraduationCap,
    FaLifeRing,
    FaServer,
    FaUserCircle,
    FaUsers,
} from 'react-icons/fa'
import type { Role } from '../context/auth-context'

// The same shape as the menu items in DashboardLayout
export type NavItem = { label: string; to: string; icon: IconType; end?: boolean; needsApproval?: boolean }

type GroupRule = { label: string; icon: IconType; paths: string[] }

// Which menu items belong together. A path is the part after the role: "/admin/users" is "users".
// Items that are not listed here stay as normal links, so nothing is ever lost from a menu.
export const groupRules: Record<Role, GroupRule[]> = {
    admin: [
        { label: 'People', icon: FaUsers, paths: ['users', 'students', 'lecturers', 'employees', 'partners'] },
        { label: 'Academics', icon: FaGraduationCap, paths: ['courses', 'enrollments', 'applications'] },
        { label: 'Staff and jobs', icon: FaBriefcase, paths: ['staff-work', 'careers'] },
        { label: 'Website', icon: FaGlobe, paths: ['news', 'events', 'videos', 'messages'] },
    ],
    student: [
        { label: 'Study', icon: FaGraduationCap, paths: ['courses', 'learning', 'timetable', 'results'] },
        { label: 'My account', icon: FaUserCircle, paths: ['profile', 'notifications', 'support'] },
    ],
    lecturer: [
        { label: 'Teaching', icon: FaChalkboardTeacher, paths: ['courses', 'learning', 'attendance', 'assignments', 'grades', 'timetable'] },
        { label: 'Communication', icon: FaGlobe, paths: ['announcements', 'messages'] },
    ],
    employee: [
        { label: 'My work', icon: FaBriefcase, paths: ['tasks', 'attendance', 'leave'] },
        { label: 'Communication', icon: FaGlobe, paths: ['announcements', 'messages'] },
    ],
    ict: [
        { label: 'Support', icon: FaLifeRing, paths: ['tickets', 'accounts'] },
        { label: 'System', icon: FaServer, paths: ['logs', 'backups', 'server', 'database', 'maintenance', 'security'] },
        { label: 'Settings', icon: FaCog, paths: ['settings'] },
    ],
    member: [
        { label: 'Community', icon: FaGlobe, paths: ['events', 'news', 'donate', 'ideas'] },
        { label: 'My account', icon: FaUserCircle, paths: ['notifications', 'profile', 'support'] },
    ],
}

export type NavEntry =
    | { kind: 'link'; item: NavItem }
    | { kind: 'group'; label: string; icon: IconType; items: NavItem[] }

// "/admin/users" becomes "users". A path with no role in front ("/events") is used as it is.
const pathKey = (to: string, role: Role) => {
    const rest = to.replace(/^\//, '')
    return rest.startsWith(`${role}/`) ? rest.slice(role.length + 1) : rest
}

// Arranges a flat menu into links and dropdown groups.
//  - the order of the original menu is kept
//  - a group sits where its first item was
//  - a group with a single item is just shown as that link
//  - an item that no group claims stays a normal link
export function buildNav(items: NavItem[], role: Role): NavEntry[] {
    const rules = groupRules[role]
    const groupOf = (item: NavItem) => (item.end ? undefined : rules.find((r) => r.paths.includes(pathKey(item.to, role))))

    const entries: NavEntry[] = []
    const emitted = new Set<string>()

    for (const item of items) {
        const rule = groupOf(item)
        if (!rule) {
            entries.push({ kind: 'link', item })
            continue
        }
        if (emitted.has(rule.label)) continue
        emitted.add(rule.label)

        const members = items.filter((i) => groupOf(i) === rule)
        if (members.length < 2) entries.push({ kind: 'link', item: members[0] })
        else entries.push({ kind: 'group', label: rule.label, icon: rule.icon, items: members })
    }

    // "Settings" is always the last entry, however late other items were added to the menu
    const isLast = (e: NavEntry) => e.kind === 'link' && pathKey(e.item.to, role) === 'settings'
    return [...entries.filter((e) => !isLast(e)), ...entries.filter(isLast)]
}

// Is this menu item the page that is open now?
export const isActive = (item: NavItem, pathname: string) =>
    item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)


