import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';

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

            <div className="mt-10 pt-6 lg:mt-16 lg:pt-2 2xl:mt-20">
                <div className="mb-6 pt-5 sm:pt-6 2xl:mb-7 2xl:pt-8">
                    <div className="app-text-muted text-[0.7rem] font-semibold uppercase tracking-[0.28em]">
                        Reset access
                    </div>
                    <p className="mt-2.5 text-[13px] font-medium leading-5 text-[rgba(241,235,251,0.9)] lg:text-[0.92rem] lg:leading-6 xl:text-lg xl:leading-7">
                        We&apos;ll send a reset link to your email.
                    </p>
                </div>

                {status && (
                    <div className="app-flash mb-4 rounded-[20px] px-3.5 py-2.5 text-[13px] 2xl:rounded-2xl 2xl:px-4 2xl:py-3 2xl:text-sm">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4 2xl:space-y-5">
                    <input
                        type="email"
                        value={data.email}
                        autoFocus
                        autoComplete="email"
                        onChange={(e) => setData('email', e.target.value)}
                        className="field w-full px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                        placeholder="Email"
                    />

                    <InputError message={errors.email} className="mt-2" />

                    <div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="app-button-primary w-full rounded-full px-4 py-2.5 text-[13px] font-semibold disabled:opacity-60 2xl:px-5 2xl:py-3 2xl:text-sm"
                        >
                            Email Password Reset Link
                        </button>
                    </div>

                    <Link
                        href={route('login')}
                        className="app-link app-text-muted block text-center text-[13px] 2xl:text-sm"
                    >
                        Back to login
                    </Link>
                </form>
            </div>
        </GuestLayout>
    );
}
