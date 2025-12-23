import { Link } from '@inertiajs/react';

const tabs = [
    { key: 'home', label: 'Home', route: 'feed.home' },
    { key: 'following', label: 'Following', route: 'feed.following' },
    { key: 'discover', label: 'Discover', route: 'feed.discover' },
];

export default function FeedTabs({ activeTab }) {
    return (
        <div className="app-tab-list flex rounded-2xl p-1">
            {tabs.map((tab) => (
                <Link
                    key={tab.key}
                    href={route(tab.route)}
                    className={`app-tab flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold ${
                        activeTab === tab.key ? 'app-tab-active' : ''
                    }`}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    );
}
