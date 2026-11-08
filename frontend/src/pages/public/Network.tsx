import { Link } from 'react-router-dom'
import type { IconType } from 'react-icons'
import {
    FaBalanceScale,
    FaBook,
    FaBuilding,
    FaCheckCircle,
    FaComments,
    FaGlobeAfrica,
    FaHandHoldingHeart,
    FaHandshake,
    FaLandmark,
    FaNetworkWired,
    FaShareAlt,
    FaUniversity,
    FaUsers,
} from 'react-icons/fa'

type Card = { title: string; text: string; icon: IconType }

const WHY: Card[] = [
    {
        title: 'Problems cross borders',
        text: 'Wildlife, rivers and climate do not stop at a village or district line. Solving them takes people working across places.',
        icon: FaGlobeAfrica,
    },
    {
        title: 'No one has every answer',
        text: 'Communities, researchers, authorities and organisations each know something the others need.',
        icon: FaComments,
    },
    {
        title: 'Together we reach further',
        text: 'Shared knowledge, skills and effort help good ideas grow beyond the place where they started.',
        icon: FaShareAlt,
    },
]

const PARTNERS: Card[] = [
    {
        title: 'Communities and local groups',
        text: 'Village leaders, conservation groups, farmers, herders, women and youth groups.',
        icon: FaUsers,
    },
    {
        title: 'Government and local authorities',
        text: 'Offices responsible for land, wildlife, forests, water and local development.',
        icon: FaLandmark,
    },
    {
        title: 'Universities and researchers',
        text: 'Students, lecturers and research teams who study land, wildlife and communities.',
        icon: FaUniversity,
    },
    {
        title: 'Organisations and networks',
        text: 'Other NGOs, community-based organisations and networks working on similar goals.',
        icon: FaNetworkWired,
    },
    {
        title: 'Businesses and funders',
        text: 'Companies and supporters who want to back conservation that works for people.',
        icon: FaBuilding,
    },
    {
        title: 'Individuals and volunteers',
        text: 'Anyone with time, skills or ideas who wants to help protect Tanzania\'s land and wildlife.',
        icon: FaHandHoldingHeart,
    },
]

const ACTIVITIES: Card[] = [
    {
        title: 'Connect',
        text: 'We bring communities, specialists and decision makers into the same conversation.',
        icon: FaHandshake,
    },
    {
        title: 'Share knowledge',
        text: 'We pass on what we learn from research and community work, in clear and plain language.',
        icon: FaBook,
    },
    {
        title: 'Build skills',
        text: 'We support training and learning so partners can lead work in their own areas.',
        icon: FaUsers,
    },
    {
        title: 'Speak together',
        text: 'We help community and partner voices be heard when decisions about land and wildlife are made.',
        icon: FaBalanceScale,
    },
]

const STEPS: Card[] = [
    {
        title: 'Say hello',
        text: 'Contact us and tell us who you are and what you work on.',
        icon: FaComments,
    },
    {
        title: 'Find common ground',
        text: 'We talk about where our goals meet and what each side can offer.',
        icon: FaHandshake,
    },
    {
        title: 'Agree how to work',
        text: 'Together we decide what to do, who does what, and how we will share results.',
        icon: FaBalanceScale,
    },
    {
        title: 'Work and review',
        text: 'We carry out the work and look back honestly at what is working.',
        icon: FaNetworkWired,
    },
]

const PRINCIPLES = [
    'Partnerships are built on respect and honesty',
    'Every partner is treated as an equal',
    'Communities stay at the centre of the work',
    'Roles, credit and results are agreed openly',
    'We share what we learn',
]

const Network = () => (
    <div>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700">
            <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-amber-400/20" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-green-500/20" />
            <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-green-950">
                    <FaNetworkWired className="h-3.5 w-3.5" /> Building Network
                </span>
                <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                    Stronger together
                </h1>
                <p className="mt-3 text-xl font-semibold text-amber-300">Pamoja tunaweza zaidi.</p>
                <p className="mt-5 max-w-2xl text-lg text-green-50">
                    UHWF connects communities, researchers, authorities and organisations, so that knowledge and
                    effort for Tanzania's land and wildlife are shared and not repeated.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        to="/contact"
                        className="rounded-lg bg-amber-400 px-8 py-3 font-semibold text-green-950 shadow-sm transition-colors hover:bg-amber-300"
                    >
                        Become a partner
                    </Link>
                    <a
                        href="#who-we-work-with"
                        className="rounded-lg border border-white/70 px-8 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                    >
                        Who we work with
                    </a>
                </div>
            </div>
        </section>

        {/* Why networking */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-green-900">Why networks matter</h2>
            <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

            <div className="mt-8 grid gap-4 md:grid-cols-3">
                {WHY.map(({ title, text, icon: Icon }) => (
                    <div key={title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-800">
                            <Icon className="h-6 w-6" />
                        </span>
                        <h3 className="mt-4 font-bold text-green-950">{title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* Who we work with */}
        <section id="who-we-work-with" className="scroll-mt-20 bg-green-50 py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-green-900">Who we welcome</h2>
                <div className="mt-2 h-1 w-14 rounded bg-amber-400" />
                <p className="mt-3 max-w-2xl text-gray-600">
                    Our network is open to anyone who shares our aim of land and wildlife that work for people.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {PARTNERS.map(({ title, text, icon: Icon }) => (
                        <div
                            key={title}
                            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-800 transition-colors group-hover:bg-amber-400 group-hover:text-green-950">
                                <Icon className="h-6 w-6" />
                            </span>
                            <h3 className="mt-4 font-bold text-green-950">{title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-gray-600">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* What we do */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-green-900">What a network does</h2>
            <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {ACTIVITIES.map(({ title, text, icon: Icon }) => (
                    <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
                        <Icon className="mx-auto h-7 w-7 text-green-700" />
                        <h3 className="mt-3 font-bold text-green-950">{title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{text}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* How to partner */}
        <section className="bg-green-50 py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-green-900">How to partner with us</h2>
                <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

                <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {STEPS.map(({ title, text, icon: Icon }, i) => (
                        <li key={title} className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
                            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 font-bold text-green-950">
                                {i + 1}
                            </span>
                            <Icon className="mx-auto mt-4 h-6 w-6 text-green-700" />
                            <h3 className="mt-3 font-bold text-green-950">{title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-gray-600">{text}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>

        {/* Principles */}
        <section className="bg-green-900 py-14">
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                <div>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-green-950">
                        <FaHandshake className="h-7 w-7" />
                    </span>
                    <h2 className="mt-5 text-3xl font-bold text-white">How we build partnerships</h2>
                    <p className="mt-3 text-green-100">
                        A network is only as strong as the trust inside it. These are the promises we hold ourselves to.
                    </p>
                </div>
                <ul className="space-y-3">
                    {PRINCIPLES.map((p) => (
                        <li key={p} className="flex items-start gap-3 rounded-xl bg-white/10 p-4 text-white">
                            <FaCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                            <span>{p}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>

        {/* Call to action */}
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-green-900">Let us work together</h2>
            <p className="mt-3 text-gray-600">
                Organisations, researchers, community groups and individuals are welcome to contact UHWF to talk about
                joining our network.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                    to="/contact"
                    className="rounded-lg bg-amber-400 px-7 py-3 font-semibold text-green-950 transition-colors hover:bg-amber-300"
                >
                    Contact us
                </Link>
                <Link
                    to="/services/community"
                    className="rounded-lg border border-green-900 px-7 py-3 font-semibold text-green-900 transition-colors hover:bg-green-50"
                >
                    Community work
                </Link>
                <Link
                    to="/wildlife"
                    className="rounded-lg border border-green-900 px-7 py-3 font-semibold text-green-900 transition-colors hover:bg-green-50"
                >
                    Wildlife research
                </Link>
            </div>
        </section>
    </div>
)

export default Network