import { Link } from 'react-router-dom'
import logo from '../assets/uhwf-logo.webp'
import {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
    FaXTwitter,
    FaWhatsapp,
    FaLocationDot,
    FaPhone,
    FaEnvelope,
} from 'react-icons/fa6'

const usefulLinks = [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    { label: 'Our Team', to: '/team' },
    { label: 'Career Center', to: '/career' },
    { label: 'Video Gallery', to: '/video-gallery' },
]

const services = [
    { label: 'Land Use Planning', to: '/land' },
    { label: 'Wildlife Research', to: '/wildlife' },
    { label: 'Build Community', to: '/services/community' },
    { label: 'Building Network', to: '/network' },
    { label: 'Innovations Hub', to: '/services/innovations' },
]

const support = [
    { label: 'Help Center', to: '/help' },
    { label: 'ICT Services', to: '/ict' },
    { label: 'Contact Us', to: '/contact' },
]

const socials = [
    {
        label: 'Facebook',
        href: 'https://www.facebook.com/profile.php?id=61564643794385',
        icon: FaFacebookF,
    },
    {
        label: 'Instagram',
        href: 'https://www.instagram.com/uhwftanzania',
        icon: FaInstagram,
    },
    {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/uhwf-tanzania-1b28bb332',
        icon: FaLinkedinIn,
    },
    { label: 'X', href: 'https://x.com/Uhwf_tanzania', icon: FaXTwitter },
    {
        label: 'WhatsApp',
        href: 'https://chat.whatsapp.com/JlKM53wnVlM0yr86tVFy8D',
        icon: FaWhatsapp,
    },
]

const LinkList = ({
    title,
    links,
}: {
    title: string
    links: { label: string; to: string }[]
}) => (
    <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            {title}
        </h3>
        <ul className="mt-4 space-y-2">
            {links.map((link) => (
                <li key={link.label}>
                    <Link
                        to={link.to}
                        className="text-sm text-green-100/80 transition-colors hover:text-white"
                    >
                        {link.label}
                    </Link>
                </li>
            ))}
        </ul>
    </div>
)

const Footer = () => {
    return (
        <footer className="bg-green-950 text-green-100">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
                    {/* About + socials */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2">
                            <img
                                src={logo}
                                alt="UHWF logo"
                                className="h-10 w-auto"
                            />
                            <span className="text-lg font-bold text-white">UHWF-TANZANIA</span>
                        </Link>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-green-100/80">
                            Universal Human-Wildlife Foundation — an NGO working to protect
                            Tanzania's land, wildlife and communities through participatory
                            land use planning, research, advocacy and local empowerment.
                        </p>
                        <div className="mt-5 flex gap-3">
                            {socials.map(({ label, href, icon: Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-green-900 text-green-100 transition-colors hover:bg-green-600 hover:text-white"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <LinkList title="Useful Links" links={usefulLinks} />
                    <LinkList title="Our Services" links={services} />

                    {/* Support + contact */}
                    <div>
                        <LinkList title="Support" links={support} />
                    </div>
                </div>

                {/* Contact row */}
                <div className="mt-10 grid gap-4 border-t border-green-900 pt-8 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-start gap-3">
                        <FaLocationDot className="mt-1 h-4 w-4 shrink-0 text-green-400" />
                        <span>
                            P.O. BOX 35864, Ubungo
                            <br />
                            Dar es Salaam, Tanzania
                        </span>
                    </div>
                    <div className="flex items-start gap-3">
                        <FaPhone className="mt-1 h-4 w-4 shrink-0 text-green-400" />
                        <span>
                            <a href="tel:+255716113759" className="hover:text-white">
                                +255 716 113 759
                            </a>
                            <br />
                            <a href="tel:+255733699520" className="hover:text-white">
                                +255 733 699 520
                            </a>
                        </span>
                    </div>
                    <div className="flex items-start gap-3">
                        <FaEnvelope className="mt-1 h-4 w-4 shrink-0 text-green-400" />
                        <span>
                            <a href="mailto:info@uhwf.or.tz" className="hover:text-white">
                                info@uhwf.or.tz
                            </a>
                            <br />
                            <a href="mailto:helpdesk@uhwf.or.tz" className="hover:text-white">
                                helpdesk@uhwf.or.tz
                            </a>
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-green-900">
                <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-green-100/60 sm:px-6 lg:px-8">
                    © {new Date().getFullYear()} UHWF-TANZANIA. All rights reserved.
                </div>
            </div>
        </footer>
    )
}

export default Footer