import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

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

            <div className="mb-7">
                <div className="app-text-muted text-[0.7rem] font-semibold uppercase tracking-[0.28em]">
                    Welcome back
                </div>
                <p className="mt-3 text-sm font-medium leading-6 text-[rgba(241,235,251,0.9)] lg:text-[0.95rem] lg:leading-6 xl:text-lg xl:leading-7">
                    Login to Vynce and pick up where you left off.
                </p>
            </div>

            {status && <div className="app-flash mb-4 rounded-2xl px-4 py-3 text-sm">{status}</div>}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <input
                        type="email"
                        value={data.email}
                        autoFocus
                        autoComplete="username"
                        onChange={(event) => setData('email', event.target.value)}
                        className="field w-full"
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
                        className="field w-full"
                        placeholder="Password"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <label className="app-text-high flex items-center gap-3 text-sm">
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
                        className="app-button-primary w-full rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Log in
                    </button>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="app-link app-text-muted block text-center text-sm"
                        >
                            Forgot your password?
                        </Link>
                    )}
                </div>
            </form>

            <div className="app-text-muted mt-8 text-sm">
                New to Vynce?{' '}
                <Link href={route('register')} className="app-link">
                    Create an account
                </Link>
            </div>
        </GuestLayout>
    );
}
