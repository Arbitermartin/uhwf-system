import { Link } from 'react-router-dom'
import type { IconType } from 'react-icons'
import {
    FaBullhorn,
    FaChalkboardTeacher,
    FaCheckCircle,
    FaClipboardCheck,
    FaComments,
    FaGlobeAfrica,
    FaHandsHelping,
    FaHandshake,
    FaLightbulb,
    FaRecycle,
    FaSeedling,
    FaTree,
    FaUsers,
} from 'react-icons/fa'

type Card = { title: string; text: string; icon: IconType }

const WHY: Card[] = [
    {
        title: 'Communities know the land',
        text: 'People who live beside forests, rivers and wildlife understand them best. Lasting conservation starts with them.',
        icon: FaUsers,
    },
    {
        title: 'Local ownership lasts',
        text: 'Work that the community plans and runs itself continues long after any project ends.',
        icon: FaHandshake,
    },
    {
        title: 'Everyone has a role',
        text: 'Women, youth, farmers, herders and leaders all have knowledge and strength to bring.',
        icon: FaHandsHelping,
    },
]

const PROGRAMMES: Card[] = [
    {
        title: 'Tree planting and conservation',
        text: 'Communities plant, care for and protect trees together, from seedling nurseries to protecting forests and river banks.',
        icon: FaTree,
    },
    {
        title: 'Waste management',
        text: 'Clean-up days, sorting and recycling, and safe disposal, so that villages and towns stay clean and healthy.',
        icon: FaRecycle,
    },
    {
        title: 'Climate awareness',
        text: 'Helping people understand a changing climate and the simple steps that protect farms, water and homes.',
        icon: FaGlobeAfrica,
    },
    {
        title: 'Training and skills',
        text: 'Practical training so community members can lead conservation work in their own areas.',
        icon: FaChalkboardTeacher,
    },
    {
        title: 'Local conservation groups',
        text: 'Supporting community groups to organise, make decisions together and speak for their area.',
        icon: FaSeedling,
    },
    {
        title: 'Community voice',
        text: 'Making sure community views are heard when plans are made about land, wildlife and natural resources.',
        icon: FaBullhorn,
    },
]

const STEPS: Card[] = [
    {
        title: 'Listen first',
        text: 'We meet community members and leaders to hear what matters to them, before we suggest anything.',
        icon: FaComments,
    },
    {
        title: 'Plan together',
        text: 'The community and UHWF agree on what to do, who does what, and how to know whether it works.',
        icon: FaClipboardCheck,
    },
    {
        title: 'Act together',
        text: 'People carry out the work side by side, with training and support from UHWF where it is needed.',
        icon: FaHandsHelping,
    },
    {
        title: 'Review and hand over',
        text: 'We look back together at what worked, and the community keeps leading the work.',
        icon: FaSeedling,
    },
]

const GET_INVOLVED = [
    {
        title: 'Share an idea',
        text: 'Have a bright idea for your community? Send it to us.',
        to: '/services/innovations',
        action: 'Share your idea',
        icon: FaLightbulb,
    },
    {
        title: 'Work with us',
        text: 'Community groups, schools, leaders and partners can talk to us about working together.',
        to: '/contact',
        action: 'Contact us',
        icon: FaHandshake,
    },
    {
        title: 'Join the team',
        text: 'See our open positions and volunteer opportunities.',
        to: '/career',
        action: 'View careers',
        icon: FaUsers,
    },
    {
        title: 'Support our work',
        text: 'Your gift helps us reach more communities.',
        to: '/donate',
        action: 'Donate',
        icon: FaHandsHelping,
    },
]

const PRINCIPLES = [
    'The community leads and UHWF supports',
    'Everyone is invited, including women and youth',
    'Decisions are made openly and together',
    'We share what we learn with the people we work with',
    'We build skills that stay in the community',
]

const Community = () => (
    <div>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700">
            <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-amber-400/20" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-green-500/20" />
            <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-green-950">
                    <FaUsers className="h-3.5 w-3.5" /> Community Engagement
                </span>
                <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                    Communities leading conservation
                </h1>
                <p className="mt-3 text-xl font-semibold text-amber-300">Jamii zinazoongoza uhifadhi.</p>
                <p className="mt-5 max-w-2xl text-lg text-green-50">
                    UHWF empowers local communities to lead conservation in their own areas, so that people, land and
                    wildlife can all thrive together.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        to="/contact"
                        className="rounded-lg bg-amber-400 px-8 py-3 font-semibold text-green-950 shadow-sm transition-colors hover:bg-amber-300"
                    >
                        Work with us
                    </Link>
                    <a
                        href="#what-we-do"
                        className="rounded-lg border border-white/70 px-8 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                    >
                        What we do
                    </a>
                </div>
            </div>
        </section>

        {/* Why communities */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-green-900">Why we start with communities</h2>
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

        {/* Programmes */}
        <section id="what-we-do" className="scroll-mt-20 bg-green-50 py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-green-900">What we do with communities</h2>
                <div className="mt-2 h-1 w-14 rounded bg-amber-400" />
                <p className="mt-3 max-w-2xl text-gray-600">
                    Our community work grows from what each place needs. These are the main areas.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {PROGRAMMES.map(({ title, text, icon: Icon }) => (
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

        {/* How we work */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-green-900">How we work with you</h2>
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
        </section>

        {/* Principles */}
        <section className="bg-green-900 py-14">
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                <div>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-green-950">
                        <FaHandshake className="h-7 w-7" />
                    </span>
                    <h2 className="mt-5 text-3xl font-bold text-white">How we treat communities</h2>
                    <p className="mt-3 text-green-100">
                        Trust is the base of all our community work. These are the promises we hold ourselves to.
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

        {/* Get involved */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-green-900">Get involved</h2>
            <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {GET_INVOLVED.map(({ title, text, to, action, icon: Icon }) => (
                    <div key={title} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-800">
                            <Icon className="h-6 w-6" />
                        </span>
                        <h3 className="mt-4 font-bold text-green-950">{title}</h3>
                        <p className="mt-1 flex-1 text-sm leading-relaxed text-gray-600">{text}</p>
                        <Link to={to} className="mt-4 text-sm font-semibold text-green-800 hover:underline">
                            {action} →
                        </Link>
                    </div>
                ))}
            </div>
        </section>

        {/* Call to action */}
        <section className="bg-green-800 py-14">
            <div className="mx-auto max-w-3xl px-4 text-center">
                <h2 className="text-3xl font-bold text-white">Is your community ready to lead?</h2>
                <p className="mt-3 text-green-100">
                    Village leaders and community groups are welcome to contact UHWF to talk about working together.
                </p>
                <Link
                    to="/contact"
                    className="mt-6 inline-block rounded-lg bg-amber-400 px-7 py-3 font-semibold text-green-950 transition-colors hover:bg-amber-300"
                >
                    Contact us
                </Link>
            </div>
        </section>
    </div>
)

export default Community