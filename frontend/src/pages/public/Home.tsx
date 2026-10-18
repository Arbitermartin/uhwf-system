import { Link } from 'react-router-dom'
import {
    FaMapMarkedAlt,
    FaPaw,
    FaUsers,
    FaCalendarAlt,
    FaMapMarkerAlt,
} from 'react-icons/fa'
import heroImage from '../../assets/conservation.webp'

const focusAreas = [
    {
        title: 'Land Use Planning',
        text: 'Promoting sustainable land use practices that work for people and wildlife.',
        to: '/land',
        icon: FaMapMarkedAlt,
    },
    {
        title: 'Wildlife Conservation',
        text: "Protecting Tanzania's wildlife heritage through research and advocacy.",
        to: '/wildlife',
        icon: FaPaw,
    },
    {
        title: 'Community Engagement',
        text: 'Empowering local communities to lead conservation in their own areas.',
        to: '/services/community',
        icon: FaUsers,
    },
]

const news = [
    {
        id: 3,
        title: 'Wildlife Society 33rd Annual Conference — Des Moines 2026',
        date: '24 May 2026',
        text: 'The Wildlife Society will host its 33rd Annual Conference from November 1–5, 2026, in Des Moines, Iowa.',
        image: 'https://uhwf.or.tz/images/site/1779640850777-915703672.png',
    },
    {
        id: 1,
        title: 'UHWF Tanzania System — Under Development',
        date: '21 May 2026',
        text: 'The UHWF Tanzania platform is under development. Stay tuned for updates!',
        image: 'https://uhwf.or.tz/images/site/1779374044972-396293688.jpg',
    },
]

type EventItem = {
    id: number
    title: string
    date: string // e.g. '2026-11-01'
    location: string
    text: string
}

// Leave empty to show "No upcoming events". Add items like the example below.
const events: EventItem[] = [
    // {
    //   id: 1,
    //   title: 'Community Land Use Planning Workshop',
    //   date: '2026-11-15',
    //   location: 'Dar es Salaam',
    //   text: 'A one-day workshop on participatory land use planning.',
    // },
]

const formatDate = (iso: string) => {
    const d = new Date(iso)
    return {
        day: d.toLocaleDateString('en-GB', { day: '2-digit' }),
        month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
        year: d.getFullYear(),
    }
}
const Home = () => {
    return (
        <div>
            {/* Hero */}
            <section className="relative">
                <img
                    src={heroImage}
                    alt="Environment conservation in Tanzania"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-green-950/70" />

                <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-green-300">
                        Universal Human-Wildlife Foundation
                    </p>
                    <h1 className="max-w-2xl text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                        We Are UHWF
                    </h1>
                    <p className="mt-5 max-w-xl text-lg text-green-50">
                        United for a sustainable future — dedicated to protecting Tanzania's
                        land, wildlife, and communities through responsible action and local
                        empowerment.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            to="/register"
                            className="rounded-md bg-green-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-400"
                        >
                            Register Now
                        </Link>
                        <Link
                            to="/about"
                            className="rounded-md border border-white/70 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                        >
                            Learn More
                        </Link>
                    </div>
                </div>
            </section>

            {/* About */}
            <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-green-800">Who We Are</h2>
                <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-600" />
                <p className="mt-6 leading-relaxed text-gray-600">
                    The Universal Human-Wildlife Foundation (UHWF) is a Non-Governmental
                    Organization founded in December 2022 and registered under the
                    NGO Act of Tanzania. We work nationwide to support sustainable land,
                    environmental, and natural resource management, focusing on
                    human-wildlife interactions through participatory land use planning,
                    advocacy, strategic research, capacity building, and networking.
                </p>
            </section>

            {/* Focus areas */}
            <section className="bg-green-50 py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-center text-3xl font-bold text-green-800">
                        What We Do
                    </h2>
                    <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-600" />

                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        {focusAreas.map(({ title, text, to, icon: Icon }) => (
                            <div
                                key={title}
                                className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                                    {title}
                                </h3>
                                <p className="mt-2 text-gray-600">{text}</p>
                                <Link
                                    to={to}
                                    className="mt-4 inline-block font-medium text-green-700 hover:text-green-900"
                                >
                                    Read More →
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Latest news */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <h2 className="text-center text-3xl font-bold text-green-800">
                    Latest News
                </h2>
                <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-600" />

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                    {news.map((item) => (
                        <article
                            key={item.id}
                            className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                        >
                            <img
                                src={heroImage}
                                alt={item.title}
                                className="h-48 w-full object-cover"
                            />
                            <div className="p-5">
                                <p className="text-sm text-gray-400">{item.date}</p>
                                <h3 className="mt-1 text-lg font-semibold text-gray-900">
                                    {item.title}
                                </h3>
                                <p className="mt-2 text-gray-600">{item.text}</p>
                                <Link
                                    to={`/news/${item.id}`}
                                    className="mt-3 inline-block font-medium text-green-700 hover:text-green-900"
                                >
                                    Read full update →
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            {/* Events */}
            <section className="bg-green-50 py-16">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-center text-3xl font-bold text-green-800">Events</h2>
                    <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-600" />

                    {events.length === 0 ? (
                        <div className="mt-10 rounded-xl border border-dashed border-green-200 bg-white p-10 text-center">
                            <FaCalendarAlt className="mx-auto h-10 w-10 text-green-300" />
                            <p className="mt-4 text-gray-500">No upcoming events scheduled.</p>
                            <p className="text-sm text-gray-400">Check back soon for updates.</p>
                        </div>
                    ) : (
                        <div className="mt-10 space-y-4">
                            {events.map((event) => {
                                const { day, month, year } = formatDate(event.date)
                                return (
                                    <article
                                        key={event.id}
                                        className="flex gap-5 rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-green-700 text-white">
                                            <span className="text-2xl font-bold leading-none">{day}</span>
                                            <span className="text-xs font-semibold tracking-wide">{month}</span>
                                            <span className="text-xs text-green-200">{year}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                                            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                                                <FaMapMarkerAlt className="h-3 w-3 text-green-600" />
                                                {event.location}
                                            </p>
                                            <p className="mt-2 text-gray-600">{event.text}</p>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Call to action */}
            <section className="bg-green-800 py-14">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <h2 className="text-3xl font-bold text-white">Join Our Mission</h2>
                    <p className="mt-3 text-green-100">
                        Be part of the effort to protect Tanzania's land, wildlife and
                        communities.
                    </p>
                    <Link
                        to="/register"
                        className="mt-6 inline-block rounded-md bg-white px-6 py-3 font-semibold text-green-800 transition-colors hover:bg-green-100"
                    >
                        Register Now
                    </Link>
                </div>
            </section>
        </div>
    )
}

export default Home