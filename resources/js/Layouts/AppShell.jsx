import ApplicationLogo from '@/Components/ApplicationLogo';
import FlashBanner from '@/Components/App/FlashBanner';
import { Head, Link } from '@inertiajs/react';
import { Compass, House, LogOut, MessageCircle, Search, Settings, UserPlus } from 'lucide-react';

const navigation = [
    {
        label: 'Home',
        route: 'feed.home',
        icon: House,
    },
    {
        label: 'Following',
        route: 'feed.following',
        icon: UserPlus,
    },
    {
        label: 'Discover',
        route: 'feed.discover',
        icon: Compass,
    },
    {
        label: 'Messages',
        route: 'messages.index',
        icon: MessageCircle,
    },
    {
        label: 'Settings',
        route: 'settings',
        icon: Settings,
    },
];

export default function AppShell({ children, title, sidebar }) {
    return (
        <>
            <Head title={title} />

            <div className="app-page-shell min-h-screen">
                <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
                    <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72">
                        <div className="app-panel-strong flex h-full flex-col justify-between rounded-[32px] p-5 backdrop-blur">
                            <div className="space-y-6">
                                <Link href={route('feed.home')} className="flex items-center gap-3">
                                    <div className="app-logo-tile rounded-2xl p-2">
                                        <ApplicationLogo className="h-8 w-8 fill-current" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-semibold">Vynce</div>
                                        <div className="app-text-muted text-xs">
                                            Your people, your pace
                                        </div>
                                    </div>
                                </Link>

                                <nav className="space-y-2">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.route}
                                            href={route(item.route)}
                                            className={`app-nav-link flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                                                route().current(item.route)
                                                    ? 'app-nav-link-active'
                                                    : ''
                                            }`}
                                        >
                                            <item.icon
                                                className="h-5 w-5 shrink-0"
                                                strokeWidth={1.8}
                                            />
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>
                            </div>

                            <div className="space-y-4">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="app-button-secondary app-panel-inset flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm"
                                >
                                    <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                                    Log out
                                </Link>
                            </div>
                        </div>
                    </aside>

                    <main className="min-w-0 flex-1 space-y-6">
                        <label className="app-search flex items-center gap-3 rounded-[24px] px-4 py-3 backdrop-blur transition">
                            <Search className="app-text-muted h-5 w-5 shrink-0" strokeWidth={1.8} />
                            <input
                                type="search"
                                placeholder="Search people, posts, or topics"
                                className="app-search-input w-full bg-transparent text-sm focus:outline-none"
                            />
                        </label>

                        <FlashBanner />
                        {children}
                    </main>

                    {sidebar && (
                        <aside className="lg:sticky lg:top-6 lg:h-fit lg:w-80">{sidebar}</aside>
                    )}
                </div>
            </div>
        </>
    );
}
