import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth, canLogin, canRegister }) {
    return (
        <>
            <Head title="Vynce" />

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,106,61,0.3),_transparent_32%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)] px-4 py-6 text-white">
                <div className="mx-auto max-w-7xl">
                    <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-gradient-to-br from-[#ff6a3d] to-[#ffd166] p-2 text-slate-950">
                                <ApplicationLogo className="h-8 w-8 fill-current" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold">Vynce</div>
                                <div className="text-xs text-slate-400">
                                    Social architecture for signal-rich communities
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {auth?.user ? (
                                <Link
                                    href={route('feed.home')}
                                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
                                >
                                    Open app
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
                                            Create account
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </header>

                    <section className="grid gap-8 py-16 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
                        <div>
                            <div className="mb-4 inline-flex rounded-full border border-[#ff6a3d]/30 bg-[#ff6a3d]/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[#ffb39a]">
                                Laravel · Inertia · React
                            </div>
                            <h1 className="max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
                                A lighter social network with stronger defaults.
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                                Vynce combines fast publishing, privacy-aware follows,
                                modern profile design, and a clean feed experience into
                                one production-ready Laravel app.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <Link
                                    href={auth?.user ? route('feed.home') : route('register')}
                                    className="rounded-full bg-[#ff6a3d] px-6 py-3 text-sm font-semibold text-slate-950"
                                >
                                    Start building your profile
                                </Link>
                                <a
                                    href="#features"
                                    className="rounded-full border border-white/10 px-6 py-3 text-sm text-slate-200"
                                >
                                    See the MVP
                                </a>
                            </div>
                        </div>

                        <div className="grid gap-4" id="features">
                            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                                <div className="text-sm text-slate-400">Core pillars</div>
                                <div className="mt-4 grid gap-4">
                                    <div className="rounded-3xl bg-slate-950/70 p-5">
                                        <div className="text-sm font-semibold">Profiles with identity</div>
                                        <div className="mt-2 text-sm leading-7 text-slate-300">
                                            Usernames, bios, media-rich headers, privacy controls,
                                            and onboarding that gets out of the way quickly.
                                        </div>
                                    </div>
                                    <div className="rounded-3xl bg-slate-950/70 p-5">
                                        <div className="text-sm font-semibold">Graph-aware feeds</div>
                                        <div className="mt-2 text-sm leading-7 text-slate-300">
                                            Home, following, discover, and profile feeds are backed
                                            by dedicated service classes and privacy filtering.
                                        </div>
                                    </div>
                                    <div className="rounded-3xl bg-slate-950/70 p-5">
                                        <div className="text-sm font-semibold">Production shape</div>
                                        <div className="mt-2 text-sm leading-7 text-slate-300">
                                            PostgreSQL-first schema, Redis-ready queues, policies,
                                            requests, tests, and a modular monolith architecture.
                                        </div>
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
