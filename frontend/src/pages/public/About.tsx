// import { Link } from 'react-router-dom'
// import {
//     FaGlobeAfrica,
//     FaTree,
//     FaRecycle,
//     FaChalkboardTeacher,
//     FaEye,
//     FaBullseye,
// } from 'react-icons/fa'

// const approaches = [
//     {
//         title: 'Capacity building',
//         text: 'To improve corporate social responsibility, we engage stakeholders through capacity building and environmental education in the community. We plan communication strategies and materials, as well as events, workshops, and trainings, as well as mentorship and volunteer assistance.Working with communities so land is shared fairly between people, farming and wildlife.',
//         icon: FaChalkboardTeacher,
//     },
//     {
//         title: 'Climate change',
//         text: 'Developing climate-resilient mitigation and adaptation strategies to address climate-change concerns through a combination of measures such as tree planting, climate education, and policy advocacy.',
//         icon: FaGlobeAfrica,
//     },
//     {
//         title: 'Waste management',
//         text: 'The program is intended to improve community cleanliness, sanitation, and a healthy environment. We hold clean-up events in cities, on beaches, and in tourist areas. We also educate local residents on effective trash management and the adoption of waste recycling technologies into commercial products, which benefits all actors in the waste management value chain.',
//         icon: FaRecycle,
//     },
//     {
//         title: 'Community tree planting and conservation',
//         text: 'We fund and partner with communities to not only plant but also nurture trees to maturity. This is a long-term effort that aims to improve the quality of our living environment by active planting, good tree management, and preservation of trees and other vegetation.',
//         icon: FaTree,
//     },
//     // {
//     //     title: 'Networking',
//     //     text: 'Connecting organizations, experts and communities to work together.',
//     //     icon: FaNetworkWired,
//     // },
// ]

// const facts = [
//     { label: 'Founded', value: 'December 2022' },
//     { label: 'Type', value: 'Non-Governmental Organization' },
//     { label: 'Scope', value: 'Tanzania Mainland (national)' },
//     { label: 'Registration No.', value: '00NGO/R/4248' },
// ]

// const About = () => {
//     return (
//         <div>
//             {/* Page header */}
//             <section className="bg-green-800 py-16">
//                 <div className="mx-auto max-w-4xl px-4 text-center">
//                     <p className="text-sm font-semibold uppercase tracking-widest text-green-300">
//                         About Us
//                     </p>
//                     <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">
//                         Universal Human-Wildlife Foundation
//                     </h1>
//                     <p className="mx-auto mt-4 max-w-2xl text-green-100">
//                         United for a sustainable future — protecting Tanzania's land,
//                         wildlife and communities.
//                     </p>
//                 </div>
//             </section>

//             {/* Who we are */}
//             <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
//                 <h2 className="text-3xl font-bold text-green-800">Who We Are</h2>
//                 <div className="mt-3 h-1 w-16 rounded bg-green-600" />
//                 <p className="mt-6 leading-relaxed text-gray-600">
//                     The Universal Human-Wildlife Foundation (UHWF) is a Non-Governmental
//                     Organization (NGO) founded in December 2022 to operate in Tanzania
//                     Mainland and registered with registration number 00NGO/R/4248 under the
//                     Non-Governmental Organization Act, No.24 of 2002 as altered in 2019. The
//                     organization will operate on a national scale and strive to contribute to
//                     sustainable land, environmental, and natural resource management with a focus on core
//                     human-wildlife interactions through participatory land use planning, advocacy, strategic
//                     research, capacity building, and networking.
//                 </p>
//                 <p className="mt-4 leading-relaxed text-gray-600">
//                     UHWF operates on a national scale and contributes to sustainable
//                     land, environmental and natural resource management, with a focus on
//                     human-wildlife interactions.
//                 </p>

//                 <dl className="mt-8 grid gap-4 sm:grid-cols-2">
//                     {facts.map((f) => (
//                         <div
//                             key={f.label}
//                             className="rounded-lg border border-green-100 bg-green-50 p-4"
//                         >
//                             <dt className="text-xs font-semibold uppercase tracking-wide text-green-700">
//                                 {f.label}
//                             </dt>
//                             <dd className="mt-1 font-medium text-gray-900">{f.value}</dd>
//                         </div>
//                     ))}
//                 </dl>
//             </section>

//             {/* Vision & Mission (DRAFT: replace with official wording) */}
//             <section className="bg-green-50 py-16">
//                 <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
//                     <div className="rounded-xl bg-white p-8 shadow-sm">
//                         <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
//                             <FaEye className="h-6 w-6" />
//                         </div>
//                         <h3 className="mt-4 text-xl font-semibold text-gray-900">Our Vision</h3>
//                         <p className="mt-2 text-gray-600">
//                             Tanzania with Sustained Land, Environmental, and Natural Resources with core Human- wildlife interaction that could realize security, well-being, and sustainable development of the entire community.
//                         </p>
//                     </div>
//                     <div className="rounded-xl bg-white p-8 shadow-sm">
//                         <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
//                             <FaBullseye className="h-6 w-6" />
//                         </div>
//                         <h3 className="mt-4 text-xl font-semibold text-gray-900">Our Mission</h3>
//                         <p className="mt-2 text-gray-600">
//                             To contribute to sustainable land, environmental and natural
//                             resource management through participatory planning, research,
//                             advocacy, capacity building and networking.
//                         </p>
//                     </div>
//                 </div>
//             </section>

//             {/* How we work */}
//             <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
//                 <h2 className="text-center text-3xl font-bold text-green-800">
//                     How We Work
//                 </h2>
//                 <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-600" />

//                 <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//                     {approaches.map(({ title, text, icon: Icon }) => (
//                         <div
//                             key={title}
//                             className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
//                         >
//                             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
//                                 <Icon className="h-6 w-6" />
//                             </div>
//                             <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
//                             <p className="mt-2 text-gray-600">{text}</p>
//                         </div>
//                     ))}
//                 </div>
//             </section>

//             {/* CTA */}
//             <section className="bg-green-800 py-14">
//                 <div className="mx-auto max-w-3xl px-4 text-center">
//                     <h2 className="text-3xl font-bold text-white">Work With Us</h2>
//                     <p className="mt-3 text-green-100">
//                         Meet the team behind UHWF or get in touch to collaborate.
//                     </p>
//                     <div className="mt-6 flex flex-wrap justify-center gap-3">
//                         <Link
//                             to="/team"
//                             className="rounded-md bg-white px-6 py-3 font-semibold text-green-800 hover:bg-green-100"
//                         >
//                             Our Team
//                         </Link>
//                         <Link
//                             to="/contact"
//                             className="rounded-md border border-white/70 px-6 py-3 font-semibold text-white hover:bg-white/10"
//                         >
//                             Contact Us
//                         </Link>
//                     </div>
//                 </div>
//             </section>
//         </div>
//     )
// }

// export default About
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FaBullseye, FaEye, FaGlobeAfrica, FaRecycle, FaTree, FaUsers } from 'react-icons/fa'

const REG_NO = '00NGO/R/4248'

const About = () => {
    const { t } = useTranslation()

    const facts = [
        { label: t('about.factFounded'), value: t('about.factFoundedValue') },
        { label: t('about.factType'), value: t('about.factTypeValue') },
        { label: t('about.factScope'), value: t('about.factScopeValue') },
        { label: t('about.factReg'), value: REG_NO },
    ]

    const programmes = [
        { title: t('about.capacityTitle'), text: t('about.capacityText'), icon: FaUsers },
        { title: t('about.climateTitle'), text: t('about.climateText'), icon: FaGlobeAfrica },
        { title: t('about.wasteTitle'), text: t('about.wasteText'), icon: FaRecycle },
        { title: t('about.treesTitle'), text: t('about.treesText'), icon: FaTree },
    ]

    return (
        <div>
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-r from-green-50 via-lime-50 to-green-100">
                <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-200/40" />
                <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
                    <p className="text-sm font-semibold uppercase tracking-widest text-green-700">{t('about.eyebrow')}</p>
                    <h1 className="mt-2 text-4xl font-extrabold text-green-950 sm:text-5xl">{t('about.title')}</h1>
                    <p className="mt-3 max-w-2xl text-lg text-gray-700">{t('about.subtitle')}</p>
                </div>
            </section>

            {/* Who we are */}
            <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-green-900">{t('about.whoTitle')}</h2>
                <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <p className="leading-relaxed text-gray-700">{t('about.whoText')}</p>
                        <p className="mt-4 rounded-xl border-l-4 border-amber-400 bg-green-50 p-4 font-medium text-green-950">
                            {t('about.whoHighlight')}
                        </p>
                    </div>

                    <dl className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        {facts.map((f) => (
                            <div key={f.label} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                <dt className="text-xs uppercase tracking-wide text-gray-500">{f.label}</dt>
                                <dd className="mt-0.5 font-semibold text-green-950">{f.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* Vision and mission */}
            <section className="bg-green-50 py-14">
                <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-800">
                            <FaEye className="h-6 w-6" />
                        </span>
                        <h2 className="mt-4 text-xl font-bold text-green-950">{t('about.visionTitle')}</h2>
                        <p className="mt-2 leading-relaxed text-gray-700">{t('about.visionText')}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                            <FaBullseye className="h-6 w-6" />
                        </span>
                        <h2 className="mt-4 text-xl font-bold text-green-950">{t('about.missionTitle')}</h2>
                        <p className="mt-2 leading-relaxed text-gray-700">{t('about.missionText')}</p>
                    </div>
                </div>
            </section>

            {/* How we work */}
            <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-green-900">{t('about.howTitle')}</h2>
                <div className="mt-2 h-1 w-14 rounded bg-amber-400" />

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {programmes.map(({ title, text, icon: Icon }) => (
                        <article key={title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-800">
                                <Icon className="h-6 w-6" />
                            </span>
                            <h3 className="mt-4 text-lg font-bold text-green-950">{title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
                        </article>
                    ))}
                </div>
            </section>

            {/* Work with us */}
            <section className="bg-green-900 py-14">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <h2 className="text-3xl font-bold text-white">{t('about.workTitle')}</h2>
                    <p className="mt-3 text-green-100">{t('about.workText')}</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link to="/team" className="rounded-lg bg-amber-400 px-7 py-3 font-semibold text-green-950 transition-colors hover:bg-amber-300">
                            {t('nav.team')}
                        </Link>
                        <Link to="/contact" className="rounded-lg border border-white/70 px-7 py-3 font-semibold text-white transition-colors hover:bg-white/10">
                            {t('nav.contact')}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default About