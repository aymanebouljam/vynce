import { Link } from '@inertiajs/react';

const tabs = [
    { key: 'home', label: 'Home', route: 'feed.home' },
    { key: 'following', label: 'Following', route: 'feed.following' },
    { key: 'discover', label: 'Discover', route: 'feed.discover' },
];

export default function FeedTabs({ activeTab }) {
    return (
        <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
            {tabs.map((tab) => (
                <Link
                    key={tab.key}
                    href={route(tab.route)}
                    className={`flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold transition ${
                        activeTab === tab.key
                            ? 'bg-[#ff6a3d] text-slate-950'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    );
}
