import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, House } from 'lucide-react';

export default function NotFound() {
    const { auth } = usePage().props;
    const homeHref = auth?.user ? route('feed.home') : route('home');

    return (
        <>
            <Head title="Page not found" />

            <div className="app-page-shell min-h-screen px-4 py-4 2xl:py-6">
                <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
                    <section className="app-panel w-full max-w-sm rounded-[20px] p-4 text-center 2xl:max-w-xl 2xl:rounded-[36px] 2xl:p-8">
                        <div className="mx-auto inline-flex items-center gap-0">
                            <ApplicationLogo className="auth-wordmark-icon h-8 w-8 fill-current 2xl:h-11 2xl:w-11" />
                            <div className="auth-wordmark text-[1.25rem] font-semibold 2xl:text-[1.7rem]">
                                ynce
                            </div>
                        </div>

                        <h1 className="mt-3 text-[1.2rem] font-semibold leading-tight md:text-[1.35rem] 2xl:text-[2rem]">
                            Oops! We couldn&apos;t find that page.
                        </h1>
                        <p className="app-text-high mx-auto mt-2.5 max-w-sm text-[11px] leading-5 2xl:mt-4 2xl:max-w-xl 2xl:text-base 2xl:leading-7">
                            The link may be broken, the page may have moved, or it may no longer
                            exist.
                        </p>

                        <div className="mt-4 flex flex-wrap justify-center gap-2 2xl:mt-8 2xl:gap-3">
                            <Link
                                href={homeHref}
                                className="app-button-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold 2xl:px-5 2xl:py-3 2xl:text-sm"
                            >
                                <House className="h-4 w-4" strokeWidth={1.9} />
                                Go home
                            </Link>
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] 2xl:px-5 2xl:py-3 2xl:text-sm"
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
