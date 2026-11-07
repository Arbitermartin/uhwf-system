import { Link } from 'react-router-dom'
import EventsManager from './content/EventsManager'
import NewsManager from './content/NewsManager'

// "News and events" in the admin menu. The two tabs are two addresses: /admin/news and /admin/events.
const ContentPage = ({ tab }: { tab: 'news' | 'events' }) => (
    <div className="mx-auto max-w-5xl space-y-4">
        <div>
            <h1 className="text-2xl font-bold text-green-950">News and events</h1>
            <p className="text-sm text-gray-500">What visitors read on the public website. Write it here, no code needed.</p>
        </div>

        <nav className="flex gap-2 border-b border-gray-200" aria-label="Content type">
            {(
                [
                    { key: 'news', label: 'News', to: '/admin/news' },
                    { key: 'events', label: 'Events', to: '/admin/events' },
                ] as const
            ).map((t) => (
                <Link
                    key={t.key}
                    to={t.to}
                    aria-current={tab === t.key ? 'page' : undefined}
                    className={`-mb-px border-b-2 px-5 py-2.5 text-sm font-semibold ${tab === t.key ? 'border-amber-400 text-green-950' : 'border-transparent text-gray-500 hover:text-green-900'
                        }`}
                >
                    {t.label}
                </Link>
            ))}
        </nav>

        {tab === 'news' ? <NewsManager /> : <EventsManager />}
    </div>
)

export default ContentPage
