import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="app-page-shell app-page-shell--guest flex min-h-screen items-center justify-center px-4 py-8">
            <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr,0.9fr]">
                <div className="app-panel-muted hidden rounded-[36px] p-10 backdrop-blur lg:block">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="app-logo-tile rounded-2xl p-2">
                            <ApplicationLogo className="h-10 w-10 fill-current" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold">Vynce</div>
                            <div className="app-text-muted text-sm">
                                A clean, fast social layer for thoughtful posts.
                            </div>
                        </div>
                    </Link>

                    <div className="mt-10 space-y-6">
                        <h1 className="max-w-xl text-5xl font-semibold leading-tight">
                            Build signal, not noise.
                        </h1>
                        <p className="app-text-high max-w-lg text-lg leading-8">
                            Vynce gives creators and communities a modern feed, profile-first
                            identity, and privacy-aware social graph without the clutter.
                        </p>
                    </div>
                </div>

                <div className="app-panel rounded-[32px] px-6 py-8 backdrop-blur sm:px-8">
                    <div className="mb-8 lg:hidden">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="app-logo-tile rounded-2xl p-2">
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
