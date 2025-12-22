import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';

const featuredPosts = [
    {
        name: 'Maya Chen',
        handle: '@maya.design',
        body: 'Shared a before/after of our onboarding rewrite and the comments turned into a full teardown thread. This is the kind of product conversation I want more of.',
        meta: '284 replies · 1.2K likes',
    },
    {
        name: 'Omar Idrissi',
        handle: '@omarbuilds',
        body: 'Private follows for early testers, public launch notes for everyone else. Vynce finally feels like a place where community and product updates can live together.',
        meta: '91 reposts · Trending in Product',
    },
];

const communities = [
    'Indie product journals',
    'Design critique circles',
    'Founder dispatches',
    'Creator close-friends feeds',
];

export default function Welcome({ auth, canLogin, canRegister }) {
    return (
        <>
            <Head title="Vynce" />

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,106,61,0.28),_transparent_28%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)] px-4 py-6 text-white">
                <div className="mx-auto max-w-7xl">
                    <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-gradient-to-br from-[#ff6a3d] to-[#ffd166] p-2 text-slate-950">
                                <ApplicationLogo className="h-8 w-8 fill-current" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold">Vynce</div>
                                <div className="text-xs text-slate-400">
                                    Where people post with context, not clutter
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {auth?.user ? (
                                <Link
                                    href={route('feed.home')}
                                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
                                >
                                    Open feed
                                </Link>
                            ) : (
                                <>
                                    {canLogin && (
                                        <Link
                                            href={route('login')}
                                            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200"
                                        >
                                            Log in
                                        </Link>
                                    )}
                                    {canRegister && (
                                        <Link
                                            href={route('register')}
                                            className="rounded-full bg-[#ff6a3d] px-4 py-2 text-sm font-semibold text-slate-950"
                                        >
                                            Join Vynce
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </header>

                    <section className="grid gap-10 py-16 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
                        <div>
                            <div className="mb-4 inline-flex rounded-full border border-[#ff6a3d]/30 bg-[#ff6a3d]/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#ffb39a]">
                                Creator updates · conversations · close circles
                            </div>
                            <h1 className="max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
                                A social space that feels alive, selective, and worth checking.
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                                Follow people you actually care about, keep some updates private,
                                publish others to the wider network, and let your feed feel like
                                community instead of noise.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <Link
                                    href={auth?.user ? route('feed.home') : route('register')}
                                    className="rounded-full bg-[#ff6a3d] px-6 py-3 text-sm font-semibold text-slate-950"
                                >
                                    Build your circle
                                </Link>
                                <a
                                    href="#preview"
                                    className="rounded-full border border-white/10 px-6 py-3 text-sm text-slate-200"
                                >
                                    Preview the vibe
                                </a>
                            </div>

                            <div className="mt-10 grid gap-3 sm:grid-cols-2">
                                {communities.map((community) => (
                                    <div
                                        key={community}
                                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200"
                                    >
                                        {community}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div id="preview" className="space-y-4">
                            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold">
                                            Tonight on Vynce
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            Product notes, launch clips, and replies that go
                                            somewhere
                                        </div>
                                    </div>
                                    <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200">
                                        3 live threads
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {featuredPosts.map((post) => (
                                        <div
                                            key={post.handle}
                                            className="rounded-3xl bg-slate-950/70 p-5"
                                        >
                                            <div className="text-sm font-semibold">{post.name}</div>
                                            <div className="text-xs text-slate-400">
                                                {post.handle}
                                            </div>
                                            <p className="mt-3 text-sm leading-7 text-slate-200">
                                                {post.body}
                                            </p>
                                            <div className="mt-4 text-xs text-slate-500">
                                                {post.meta}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                                    <div className="text-2xl font-semibold">12K+</div>
                                    <div className="mt-1 text-sm text-slate-400">
                                        posts saved into close-knit feeds
                                    </div>
                                </div>
                                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                                    <div className="text-2xl font-semibold">89%</div>
                                    <div className="mt-1 text-sm text-slate-400">
                                        of posts come from followed people
                                    </div>
                                </div>
                                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                                    <div className="text-2xl font-semibold">4x</div>
                                    <div className="mt-1 text-sm text-slate-400">
                                        more profile visits after a thread lands
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
