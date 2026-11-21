import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FaChevronDown, FaLock } from 'react-icons/fa'
import type { Role } from '../context/auth-context'
import { buildNav, isActive } from './navGroups'
import type { NavItem } from './navGroups'

const linkClass = (active: boolean, small = false) =>
    `mb-0.5 flex items-center gap-3 rounded-lg px-3 ${small ? 'py-1.5' : 'py-2'} text-sm transition-colors ${active ? 'bg-amber-400 font-semibold text-green-950' : 'text-green-100 hover:bg-white/10'
    }`

// A menu item. An item that is locked (a student whose application is not approved yet) cannot be opened.
const Item = ({ item, approved, small, onNavigate }: { item: NavItem; approved: boolean; small?: boolean; onNavigate?: () => void }) => {
    const Icon = item.icon
    if (item.needsApproval && !approved) {
        return (
            <div
                title="Unlocks after your application is approved"
                className={`mb-0.5 flex cursor-not-allowed items-center gap-3 rounded-lg px-3 ${small ? 'py-1.5' : 'py-2'} text-sm text-green-100/50`}
            >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
                <FaLock className="ml-auto h-3 w-3" />
            </div>
        )
    }
    return (
        <NavLink to={item.to} end={item.end} onClick={onNavigate} className={({ isActive: active }) => linkClass(active, small)}>
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
        </NavLink>
    )
}

// The sidebar menu: normal links, and groups that open and close like a dropdown.
// It takes the flat menu list of the dashboard and arranges it, so no menu item is ever lost.
const SidebarNav = ({
    items,
    role,
    approved = true,
    onNavigate,
}: {
    items: NavItem[]
    role: Role
    approved?: boolean
    onNavigate?: () => void // called when a link is clicked, for example to close the menu on a phone
}) => {
    const { pathname } = useLocation()
    const entries = useMemo(() => buildNav(items, role), [items, role])

    // which groups are open, remembered in the browser
    const storageKey = `uhwf_nav_open_${role}`
    const [open, setOpen] = useState<string[]>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
            return Array.isArray(saved) ? saved.filter((x): x is string => typeof x === 'string') : []
        } catch {
            return []
        }
    })

    // the group that holds the page you are on is always open, so you can see where you are
    useEffect(() => {
        for (const e of entries) {
            if (e.kind === 'group' && e.items.some((i) => isActive(i, pathname))) {
                setOpen((prev) => (prev.includes(e.label) ? prev : [...prev, e.label]))
            }
        }
    }, [pathname, entries])

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(open))
        } catch {
            /* storage unavailable: the groups just close again after a refresh */
        }
    }, [open, storageKey])

    const toggle = (label: string) => setOpen((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))

    return (
        <>
            {entries.map((e) => {
                if (e.kind === 'link') return <Item key={e.item.to} item={e.item} approved={approved} onNavigate={onNavigate} />

                const Icon = e.icon
                const isOpen = open.includes(e.label)
                const hasActive = e.items.some((i) => isActive(i, pathname))
                const panelId = `nav-group-${role}-${e.label.replace(/\s+/g, '-').toLowerCase()}`

                return (
                    <div key={e.label} className="mb-0.5">
                        <button
                            type="button"
                            onClick={() => toggle(e.label)}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 ${hasActive && !isOpen ? 'bg-white/10 text-white' : 'text-green-100'
                                }`}
                        >
                            <Icon className={`h-4 w-4 shrink-0 ${hasActive ? 'text-amber-400' : ''}`} />
                            <span className="flex-1">{e.label}</span>
                            <FaChevronDown className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOpen && (
                            <div id={panelId} className="ml-5 mt-0.5 border-l border-white/15 pl-2">
                                {e.items.map((item) => (
                                    <Item key={item.to} item={item} approved={approved} small onNavigate={onNavigate} />
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </>
    )
}

export default SidebarNav
