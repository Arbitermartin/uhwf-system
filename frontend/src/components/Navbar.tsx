
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HiMenu, HiX, HiChevronDown } from 'react-icons/hi'
import { FaEnvelope, FaPhoneAlt } from 'react-icons/fa'
import logo from '../assets/uhwf-logo.webp'

// PLACEHOLDER phone number: put UHWF's real number here.
const CONTACT = { phone: '+255 733 699 520', email: 'info@uhwf.or.tz' }

type NavItem = {
    labelKey: string
    to?: string
    children?: { labelKey: string; to: string }[]
}

const navItems: NavItem[] = [
    { labelKey: 'nav.home', to: '/' },
    { labelKey: 'nav.about', to: '/about' },
    {
        labelKey: 'nav.ictSystems',
        children: [
            { labelKey: 'nav.careerConnect', to: '/careerconnect' },
            { labelKey: 'nav.elearning', to: '/e-learning' },
            { labelKey: 'nav.admission', to: '/admission' },
            { labelKey: 'nav.members', to: '/become-a-member' },
        ],
    },
    {
        labelKey: 'nav.services',
        children: [
            { labelKey: 'nav.land', to: '/land' },
            { labelKey: 'nav.wildlife', to: '/wildlife' },
            { labelKey: 'nav.community', to: '/services/community' },
            { labelKey: 'nav.network', to: '/network' },
            { labelKey: 'nav.innovations', to: '/services/innovations' },
        ],
    },
    { labelKey: 'nav.team', to: '/team' },
    { labelKey: 'nav.contact', to: '/contact' },
    {
        labelKey: 'nav.resources',
        children: [
            { labelKey: 'nav.videoGallery', to: '/video-gallery' },
            { labelKey: 'nav.careerCenter', to: '/career' },
        ],
    },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
        ? 'text-green-700 bg-green-50'
        : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
    }`

const localeFor = (lng: string) => (lng.startsWith('sw') ? 'sw-TZ' : 'en-GB')

function Clock() {
    const { i18n } = useTranslation()
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000)
        return () => window.clearInterval(id)
    }, [])

    const { time, date } = useMemo(() => {
        const locale = localeFor(i18n.language)
        return {
            time: new Intl.DateTimeFormat(locale, {
                timeZone: 'Africa/Dar_es_Salaam', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
            }),
            date: new Intl.DateTimeFormat(locale, {
                timeZone: 'Africa/Dar_es_Salaam', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            }),
        }
    }, [i18n.language])

    return (
        <div className="flex shrink-0 items-center gap-3 text-sm">
            <span className="hidden lg:inline">{date.format(now)}</span>
            <span className="font-semibold tabular-nums">{time.format(now)}</span>
            <span className="hidden text-xs text-green-100 sm:inline">EAT</span>
        </div>
    )
}

function TopBar() {
    const { t, i18n } = useTranslation()
    const phoneHref = CONTACT.phone.replace(/[^\d+]/g, '')
    const current = i18n.language.startsWith('sw') ? 'sw' : 'en'

    return (
        <div className="bg-green-700 text-white">
            <div className="mx-auto flex h-10 max-w-7xl items-center justify-between gap-4 px-4 text-sm sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                    <span className="hidden font-medium md:inline">{t('topbar.office')}</span>
                    <a href={`tel:${phoneHref}`} aria-label={`${t('common.callUs')} ${CONTACT.phone}`}
                        className="flex shrink-0 items-center gap-2 transition-colors hover:text-amber-300">
                        <FaPhoneAlt className="h-3 w-3" />
                        <span className="hidden sm:inline">{CONTACT.phone}</span>
                        <span className="sm:hidden">{t('common.callUs')}</span>
                    </a>
                    <a href={`mailto:${CONTACT.email}`} aria-label={CONTACT.email}
                        className="flex min-w-0 items-center gap-2 transition-colors hover:text-amber-300">
                        <FaEnvelope className="h-3 w-3 shrink-0" />
                        <span className="truncate">{CONTACT.email}</span>
                    </a>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                    <Clock />
                    <select
                        value={current}
                        onChange={(e) => void i18n.changeLanguage(e.target.value)}
                        aria-label={t('common.language')}
                        className="rounded border border-green-500 bg-green-800 px-2 py-1 text-sm text-white outline-none focus:ring-2 focus:ring-amber-300"
                    >
                        <option value="en">Eng</option>
                        <option value="sw">Swa</option>
                    </select>
                </div>
            </div>
        </div>
    )
}

function DesktopDropdown({ item }: { item: NavItem }) {
    const { t } = useTranslation()
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
        <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-green-700 hover:bg-green-50">
                {t(item.labelKey)}
                <HiChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 w-64 pt-1">
                    <ul className="rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                        {item.children!.map((child) => (
                            <li key={child.to}>
                                <Link to={child.to} onClick={() => setOpen(false)}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">
                                    {t(child.labelKey)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

function MobileDropdown({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    return (
        <div>
            <button type="button" onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:bg-green-50">
                {t(item.labelKey)}
                <HiChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="ml-4 border-l-2 border-green-100 pl-2">
                    {item.children!.map((child) => (
                        <Link key={child.to} to={child.to} onClick={onNavigate}
                            className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-green-50 hover:text-green-700">
                            {t(child.labelKey)}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

const Navbar = () => {
    const { t } = useTranslation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const location = useLocation()

    useEffect(() => {
        setMobileOpen(false)
    }, [location.pathname])

    return (
        <>
            <TopBar />

            <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
                <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo} alt="UHWF logo" className="h-10 w-auto" />
                        <span className="text-lg font-bold text-green-800">UHWF-TANZANIA</span>
                    </Link>

                    <div className="hidden items-center gap-1 lg:flex">
                        {navItems.map((item) =>
                            item.children ? (
                                <DesktopDropdown key={item.labelKey} item={item} />
                            ) : (
                                <NavLink key={item.labelKey} to={item.to!} end={item.to === '/'} className={linkClass}>
                                    {t(item.labelKey)}
                                </NavLink>
                            ),
                        )}
                        <Link to="/donate"
                            className="ml-3 rounded-md bg-amber-400 px-5 py-2 font-semibold text-green-950 transition-colors hover:bg-amber-300">
                            {t('common.donate')}
                        </Link>
                        <Link to="/login"
                            className="ml-3 rounded-md bg-green-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800">
                            {t('common.login')}
                        </Link>
                    </div>

                    <button type="button" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" aria-expanded={mobileOpen}
                        className="rounded-md p-2 text-gray-700 hover:bg-green-50 lg:hidden">
                        {mobileOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
                    </button>
                </nav>

                {mobileOpen && (
                    <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 lg:hidden">
                        <div className="space-y-1">
                            {navItems.map((item) =>
                                item.children ? (
                                    <MobileDropdown key={item.labelKey} item={item} onNavigate={() => setMobileOpen(false)} />
                                ) : (
                                    <NavLink key={item.labelKey} to={item.to!} end={item.to === '/'}
                                        className={({ isActive }) =>
                                            `block px-3 py-2 text-base font-medium rounded-md ${isActive ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-green-50'}`
                                        }>
                                        {t(item.labelKey)}
                                    </NavLink>
                                ),
                            )}
                            <Link to="/donate"
                                className="mt-2 block rounded-md bg-amber-400 px-3 py-2 text-center font-semibold text-green-950 transition-colors hover:bg-amber-300">
                                {t('common.donate')}
                            </Link>
                            <Link to="/login"
                                className="mt-2 block rounded-md bg-green-700 px-3 py-2 text-center text-base font-semibold text-white hover:bg-green-800">
                                {t('common.login')}
                            </Link>
                        </div>
                    </div>
                )}
            </header>
        </>
    )
}

export default Navbar