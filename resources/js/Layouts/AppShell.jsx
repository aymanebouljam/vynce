import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, usePage } from '@inertiajs/react';
import { Compass, House, LogOut, MessageCircle, Search, Settings, Users } from 'lucide-react';

export default function AppShell({ children, title, sidebar }) {
    const { auth } = usePage().props;
    const ownProfileActive =
        route().current('users.show') && route().params.user === auth.user.username;
    const initials = auth.user.name
        ?.split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const showSearch = route().current('feed.home') || route().current('feed.following');
    const navigation = [
        {
            label: 'Home',
            href: route('feed.home'),
            active: route().current('feed.home'),
            icon: House,
        },
        {
            label: 'Contacts',
            href: route('contacts.index'),
            active: route().current('contacts.index'),
            icon: Users,
        },
        {
            label: 'Discover',
            href: route('feed.discover'),
            active: route().current('feed.discover'),
            icon: Compass,
        },
        {
            label: 'Messages',
            href: route('messages.index'),
            active: route().current('messages.index') || route().current('messages.show'),
            icon: MessageCircle,
        },
        {
            label: 'Settings',
            href: route('settings'),
            active: route().current('settings') || route().current('profile.edit'),
            icon: Settings,
        },
    ];

    return (
        <>
            <Head title={title} />

            <div className="app-page-shell min-h-screen">
                <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 min-[1246px]:flex-row min-[1246px]:px-6">
                    <aside className="min-[1246px]:sticky min-[1246px]:top-6 min-[1246px]:h-[calc(100vh-3rem)] min-[1246px]:w-72">
                        <div className="app-panel-strong flex h-full flex-col justify-between rounded-[32px] p-5 backdrop-blur">
                            <div className="space-y-6">
                                <Link
                                    href={route('feed.home')}
                                    className="auth-brand-lockup inline-flex items-center gap-0 self-start"
                                >
                                    <ApplicationLogo className="auth-wordmark-icon h-11 w-11 fill-current" />
                                    <div>
                                        <div className="auth-wordmark text-[1.7rem] font-semibold">
                                            ynce
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    href={route('users.show', auth.user.username)}
                                    className={`app-panel-inset app-sidebar-user-link flex items-center gap-3 rounded-[24px] px-4 py-3 ${
                                        ownProfileActive ? 'app-sidebar-user-link-active' : ''
                                    }`}
                                >
                                    {auth.user.avatar_url ? (
                                        <div className="h-12 w-12 overflow-hidden rounded-2xl">
                                            <img
                                                src={auth.user.avatar_url}
                                                alt={auth.user.name}
                                                className="h-full w-full object-cover"
                                                style={{
                                                    objectPosition: `${auth.user.avatar_position_x}% ${auth.user.avatar_position_y}%`,
                                                    transform: `scale(${auth.user.avatar_zoom})`,
                                                    transformOrigin: `${auth.user.avatar_position_x}% ${auth.user.avatar_position_y}%`,
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="app-avatar-fallback flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold">
                                            {initials}
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold">
                                            {auth.user.name}
                                        </div>
                                        <div className="app-text-muted truncate text-xs">
                                            @{auth.user.username}
                                        </div>
                                    </div>
                                </Link>

                                <nav className="space-y-2">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className={`app-nav-link flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                                                item.active ? 'app-nav-link-active' : ''
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
                                    className="app-button-secondary app-button-secondary--logout app-panel-inset flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm"
                                >
                                    <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                                    Log out
                                </Link>
                            </div>
                        </div>
                    </aside>

                    <main className="min-w-0 flex-1 space-y-6">
                        {showSearch && (
                            <label className="app-search flex items-center gap-3 rounded-[24px] px-4 py-3 backdrop-blur transition">
                                <Search
                                    className="app-text-muted h-5 w-5 shrink-0"
                                    strokeWidth={1.8}
                                />
                                <input
                                    type="search"
                                    placeholder="Search people, posts, or topics"
                                    className="app-search-input w-full bg-transparent text-sm focus:outline-none"
                                />
                            </label>
                        )}
                        {children}
                    </main>

                    {sidebar && (
                        <aside className="min-[1246px]:sticky min-[1246px]:top-6 min-[1246px]:h-fit min-[1246px]:w-80">
                            {sidebar}
                        </aside>
                    )}
                </div>
            </div>
        </>
    );
}
