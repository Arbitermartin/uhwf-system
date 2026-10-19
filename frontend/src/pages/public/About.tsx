import { Link } from 'react-router-dom'
import {
    FaMapMarkedAlt,
    FaBullhorn,
    FaFlask,
    FaChalkboardTeacher,
    FaNetworkWired,
    FaEye,
    FaBullseye,
} from 'react-icons/fa'

const approaches = [
    {
        title: 'Participatory Land Use Planning',
        text: 'Working with communities so land is shared fairly between people, farming and wildlife.',
        icon: FaMapMarkedAlt,
    },
    {
        title: 'Advocacy',
        text: 'Speaking up for policies that support sustainable land and natural resource management.',
        icon: FaBullhorn,
    },
    {
        title: 'Strategic Research',
        text: 'Gathering evidence on human-wildlife interactions to guide better decisions.',
        icon: FaFlask,
    },
    {
        title: 'Capacity Building',
        text: 'Training communities and partners with the skills to manage their own resources.',
        icon: FaChalkboardTeacher,
    },
    {
        title: 'Networking',
        text: 'Connecting organizations, experts and communities to work together.',
        icon: FaNetworkWired,
    },
]

const facts = [
    { label: 'Founded', value: 'December 2022' },
    { label: 'Type', value: 'Non-Governmental Organization' },
    { label: 'Scope', value: 'Tanzania Mainland (national)' },
    { label: 'Registration No.', value: '00NGO/R/4248' },
]

const About = () => {
    return (
        <div>
            {/* Page header */}
            <section className="bg-green-800 py-16">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-green-300">
                        About Us
                    </p>
                    <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">
                        Universal Human-Wildlife Foundation
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-green-100">
                        United for a sustainable future — protecting Tanzania's land,
                        wildlife and communities.
                    </p>
                </div>
            </section>

            {/* Who we are */}
            <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-green-800">Who We Are</h2>
                <div className="mt-3 h-1 w-16 rounded bg-green-600" />
                <p className="mt-6 leading-relaxed text-gray-600">
                    The Universal Human-Wildlife Foundation (UHWF) is a Non-Governmental
                    Organization founded in December 2022 to operate in Tanzania
                    Mainland. It is registered under the Non-Governmental Organizations
                    Act, No. 24 of 2002, as altered in 2019.
                </p>
                <p className="mt-4 leading-relaxed text-gray-600">
                    UHWF operates on a national scale and contributes to sustainable
                    land, environmental and natural resource management, with a focus on
                    human-wildlife interactions.
                </p>

                <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                    {facts.map((f) => (
                        <div
                            key={f.label}
                            className="rounded-lg border border-green-100 bg-green-50 p-4"
                        >
                            <dt className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                {f.label}
                            </dt>
                            <dd className="mt-1 font-medium text-gray-900">{f.value}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* Vision & Mission (DRAFT: replace with official wording) */}
            <section className="bg-green-50 py-16">
                <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
                    <div className="rounded-xl bg-white p-8 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                            <FaEye className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-gray-900">Our Vision</h3>
                        <p className="mt-2 text-gray-600">
                            Tanzania with Sustained Land, Environmental, and Natural Resources with core Human- wildlife interaction that could realize security, well-being, and sustainable development of the entire community.
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-8 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                            <FaBullseye className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-gray-900">Our Mission</h3>
                        <p className="mt-2 text-gray-600">
                            To contribute to sustainable land, environmental and natural
                            resource management through participatory planning, research,
                            advocacy, capacity building and networking.
                        </p>
                    </div>
                </div>
            </section>

            {/* How we work */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <h2 className="text-center text-3xl font-bold text-green-800">
                    How We Work
                </h2>
                <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-600" />

                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {approaches.map(({ title, text, icon: Icon }) => (
                        <div
                            key={title}
                            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                                <Icon className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
                            <p className="mt-2 text-gray-600">{text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="bg-green-800 py-14">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <h2 className="text-3xl font-bold text-white">Work With Us</h2>
                    <p className="mt-3 text-green-100">
                        Meet the team behind UHWF or get in touch to collaborate.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link
                            to="/team"
                            className="rounded-md bg-white px-6 py-3 font-semibold text-green-800 hover:bg-green-100"
                        >
                            Our Team
                        </Link>
                        <Link
                            to="/contact"
                            className="rounded-md border border-white/70 px-6 py-3 font-semibold text-white hover:bg-white/10"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default About