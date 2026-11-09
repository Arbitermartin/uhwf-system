import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    FaBars,
    FaBell,
    FaCalendarAlt,
    FaChevronDown,
    FaHeart,
    FaHome,
    FaLifeRing,
    FaNewspaper,
    FaSignOutAlt,
    FaTimes,
    FaUser,
} from 'react-icons/fa'
import logo from '../assets/uhwf-logo.webp'
import NotificationBell from '../components/NotificationBell'
import { useAuth } from '../hooks/useAuth'

// The pages of the public website are reached from here until the member portal has its own.
const nav = [
    { label: 'Dashboard', to: '/member', icon: FaHome, end: true },
    { label: 'Events', to: '/events', icon: FaCalendarAlt },
    { label: 'News', to: '/news', icon: FaNewspaper },
    { label: 'Donate', to: '/donate', icon: FaHeart },
    { label: 'Notifications', to: '/member/notifications', icon: FaBell },
    { label: 'My profile', to: '/member/profile', icon: FaUser },
    { label: 'Report a problem', to: '/member/support', icon: FaLifeRing },
]

const initialsOf = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('')

const Avatar = ({ name, photo, size }: { name: string; photo?: string; size: string }) =>
    photo ? (
        <img src={photo} alt="" className={`${size} rounded-full border-2 border-amber-400 object-cover`} />
    ) : (
        <span className={`${size} flex items-center justify-center rounded-full bg-amber-400 text-xs font-semibold text-green-950`}>
            {initialsOf(name)}
        </span>
    )

// The frame of the member area: a green menu on the left, a top bar, and the page in the middle.
const MemberLayout = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false) // the side menu on a phone
    const [profileOpen, setProfileOpen] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!profileOpen) return
        const onClick = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setProfileOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [profileOpen])

    if (!user) return null

    const signOut = async () => {
        await logout()
        navigate('/login')
    }

    const sidebar = (
        <div className="flex h-full flex-col bg-green-950 px-3 py-4 text-white">
            <Link to="/" className="flex items-center gap-2 px-2 pb-5">
                <img src={logo} alt="" className="h-9 w-auto" />
                <span className="leading-tight">
                    <span className="block text-base font-bold">UHWF</span>
                    <span className="block text-xs text-green-200">Member portal</span>
                </span>
            </Link>

            <nav className="flex-1 space-y-0.5" aria-label="Member menu">
                {nav.map(({ label, to, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-white/15 font-medium text-white' : 'text-green-100 hover:bg-white/10'
                            }`
                        }
                    >
                        <Icon className="h-4 w-4 shrink-0" /> {label}
                    </NavLink>
                ))}
            </nav>

            <div className="border-t border-white/20 pt-3">
                <div className="flex items-center gap-2.5 px-2 pb-2">
                    <Avatar name={user.name} photo={user.photo} size="h-9 w-9" />
                    <span className="min-w-0 leading-tight">
                        <span className="block truncate text-sm font-medium">{user.name}</span>
                        <span className="block text-xs text-green-200">Member</span>
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => void signOut()}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-green-100 hover:bg-white/10"
                >
                    <FaSignOutAlt className="h-4 w-4" /> Log out
                </button>
            </div>
        </div>
    )

    return (
        <div className="flex min-h-screen bg-green-50">
            <aside className="sticky top-0 hidden h-screen w-60 shrink-0 md:block">{sidebar}</aside>

            {menuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <button type="button" aria-label="Close the menu" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-green-950/60" />
                    <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2.5">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label={menuOpen ? 'Close the menu' : 'Open the menu'}
                        className="rounded-md p-2 text-green-950 hover:bg-green-50 md:hidden"
                    >
                        {menuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
                    </button>
                    <span className="hidden text-sm text-gray-500 md:block">Universal Human-Wildlife Foundation</span>

                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <div ref={profileRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setProfileOpen((o) => !o)}
                                aria-haspopup="menu"
                                aria-expanded={profileOpen}
                                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-green-50"
                            >
                                <Avatar name={user.name} photo={user.photo} size="h-8 w-8" />
                                <span className="hidden text-sm font-medium text-green-950 sm:block">{user.name.split(' ')[0]}</span>
                                <FaChevronDown className="h-3 w-3 text-gray-400" />
                            </button>

                            {profileOpen && (
                                <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                                    <Link to="/member/profile" role="menuitem" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-green-50">
                                        My profile
                                    </Link>
                                    <Link to="/member/password" role="menuitem" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-green-50">
                                        Change password
                                    </Link>
                                    <Link to="/member/support" role="menuitem" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-green-50">
                                        Report a problem
                                    </Link>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => void signOut()}
                                        className="mt-1 block w-full rounded-lg border-t border-gray-100 px-3 py-2 text-left text-sm text-gray-700 hover:bg-green-50"
                                    >
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default MemberLayout
