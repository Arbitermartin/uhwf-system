import { Link } from 'react-router-dom'
import type { IconType } from 'react-icons'
import {
    FaBalanceScale,
    FaBinoculars,
    FaChartBar,
    FaCheckCircle,
    FaClipboardList,
    FaHandshake,
    FaLeaf,
    FaMapMarkedAlt,
    FaPaw,
    FaQuestionCircle,
    FaShareSquare,
    FaUsers,
} from 'react-icons/fa'

type Card = { title: string; text: string; icon: IconType }

const WHY: Card[] = [
    {
        title: 'Facts, not guesses',
        text: 'Good decisions about land and wildlife need good information about where animals live, move and feed.',
        icon: FaBinoculars,
    },
    {
        title: 'People are part of the picture',
        text: 'Farmers, herders and villagers share the land with wildlife. Their experience is an important source of knowledge.',
        icon: FaUsers,
    },
    {
        title: 'Research that gets used',
        text: 'We study questions that communities and decision makers actually face, and share the results in plain language.',
        icon: FaBalanceScale,
    },
]

const TOPICS: Card[] = [
    {
        title: 'Human-wildlife interactions',
        text: 'Understanding when, where and why people and wildlife come into conflict, and what helps them live side by side.',
        icon: FaPaw,
    },
    {
        title: 'Habitat and movement',
        text: 'Looking at the places wildlife needs and the routes animals use, so they can be considered in land plans.',
        icon: FaMapMarkedAlt,
    },
    {
        title: 'Land use and wildlife',
        text: 'Studying how farming, grazing and settlement affect wildlife, and how planning can reduce the pressure.',
        icon: FaLeaf,
    },
    {
        title: 'Community knowledge',
        text: 'Recording what local people know and observe, and combining it with other research methods.',
        icon: FaUsers,
    },
]

const STEPS: Card[] = [
    {
        title: 'Start with a question',
        text: 'We agree with communities and partners on the question that matters most, and why it matters.',
        icon: FaQuestionCircle,
    },
    {
        title: 'Collect information',
        text: 'We gather information in the field and through interviews, with the consent of the people involved.',
        icon: FaClipboardList,
    },
    {
        title: 'Analyse carefully',
        text: 'We check the information, look for patterns, and are honest about what we do and do not know.',
        icon: FaChartBar,
    },
    {
        title: 'Share the findings',
        text: 'We report back to the community first, then to partners and decision makers, in language everyone can follow.',
        icon: FaShareSquare,
    },
    {
        title: 'Use it in practice',
        text: 'Findings feed into land use plans, advocacy and community action, and we check later whether they helped.',
        icon: FaHandshake,
    },
]

const PRINCIPLES = [
    'Communities are partners in research, not just sources of data',
    'People give their consent and are told how their information is used',
    'Findings are shared back with the people who took part',
    'We are honest about the limits of what the research shows',
    'Research serves both people and wildlife',
]

const Wildlife = () => (
    <div>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700">
            <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-amber-400/20" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-green-500/20" />
            <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-green-950">
                    <FaPaw className="h-3.5 w-3.5" /> Wildlife Research
                </span>
                <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                    Understanding wildlife to protect it
                </h1>
                <p className="mt-3 text-xl font-semibold text-amber-300">Utafiti wa wanyamapori kwa ajili ya uhifadhi.</p>
                <p className="mt-5 max-w-2xl text-lg text-green-50">
                    UHWF carries out research on how people and wildlife share the land, so that Tanzania's wildlife
                    heritage can be protected and communities can live safely beside it.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        to="/contact"
                        className="rounded-lg bg-amber-400 px-8 py-3 font-semibold text-green-950 shadow-sm transition-colors hover:bg-amber-300"
                    >
                        Work with us
                    </Link>
                    <a
                        href="#how-we-research"
                        className="rounded-lg border border-white/70 px-8 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                    >
                        How we research
                    </a>
                </div>
            </div>
        </section>

        {/* Why research */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-green-900">Why wildlife research matters</h2>
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

        {/* Topics */}
        <section className="bg-green-50 py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-green-900">What we study</h2>
                <div className="mt-2 h-1 w-14 rounded bg-amber-400" />
                <p className="mt-3 max-w-2xl text-gray-600">
                    Our research looks at the places where people, land and wildlife meet.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {TOPICS.map(({ title, text, icon: Icon }) => (
                        <div
                            key={title}
                            className="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800 transition-colors group-hover:bg-amber-400 group-hover:text-green-950">
                                <Icon className="h-6 w-6" />
                            </span>
                            <div>
                                <h3 className="font-bold text-green-950">{title}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-gray-600">{text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* How we research */}
        <section id="how-we-research" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-green-900">How we do research</h2>
            <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

            <ol className="mt-8 space-y-4">
                {STEPS.map(({ title, text, icon: Icon }, i) => (
                    <li key={title} className="flex gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-green-950">
                            {i + 1}
                        </span>
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-bold text-green-950">
                                <Icon className="h-4 w-4 text-green-700" /> {title}
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed text-gray-600">{text}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>

        {/* Principles */}
        <section className="bg-green-900 py-14">
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                <div>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-green-950">
                        <FaBalanceScale className="h-7 w-7" />
                    </span>
                    <h2 className="mt-5 text-3xl font-bold text-white">Our research principles</h2>
                    <p className="mt-3 text-green-100">
                        Research only helps if people trust it. These are the promises we hold ourselves to.
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
            <h2 className="text-3xl font-bold text-green-900">Work with us on wildlife research</h2>
            <p className="mt-3 text-gray-600">
                Researchers, students, community groups and partners are welcome to contact UHWF to talk about
                working together.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                    to="/contact"
                    className="rounded-lg bg-amber-400 px-7 py-3 font-semibold text-green-950 transition-colors hover:bg-amber-300"
                >
                    Contact us
                </Link>
                <Link
                    to="/land"
                    className="rounded-lg border border-green-900 px-7 py-3 font-semibold text-green-900 transition-colors hover:bg-green-50"
                >
                    Land use planning
                </Link>
                <Link
                    to="/donate"
                    className="rounded-lg border border-green-900 px-7 py-3 font-semibold text-green-900 transition-colors hover:bg-green-50"
                >
                    Support our work
                </Link>
            </div>
        </section>
    </div>
)

export default Wildlife