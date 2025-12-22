import ApplicationLogo from '@/Components/ApplicationLogo';
import FlashBanner from '@/Components/App/FlashBanner';
import { Head, Link, usePage } from '@inertiajs/react';

const navigation = [
    { label: 'Home', route: 'feed.home' },
    { label: 'Following', route: 'feed.following' },
    { label: 'Discover', route: 'feed.discover' },
    { label: 'Settings', route: 'settings' },
];

export default function AppShell({ children, title, sidebar }) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title={title} />

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,106,61,0.18),_transparent_35%),linear-gradient(180deg,_#0f172a_0%,_#020617_55%,_#111827_100%)] text-white">
                <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
                    <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72">
                        <div className="flex h-full flex-col justify-between rounded-[32px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur">
                            <div className="space-y-6">
                                <Link href={route('feed.home')} className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-gradient-to-br from-[#ff6a3d] to-[#ffd166] p-2 text-slate-950">
                                        <ApplicationLogo className="h-8 w-8 fill-current" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-semibold">Vynce</div>
                                        <div className="text-xs text-slate-400">
                                            Your people, your pace
                                        </div>
                                    </div>
                                </Link>

                                <nav className="space-y-2">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.route}
                                            href={route(item.route)}
                                            className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                                route().current(item.route)
                                                    ? 'bg-white text-slate-950'
                                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-sm font-semibold">{auth.user.name}</div>
                                    <div className="text-xs text-slate-400">
                                        @{auth.user.username}
                                    </div>
                                    <div className="mt-3 text-xs leading-6 text-slate-500">
                                        Drop a post, check your circle, and see what conversations
                                        are gaining heat.
                                    </div>
                                    <Link
                                        href={route('users.show', auth.user.username)}
                                        className="mt-4 inline-flex rounded-full border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/5"
                                    >
                                        View my profile
                                    </Link>
                                </div>

                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="w-full rounded-2xl border border-white/10 px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                                >
                                    Log out
                                </Link>
                            </div>
                        </div>
                    </aside>

                    <main className="min-w-0 flex-1 space-y-6">
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
