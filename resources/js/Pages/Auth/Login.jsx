import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="pt-12 lg:pt-20 2xl:pt-10">
                <div className="mb-6 2xl:mb-7">
                    <div className="app-text-muted text-[0.7rem] font-semibold uppercase tracking-[0.28em]">
                        Welcome back
                    </div>
                    <p className="mt-2.5 text-[13px] font-medium leading-5 text-[rgba(241,235,251,0.9)] lg:text-[0.92rem] lg:leading-6 xl:text-lg xl:leading-7">
                        Login to Vynce and pick up where you left off.
                    </p>
                </div>

                {status && (
                    <div className="app-flash mb-4 rounded-[20px] px-3.5 py-2.5 text-[13px] 2xl:rounded-2xl 2xl:px-4 2xl:py-3 2xl:text-sm">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4 2xl:space-y-5">
                    <div>
                        <input
                            type="email"
                            value={data.email}
                            autoFocus
                            autoComplete="username"
                            onChange={(event) => setData('email', event.target.value)}
                            className="field w-full px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            placeholder="Email"
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <input
                            type="password"
                            value={data.password}
                            autoComplete="current-password"
                            onChange={(event) => setData('password', event.target.value)}
                            className="field w-full px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            placeholder="Password"
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <label className="app-text-high flex items-center gap-2.5 text-[13px] 2xl:gap-3 2xl:text-sm">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(event) => setData('remember', event.target.checked)}
                            className="app-input-check rounded"
                        />
                        Remember me
                    </label>

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="app-button-primary w-full rounded-full px-4 py-2.5 text-[13px] font-semibold disabled:opacity-60 2xl:px-5 2xl:py-3 2xl:text-sm"
                        >
                            Log in
                        </button>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="app-link app-text-muted block text-center text-[13px] 2xl:text-sm"
                            >
                                Forgot your password?
                            </Link>
                        )}
                    </div>
                </form>

                <div className="app-text-muted mt-6 text-[13px] 2xl:mt-8 2xl:text-sm">
                    New to Vynce?{' '}
                    <Link href={route('register')} className="app-link">
                        Create an account
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
