import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,106,61,0.25),_transparent_35%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)] px-4 py-8 text-white">
            <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr,0.9fr]">
                <div className="hidden rounded-[36px] border border-white/10 bg-white/5 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.36)] backdrop-blur lg:block">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="rounded-2xl bg-gradient-to-br from-[#ff6a3d] to-[#ffd166] p-2 text-slate-950">
                            <ApplicationLogo className="h-10 w-10 fill-current" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold">Vynce</div>
                            <div className="text-sm text-slate-300">
                                A clean, fast social layer for thoughtful posts.
                            </div>
                        </div>
                    </Link>

                    <div className="mt-10 space-y-6">
                        <h1 className="max-w-xl text-5xl font-semibold leading-tight">
                            Build signal, not noise.
                        </h1>
                        <p className="max-w-lg text-lg leading-8 text-slate-300">
                            Vynce gives creators and communities a modern feed,
                            profile-first identity, and privacy-aware social graph
                            without the clutter.
                        </p>
                    </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-slate-950/70 px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.4)] backdrop-blur sm:px-8">
                    <div className="mb-8 lg:hidden">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="rounded-2xl bg-gradient-to-br from-[#ff6a3d] to-[#ffd166] p-2 text-slate-950">
                                <ApplicationLogo className="h-8 w-8 fill-current" />
                            </div>
                            <div className="text-xl font-semibold">Vynce</div>
                        </Link>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
