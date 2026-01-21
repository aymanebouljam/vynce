import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="mb-7 pt-6 sm:pt-8">
                <div className="app-text-muted text-[0.7rem] font-semibold uppercase tracking-[0.28em]">
                    Reset access
                </div>
                <p className="mt-3 text-sm font-medium leading-6 text-[rgba(241,235,251,0.9)] lg:text-[0.95rem] lg:leading-6 xl:text-lg xl:leading-7">
                    We&apos;ll send a reset link to your email.
                </p>
            </div>

            {status && <div className="app-flash mb-4 rounded-2xl px-4 py-3 text-sm">{status}</div>}

            <form onSubmit={submit} className="space-y-5">
                <input
                    type="email"
                    value={data.email}
                    autoFocus
                    autoComplete="email"
                    onChange={(e) => setData('email', e.target.value)}
                    className="field w-full"
                    placeholder="Email"
                />

                <InputError message={errors.email} className="mt-2" />

                <div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="app-button-primary w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
                    >
                        Email Password Reset Link
                    </button>
                </div>

                <Link
                    href={route('login')}
                    className="app-link app-text-muted block text-center text-sm"
                >
                    Back to login
                </Link>
            </form>
        </GuestLayout>
    );
}
