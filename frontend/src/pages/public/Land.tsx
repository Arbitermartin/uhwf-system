import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { IconType } from 'react-icons'
import {
    FaCheckCircle,
    FaClipboardCheck,
    FaHandshake,
    FaMapMarkedAlt,
    FaPaw,
    FaSeedling,
    FaUsers,
} from 'react-icons/fa'

// Put the picture in  frontend/public/images/land-use-plan.png
const PLAN_IMAGE = '/images/land-use-plan.png'

type Step = { title: string; text: string; icon: IconType }

const STEPS: Step[] = [
    {
        title: 'Meet and agree',
        text: 'We start with village leaders and community meetings, so everyone understands the aim and takes part from day one.',
        icon: FaUsers,
    },
    {
        title: 'Map the land together',
        text: 'People show where the farms, grazing land, forests, water sources and wildlife paths are, using their own knowledge.',
        icon: FaMapMarkedAlt,
    },
    {
        title: 'Agree the zones',
        text: 'The community discusses how each area should be used, and who looks after it, until there is a shared agreement.',
        icon: FaHandshake,
    },
    {
        title: 'Write and approve the plan',
        text: 'The agreement becomes a clear plan with a map. It is shared with the community and the local authorities for approval.',
        icon: FaClipboardCheck,
    },
    {
        title: 'Put it into practice',
        text: 'We support the community to follow the plan, protect the zones, and review it when things change.',
        icon: FaSeedling,
    },
]

const ZONES = [
    { name: 'Farmland', text: 'Land kept for crops and food security.', color: 'bg-yellow-300' },
    { name: 'Grazing land', text: 'Pasture for livestock, away from crops and water sources.', color: 'bg-lime-300' },
    { name: 'Forest and conservation', text: 'Areas protected for trees, soil and wildlife.', color: 'bg-green-500' },
    { name: 'Water and river buffers', text: 'Strips of land kept clear to protect water.', color: 'bg-sky-400' },
    { name: 'Housing and services', text: 'Settlements, schools, clinics and markets.', color: 'bg-orange-300' },
    { name: 'Wildlife corridors', text: 'Routes that let animals move without entering farms.', color: 'bg-emerald-700' },
]

const BENEFITS = [
    'Fewer clashes between people and wildlife',
    'Farmland and water sources that are protected',
    'Clear rules that the whole community agreed to',
    'Fewer land disputes between neighbours',
    'A plan the community owns and can update',
]

const WHAT_IS = [
    {
        title: 'What it is',
        text: 'Land use planning is deciding, together, which land is used for what: farming, grazing, housing, forest, water and wildlife.',
    },
    {
        title: 'Why it matters',
        text: 'When land has no plan, farms, cattle and wildlife compete for the same space. A shared plan lets each have its place.',
    },
    {
        title: 'Why participatory',
        text: 'The people who live on the land know it best. A plan they helped to make is a plan they will follow.',
    },
]

const Land = () => {
    const [imageFailed, setImageFailed] = useState(false)

    return (
        <div>
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700">
                <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-amber-400/20" />
                <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-green-500/20" />
                <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-green-950">
                        <FaMapMarkedAlt className="h-3.5 w-3.5" /> Land Use Planning
                    </span>
                    <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                        Land that works for people and wildlife
                    </h1>
                    <p className="mt-3 text-xl font-semibold text-amber-300">
                        Mipango ya matumizi bora ya ardhi.
                    </p>
                    <p className="mt-5 max-w-2xl text-lg text-green-50">
                        UHWF supports communities across Tanzania to plan how their land is used, so that farms,
                        livestock, water, forests and wildlife can all share the same landscape.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            to="/contact"
                            className="rounded-lg bg-amber-400 px-8 py-3 font-semibold text-green-950 shadow-sm transition-colors hover:bg-amber-300"
                        >
                            Talk to us
                        </Link>
                        <a
                            href="#how-we-work"
                            className="rounded-lg border border-white/70 px-8 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                        >
                            How we work
                        </a>
                    </div>
                </div>
            </section>

            {/* What is it */}
            <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-green-900">What is land use planning?</h2>
                <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {WHAT_IS.map((c) => (
                        <div key={c.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="font-bold text-green-950">{c.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">{c.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Plan picture + zones */}
            <section className="bg-green-50 py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-green-900">What a community plan looks like</h2>
                    <div className="mt-2 h-1 w-14 rounded bg-amber-400" />
                    <p className="mt-3 max-w-2xl text-gray-600">
                        A plan divides the land into zones. This example is only an illustration. Every real plan is
                        drawn by the community for its own land.
                    </p>

                    {!imageFailed && (
                        <figure className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <img
                                src={PLAN_IMAGE}
                                alt="Example land use plan showing forest, farmland, pasture, housing, a market zone, public services, a river with a protected buffer and a main road"
                                loading="lazy"
                                onError={() => setImageFailed(true)}
                                className="h-auto w-full"
                            />
                            <figcaption className="px-4 py-3 text-xs text-gray-500">
                                Illustration only. Not a surveyed boundary.
                            </figcaption>
                        </figure>
                    )}

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {ZONES.map((z) => (
                            <div key={z.name} className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <span className={`mt-1 h-4 w-4 shrink-0 rounded ${z.color}`} aria-hidden="true" />
                                <div>
                                    <h3 className="font-bold text-green-950">{z.name}</h3>
                                    <p className="mt-1 text-sm text-gray-600">{z.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How we work */}
            <section id="how-we-work" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-green-900">How we work with communities</h2>
                <div className="mt-2 h-1 w-14 rounded bg-amber-400" />
                <p className="mt-3 max-w-2xl text-gray-600">
                    Our approach is participatory. The community leads, and we guide, train and support.
                </p>

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

            {/* Benefits */}
            <section className="bg-green-900 py-14">
                <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                    <div>
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-green-950">
                            <FaPaw className="h-7 w-7" />
                        </span>
                        <h2 className="mt-5 text-3xl font-bold text-white">Why it helps people and wildlife</h2>
                        <p className="mt-3 text-green-100">
                            When the land has a clear plan agreed by everyone, wildlife has space to move, farms are
                            safer, and the community has rules it trusts.
                        </p>
                    </div>
                    <ul className="space-y-3">
                        {BENEFITS.map((b) => (
                            <li key={b} className="flex items-start gap-3 rounded-xl bg-white/10 p-4 text-white">
                                <FaCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                                <span>{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Call to action */}
            <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
                <h2 className="text-3xl font-bold text-green-900">Does your community need a plan?</h2>
                <p className="mt-3 text-gray-600">
                    Village leaders, community groups and partners are welcome to contact UHWF to talk about land use
                    planning.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link
                        to="/contact"
                        className="rounded-lg bg-amber-400 px-7 py-3 font-semibold text-green-950 transition-colors hover:bg-amber-300"
                    >
                        Contact us
                    </Link>
                    <Link
                        to="/services/innovations"
                        className="rounded-lg border border-green-900 px-7 py-3 font-semibold text-green-900 transition-colors hover:bg-green-50"
                    >
                        Share an idea
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
}

export default Land