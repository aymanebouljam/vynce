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

            <div className="mb-8">
                <h1 className="text-3xl font-semibold">Welcome back</h1>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                    Log in to publish, follow, and shape your Vynce feed.
                </p>
            </div>

            {status && (
                <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="mb-2 block text-sm text-slate-300">Email</label>
                    <input
                        type="email"
                        value={data.email}
                        autoFocus
                        autoComplete="username"
                        onChange={(event) => setData('email', event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#ff6a3d] focus:outline-none"
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <label className="mb-2 block text-sm text-slate-300">Password</label>
                    <input
                        type="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(event) => setData('password', event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#ff6a3d] focus:outline-none"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(event) => setData('remember', event.target.checked)}
                        className="rounded border-white/10 bg-slate-900 text-[#ff6a3d] focus:ring-[#ff6a3d]"
                    />
                    Remember me
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm text-slate-400 transition hover:text-white"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-full bg-[#ff6a3d] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#ff875f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Log in
                    </button>
                </div>
            </form>

            <div className="mt-8 text-sm text-slate-400">
                New to Vynce?{' '}
                <Link href={route('register')} className="text-white">
                    Create an account
                </Link>
            </div>
        </GuestLayout>
    );
}
