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