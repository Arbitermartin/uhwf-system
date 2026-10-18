import { useContext, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { IconType } from 'react-icons'
import {
    FaTachometerAlt,
    FaUsers,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaBriefcase,
    FaBook,
    FaClipboardCheck,
    FaNewspaper,
    FaVideo,
    FaFileAlt,
    FaEnvelope,
    FaCog,
    FaBell,
    FaSearch,
    FaChevronDown,
    FaUser,
    FaLock,
    FaHistory,
    FaQuestionCircle,
    FaSignOutAlt,
    FaBars,
    FaTimes,
    FaCalendarAlt,
    FaChartBar,
    FaBullhorn,
    FaTicketAlt, FaCloudUploadAlt, FaShieldAlt, FaServer, FaDatabase, FaTools,
    FaTasks, FaClock, FaCalendarCheck, FaLifeRing,
} from 'react-icons/fa'
import { ApplicationContext } from '../context/application-context'
import logo from '../assets/uhwf-logo.webp'
import { useAuth } from '../hooks/useAuth'
import type { Role, User } from '../context/auth-context'
import NotificationBell from '../components/notificationBell'

type NavItem = { label: string; to: string; icon: IconType; end?: boolean; needsApproval?: boolean }
const navByRole: Record<Role, NavItem[]> = {
    admin: [
        { label: 'Dashboard', to: '/admin', icon: FaTachometerAlt, end: true },
        { label: 'Users', to: '/admin/users', icon: FaUsers },
        { label: 'Students', to: '/admin/students', icon: FaUserGraduate },
        { label: 'Lecturers', to: '/admin/lecturers', icon: FaChalkboardTeacher },
        { label: 'Employees', to: '/admin/employees', icon: FaBriefcase },
        { label: 'Courses', to: '/admin/courses', icon: FaBook },
        { label: 'Enrollments', to: '/admin/enrollments', icon: FaClipboardCheck },
        { label: 'News and events', to: '/admin/news', icon: FaNewspaper },
        { label: 'Videos', to: '/admin/videos', icon: FaVideo },
        { label: 'Applications', to: '/admin/applications', icon: FaFileAlt },
        { label: 'Messages', to: '/admin/messages', icon: FaEnvelope },
        { label: 'Settings', to: '/admin/settings', icon: FaCog },
    ],
    student: [
        { label: 'Dashboard', to: '/student', icon: FaTachometerAlt, end: true },
        { label: 'My application', to: '/student/application', icon: FaFileAlt },
        { label: 'Notifications', to: '/student/notifications', icon: FaBell },
        { label: 'Profile', to: '/student/profile', icon: FaUser },
        { label: 'My courses', to: '/student/courses', icon: FaBook, needsApproval: true },
        { label: 'Timetable', to: '/student/timetable', icon: FaCalendarAlt, needsApproval: true },
        { label: 'Results', to: '/student/results', icon: FaChartBar, needsApproval: true },
    ],
    lecturer: [
        { label: 'Dashboard', to: '/lecturer', icon: FaTachometerAlt, end: true },
        { label: 'My courses', to: '/lecturer/courses', icon: FaBook },
        { label: 'Attendance', to: '/lecturer/attendance', icon: FaClipboardCheck },
        { label: 'Assignments', to: '/lecturer/assignments', icon: FaFileAlt },
        { label: 'Grades', to: '/lecturer/grades', icon: FaChartBar },
        { label: 'Announcements', to: '/lecturer/announcements', icon: FaBullhorn },
        { label: 'Messages', to: '/lecturer/messages', icon: FaEnvelope },
        { label: 'Timetable', to: '/lecturer/timetable', icon: FaCalendarAlt },
    ],
    // Placeholders until we build these dashboards
    employee: [
        { label: 'Dashboard', to: '/employee', icon: FaTachometerAlt, end: true },
        { label: 'My tasks', to: '/employee/tasks', icon: FaTasks },
        { label: 'Attendance', to: '/employee/attendance', icon: FaClock },
        { label: 'Leave requests', to: '/employee/leave', icon: FaCalendarCheck },
        { label: 'Announcements', to: '/employee/announcements', icon: FaBullhorn },
        { label: 'Messages', to: '/employee/messages', icon: FaEnvelope },
        { label: 'Report a problem', to: '/employee/support', icon: FaLifeRing },
    ],
    ict: [
        { label: 'Dashboard', to: '/ict', icon: FaTachometerAlt, end: true },
        { label: 'Support tickets', to: '/ict/tickets', icon: FaTicketAlt },
        { label: 'System logs', to: '/ict/logs', icon: FaFileAlt },
        { label: 'Backup and restore', to: '/ict/backups', icon: FaCloudUploadAlt },
        { label: 'User accounts', to: '/ict/accounts', icon: FaUsers },
        { label: 'Security', to: '/ict/security', icon: FaShieldAlt },
        { label: 'Server health', to: '/ict/server', icon: FaServer },
        { label: 'Database', to: '/ict/database', icon: FaDatabase },
        { label: 'Maintenance', to: '/ict/maintenance', icon: FaTools },
        { label: 'Settings', to: '/ict/settings', icon: FaCog },
    ],
}

const roleLabel: Record<Role, string> = {
    admin: 'Administrator',
    student: 'Student',
    lecturer: 'Lecturer',
    employee: 'Employee',
    ict: 'ICT Officer',
}

const Avatar = ({ user, size }: { user: User; size: string }) => (
    <div
        className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-400 bg-green-200 text-green-900`}
    >
        {user.photo ? (
            <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
        ) : (
            <FaUser className="h-1/2 w-1/2" aria-label={user.name} />
        )}
    </div>
)

const ProfileMenu = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const base = `/${user.role}`

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [])

    const items = [
        { label: 'My profile', to: `${base}/profile`, icon: FaUser },
        { label: 'Account settings', to: `${base}/account`, icon: FaCog },
        { label: 'Change password', to: `${base}/password`, icon: FaLock },
        { label: 'Activity log', to: `${base}/activity`, icon: FaHistory },
        { label: 'Help center', to: `${base}/help`, icon: FaQuestionCircle },
    ]

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1 transition-colors ${open ? 'border-gray-200 bg-green-50' : 'border-transparent hover:bg-green-50'
                    }`}
            >
                <Avatar user={user} size="h-8 w-8" />
                <div className="hidden text-left leading-tight sm:block">
                    <p className="text-sm font-medium text-green-950">{user.name.split(' ')[0]}</p>
                    <p className="text-xs text-gray-500">{roleLabel[user.role]}</p>
                </div>
                <FaChevronDown
                    className={`h-3 w-3 text-green-900 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                >
                    <div className="border-b border-gray-100 bg-green-50 p-4">
                        <div className="flex items-center gap-3">
                            <Avatar user={user} size="h-10 w-10" />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-green-950">{user.name}</p>
                                <p className="truncate text-xs text-gray-500">{user.email}</p>
                            </div>
                        </div>
                        <span className="mt-3 inline-block rounded bg-amber-400 px-2 py-0.5 text-xs font-semibold text-green-950">
                            {roleLabel[user.role]}
                        </span>
                    </div>

                    <div className="py-1">
                        {items.map(({ label, to, icon: Icon }) => (
                            <Link
                                key={label}
                                to={to}
                                role="menuitem"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                            >
                                <Icon className="h-4 w-4 text-green-900" />
                                {label}
                            </Link>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 py-1">
                        <button
                            type="button"
                            role="menuitem"
                            onClick={onLogout}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                            <FaSignOutAlt className="h-4 w-4" />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

const DashboardLayout = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const application = useContext(ApplicationContext)
    // const approved = application ? application.app.approved : true
    // const approved = application ? application.app.approved : true
    const approved = application ? application.app?.status === 'approved' : true

    // Close the mobile sidebar after navigating
    useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname])

    if (!user) return null // ProtectedRoute redirects before this renders

    // const handleLogout = () => {
    //     logout()
    //     navigate('/login', { replace: true })
    // }
    const handleLogout = async () => {
        await logout()
        navigate('/login', { replace: true })
    }

    const nav = navByRole[user.role]

    return (
        <div className="min-h-screen bg-green-50/50 lg:pl-64">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-green-950 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between px-4 py-4">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo} alt="UHWF logo" className="h-9 w-auto" />
                        <div className="leading-tight">
                            <p className="text-sm font-bold text-white">UHWF</p>
                            <p className="text-xs text-green-200">{roleLabel[user.role]} panel</p>
                        </div>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close menu"
                        className="rounded p-1 text-green-100 hover:bg-white/10 lg:hidden"
                    >
                        <FaTimes className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-2">
                    {nav.map(({ label, to, icon: Icon, end, needsApproval }) => {
                        if (needsApproval && !approved) {
                            return (
                                <div
                                    key={to}
                                    title="Unlocks after your application is approved"
                                    className="mb-0.5 flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-green-100/50"
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {label}
                                    <FaLock className="ml-auto h-3 w-3" />
                                </div>
                            )
                        }
                        return (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({ isActive }) =>
                                    `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive
                                        ? 'bg-amber-400 font-semibold text-green-950'
                                        : 'text-green-100 hover:bg-white/10'
                                    }`
                                }
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {label}
                            </NavLink>
                        )
                    })}
                </nav>

                {/* Profile + logout */}
                <div className="border-t border-white/15 p-4">
                    <div className="mb-3 flex items-center gap-3">
                        <Avatar user={user} size="h-11 w-11" />
                        <div className="min-w-0 leading-tight">
                            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                            <p className="truncate text-xs text-green-200">{user.email}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:border-red-500 hover:bg-red-500"
                    >
                        <FaSignOutAlt className="h-4 w-4" />
                        Log out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex min-h-screen flex-col">
                <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2.5 sm:px-6">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                        className="rounded-md p-2 text-green-950 hover:bg-green-50 lg:hidden"
                    >
                        <FaBars className="h-5 w-5" />
                    </button>

                    <div className="hidden max-w-xs flex-1 items-center gap-2 rounded-lg bg-green-50 px-3 sm:flex">
                        <FaSearch className="h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users, courses"
                            aria-label="Search"
                            className="w-full bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        {/* <button
                            type="button"
                            aria-label="Notifications"
                            className="relative rounded-full p-2 text-green-950 hover:bg-green-50"
                        >
                            <FaBell className="h-5 w-5" />
                            <span className="absolute right-0.5 top-0 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                                4
                            </span>
                        </button> */}
                        <NotificationBell />
                        <ProfileMenu user={user} onLogout={handleLogout} />
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default DashboardLayout