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

            <div className="app-page-shell app-page-shell--welcome min-h-screen px-4 py-6">
                <div className="mx-auto max-w-7xl">
                    <header className="app-panel-subtle flex items-center justify-between rounded-full px-5 py-3 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <div className="app-logo-tile--gradient rounded-2xl p-2">
                                <ApplicationLogo className="h-8 w-8 fill-current" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold">Vynce</div>
                                <div className="app-text-soft text-xs">
                                    Where people post with context, not clutter
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {auth?.user ? (
                                <Link
                                    href={route('feed.home')}
                                    className="app-button-primary rounded-full px-4 py-2 text-sm font-semibold"
                                >
                                    Open feed
                                </Link>
                            ) : (
                                <>
                                    {canLogin && (
                                        <Link
                                            href={route('login')}
                                            className="app-button-secondary app-text-high rounded-full px-4 py-2 text-sm"
                                        >
                                            Log in
                                        </Link>
                                    )}
                                    {canRegister && (
                                        <Link
                                            href={route('register')}
                                            className="app-button-primary rounded-full px-4 py-2 text-sm font-semibold"
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
                            <div className="app-chip mb-4 inline-flex rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em]">
                                Creator updates · conversations · close circles
                            </div>
                            <h1 className="max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
                                A social space that feels alive, selective, and worth checking.
                            </h1>
                            <p className="app-text-high mt-6 max-w-2xl text-lg leading-8">
                                Follow people you actually care about, keep some updates private,
                                publish others to the wider network, and let your feed feel like
                                community instead of noise.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <Link
                                    href={auth?.user ? route('feed.home') : route('register')}
                                    className="app-button-primary rounded-full px-6 py-3 text-sm font-semibold"
                                >
                                    Build your circle
                                </Link>
                                <a
                                    href="#preview"
                                    className="app-button-secondary app-text-high rounded-full px-6 py-3 text-sm"
                                >
                                    Preview the vibe
                                </a>
                            </div>

                            <div className="mt-10 grid gap-3 sm:grid-cols-2">
                                {communities.map((community) => (
                                    <div
                                        key={community}
                                        className="app-panel-subtle app-text-high rounded-2xl px-4 py-4 text-sm"
                                    >
                                        {community}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div id="preview" className="space-y-4">
                            <div className="app-panel-muted rounded-[32px] p-5 backdrop-blur">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold">
                                            Tonight on Vynce
                                        </div>
                                        <div className="app-text-soft text-xs">
                                            Product notes, launch clips, and replies that go
                                            somewhere
                                        </div>
                                    </div>
                                    <div className="app-chip rounded-full px-3 py-1 text-xs">
                                        3 live threads
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {featuredPosts.map((post) => (
                                        <div
                                            key={post.handle}
                                            className="app-panel-inset rounded-3xl p-5"
                                        >
                                            <div className="text-sm font-semibold">{post.name}</div>
                                            <div className="app-text-soft text-xs">
                                                {post.handle}
                                            </div>
                                            <p className="app-text-high mt-3 text-sm leading-7">
                                                {post.body}
                                            </p>
                                            <div className="app-text-soft mt-4 text-xs">
                                                {post.meta}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="app-panel-inset rounded-3xl p-5">
                                    <div className="text-2xl font-semibold">12K+</div>
                                    <div className="app-text-soft mt-1 text-sm">
                                        posts saved into close-knit feeds
                                    </div>
                                </div>
                                <div className="app-panel-inset rounded-3xl p-5">
                                    <div className="text-2xl font-semibold">89%</div>
                                    <div className="app-text-soft mt-1 text-sm">
                                        of posts come from followed people
                                    </div>
                                </div>
                                <div className="app-panel-inset rounded-3xl p-5">
                                    <div className="text-2xl font-semibold">4x</div>
                                    <div className="app-text-soft mt-1 text-sm">
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
