import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { HiMenu, HiX, HiChevronDown } from 'react-icons/hi'
import logo from '../assets/uhwf-logo.webp'

type NavItem = {
    label: string
    to?: string
    children?: { label: string; to: string }[]
}

const navItems: NavItem[] = [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    {
        label: 'Services',
        children: [
            { label: 'Land Use Planning', to: '/land' },
            { label: 'Wildlife Research', to: '/wildlife' },
            { label: 'Build Community', to: '/services/community' },
            { label: 'Building Network', to: '/network' },
            { label: 'Innovations', to: '/services/innovations' },
        ],
    },
    { label: 'Our Team', to: '/team' },
    { label: 'Contact Us', to: '/contact' },
    {
        label: 'Resources',
        children: [
            { label: 'Video Gallery', to: '/video-gallery' },
            { label: 'Career Center', to: '/career' },
        ],
    },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
        ? 'text-green-700 bg-green-50'
        : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
    }`

function DesktopDropdown({ item }: { item: NavItem }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    return (
        <div
            ref={ref}
            className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-green-700 hover:bg-green-50"
            >
                {item.label}
                <HiChevronDown
                    className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 w-56 pt-1">
                    <ul className="rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                        {item.children!.map((child) => (
                            <li key={child.to}>
                                <Link
                                    to={child.to}
                                    onClick={() => setOpen(false)}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                                >
                                    {child.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

function MobileDropdown({
    item,
    onNavigate,
}: {
    item: NavItem
    onNavigate: () => void
}) {
    const [open, setOpen] = useState(false)
    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:bg-green-50"
            >
                {item.label}
                <HiChevronDown
                    className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <div className="ml-4 border-l-2 border-green-100 pl-2">
                    {item.children!.map((child) => (
                        <Link
                            key={child.to}
                            to={child.to}
                            onClick={onNavigate}
                            className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-green-50 hover:text-green-700"
                        >
                            {child.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

const Navbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false)
    const location = useLocation()

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false)
    }, [location.pathname])

    return (
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <img
                        src={logo}
                        alt="UHWF logo"
                        className="h-10 w-auto"
                    />
                    <span className="text-lg font-bold text-green-800">UHWF-TANZANIA</span>
                </Link>

                {/* Desktop menu */}
                <div className="hidden items-center gap-1 lg:flex">
                    {navItems.map((item) =>
                        item.children ? (
                            <DesktopDropdown key={item.label} item={item} />
                        ) : (
                            <NavLink key={item.label} to={item.to!} end={item.to === '/'} className={linkClass}>
                                {item.label}
                            </NavLink>
                        ),
                    )}
                    <Link
                        to="/login"
                        className="ml-3 rounded-md bg-green-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
                    >
                        LOGIN
                    </Link>
                </div>

                {/* Mobile toggle */}
                <button
                    type="button"
                    onClick={() => setMobileOpen((o) => !o)}
                    aria-label="Toggle menu"
                    aria-expanded={mobileOpen}
                    className="rounded-md p-2 text-gray-700 hover:bg-green-50 lg:hidden"
                >
                    {mobileOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
                </button>
            </nav>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 lg:hidden">
                    <div className="space-y-1">
                        {navItems.map((item) =>
                            item.children ? (
                                <MobileDropdown
                                    key={item.label}
                                    item={item}
                                    onNavigate={() => setMobileOpen(false)}
                                />
                            ) : (
                                <NavLink
                                    key={item.label}
                                    to={item.to!}
                                    end={item.to === '/'}
                                    className={({ isActive }) =>
                                        `block px-3 py-2 text-base font-medium rounded-md ${isActive
                                            ? 'bg-green-50 text-green-700'
                                            : 'text-gray-700 hover:bg-green-50'
                                        }`
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ),
                        )}
                        <Link
                            to="/login"
                            className="mt-2 block rounded-md bg-green-700 px-3 py-2 text-center text-base font-semibold text-white hover:bg-green-800"
                        >
                            LOGIN
                        </Link>
                    </div>
                </div>
            )}
        </header>
    )
}

export default Navbar