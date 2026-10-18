import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaLinkedinIn, FaEnvelope, FaUsers } from 'react-icons/fa'

type Department = 'Research' | 'Field operations' | 'Community' | 'ICT and admin'

type Member = {
    id: number
    name: string
    role: string
    bio?: string
    department?: Department // leave out for leadership
    photo?: string // e.g. imported from src/assets/team/amina.webp
    email?: string
    linkedin?: string
    leadership?: boolean
}

// Sample data: replace with the real UHWF team.
// To use a photo: import it at the top, e.g.
//   import amina from '../../assets/team/amina.webp'
// then set  photo: amina
const members: Member[] = [
    {
        id: 1,
        name: 'Amina Mushi',
        role: 'Executive Director',
        bio: 'Leads UHWF strategy and partnerships across Tanzania.',
        email: 'info@uhwf.or.tz',
        leadership: true,
    },
    {
        id: 2,
        name: 'Juma Kimaro',
        role: 'Programs Director',
        bio: 'Oversees land use planning and wildlife research programs.',
        email: 'info@uhwf.or.tz',
        leadership: true,
    },
    {
        id: 3,
        name: 'Neema Mollel',
        role: 'Research Officer',
        department: 'Research',
        email: 'info@uhwf.or.tz',
    },
    {
        id: 4,
        name: 'Hassan Said',
        role: 'Conservation Field Officer',
        department: 'Field operations',
        email: 'info@uhwf.or.tz',
    },
    {
        id: 5,
        name: 'Grace Lyimo',
        role: 'Community Outreach Lead',
        department: 'Community',
        email: 'info@uhwf.or.tz',
    },
    {
        id: 6,
        name: 'Daniel Mwakyusa',
        role: 'ICT Officer',
        department: 'ICT and admin',
        email: 'helpdesk@uhwf.or.tz',
    },
    {
        id: 7,
        name: 'Furaha Ndege',
        role: 'Data Analyst',
        department: 'Research',
        email: 'info@uhwf.or.tz',
    },
    {
        id: 8,
        name: 'Emmanuel Oloo',
        role: 'Wildlife Ranger',
        department: 'Field operations',
        email: 'info@uhwf.or.tz',
    },
    {
        id: 9,
        name: 'Salma Bakari',
        role: 'Training Coordinator',
        department: 'Community',
        email: 'info@uhwf.or.tz',
    },
    {
        id: 10,
        name: 'Rehema Tarimo',
        role: 'Office Administrator',
        department: 'ICT and admin',
        email: 'info@uhwf.or.tz',
    },
]

const departments: ('All' | Department)[] = [
    'All',
    'Research',
    'Field operations',
    'Community',
    'ICT and admin',
]

// Soft background colors for initials avatars
const avatarColors = [
    'bg-green-200',
    'bg-amber-100',
    'bg-emerald-200',
    'bg-lime-200',
    'bg-green-100',
]

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')

const Avatar = ({
    member,
    size,
    dark = false,
}: {
    member: Member
    size: string
    dark?: boolean
}) => {
    const base = `${size} shrink-0 rounded-full border-4 border-amber-400 object-cover`
    if (member.photo) {
        return <img src={member.photo} alt={member.name} className={base} />
    }
    const color = dark ? 'bg-green-900 text-white' : `${avatarColors[member.id % avatarColors.length]} text-green-950`
    return (
        <div
            className={`${base} flex items-center justify-center font-semibold ${color}`}
            aria-label={member.name}
        >
            {initials(member.name)}
        </div>
    )
}

const Socials = ({ member, align = 'center' }: { member: Member; align?: 'center' | 'start' }) => {
    if (!member.linkedin && !member.email) return null
    const link =
        'flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-900 transition-colors hover:bg-green-900 hover:text-white'
    return (
        <div className={`mt-3 flex gap-2 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
            {member.linkedin && (
                <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} on LinkedIn`}
                    className={link}
                >
                    <FaLinkedinIn className="h-3.5 w-3.5" />
                </a>
            )}
            {member.email && (
                <a href={`mailto:${member.email}`} aria-label={`Email ${member.name}`} className={link}>
                    <FaEnvelope className="h-3.5 w-3.5" />
                </a>
            )}
        </div>
    )
}

const SectionTitle = ({ children }: { children: string }) => (
    <div>
        <h2 className="text-2xl font-bold text-green-900">{children}</h2>
        <div className="mt-2 h-1 w-14 rounded bg-amber-400" />
    </div>
)

const Team = () => {
    const [filter, setFilter] = useState<'All' | Department>('All')

    const leaders = members.filter((m) => m.leadership)
    const people = members
        .filter((m) => !m.leadership)
        .filter((m) => filter === 'All' || m.department === filter)

    return (
        <div>
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-r from-green-50 via-lime-50 to-green-100">
                <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-200/40" />
                <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
                    <h1 className="text-4xl font-extrabold text-green-950 sm:text-5xl">
                        Meet Our Team
                    </h1>
                    <p className="mt-3 max-w-xl text-lg text-gray-700">
                        The people protecting Tanzania's wildlife and working with
                        communities every day.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                {/* Leadership */}
                {leaders.length > 0 && (
                    <section>
                        <SectionTitle>Leadership</SectionTitle>
                        <div className="mt-8 grid gap-6 md:grid-cols-2">
                            {leaders.map((m) => (
                                <article
                                    key={m.id}
                                    className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                                >
                                    <Avatar member={m} size="h-24 w-24 text-3xl" dark />
                                    <div>
                                        <h3 className="text-xl font-bold text-green-950">{m.name}</h3>
                                        <p className="text-sm font-medium text-green-700">{m.role}</p>
                                        {m.bio && (
                                            <p className="mt-2 text-sm leading-relaxed text-gray-600">{m.bio}</p>
                                        )}
                                        <Socials member={m} align="start" />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {/* Team */}
                <section className="mt-16">
                    <SectionTitle>Our People</SectionTitle>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {departments.map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => setFilter(d)}
                                aria-pressed={filter === d}
                                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${filter === d
                                        ? 'border-green-900 bg-green-900 text-white'
                                        : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
                                    }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>

                    {people.length === 0 ? (
                        <div className="mt-8 rounded-xl border border-dashed border-green-200 bg-green-50 p-12 text-center">
                            <FaUsers className="mx-auto h-10 w-10 text-green-300" />
                            <p className="mt-4 text-gray-600">No team members in this department yet.</p>
                        </div>
                    ) : (
                        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {people.map((m) => (
                                <article
                                    key={m.id}
                                    className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <Avatar member={m} size="h-20 w-20 text-2xl" />
                                    <h3 className="mt-4 font-bold text-green-950">{m.name}</h3>
                                    <p className="mt-0.5 text-sm text-gray-500">{m.role}</p>
                                    {m.department && (
                                        <span className="mt-3 rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                            {m.department}
                                        </span>
                                    )}
                                    <Socials member={m} />
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Join banner */}
            <section className="bg-green-900 py-14">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <h2 className="text-3xl font-bold text-white">Want to join our team?</h2>
                    <p className="mt-3 text-green-100">
                        See our open positions and build a career that protects wildlife.
                    </p>
                    <Link
                        to="/career"
                        className="mt-6 inline-block rounded-lg bg-amber-400 px-7 py-3 font-semibold text-green-950 transition-colors hover:bg-amber-300"
                    >
                        View Careers
                    </Link>
                </div>
            </section>
        </div>
    )
}

export default Team