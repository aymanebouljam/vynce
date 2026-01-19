import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, House } from 'lucide-react';

export default function NotFound() {
    const { auth } = usePage().props;
    const homeHref = auth?.user ? route('feed.home') : route('home');

    return (
        <>
            <Head title="Page not found" />

            <div className="app-page-shell min-h-screen px-4 py-6">
                <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
                    <section className="app-panel w-full max-w-xl rounded-[36px] p-8 text-center md:p-12">
                        <div className="mx-auto inline-flex items-center gap-0">
                            <ApplicationLogo className="auth-wordmark-icon h-11 w-11 fill-current" />
                            <div className="auth-wordmark text-[1.7rem] font-semibold">ynce</div>
                        </div>

                        <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
                            Oops! We couldn&apos;t find that page.
                        </h1>
                        <p className="app-text-high mx-auto mt-4 max-w-xl text-sm leading-7 md:text-base">
                            The link may be broken, the page may have moved, or it may no longer
                            exist.
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link
                                href={homeHref}
                                className="app-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                            >
                                <House className="h-4 w-4" strokeWidth={1.9} />
                                Go home
                            </Link>
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="app-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm"
                            >
                                <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
                                Go back
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
