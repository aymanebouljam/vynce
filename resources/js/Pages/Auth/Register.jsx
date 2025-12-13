import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Create account" />

            <div className="mb-8">
                <h1 className="text-3xl font-semibold">Create your account</h1>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                    Start with a clean identity, then finish your profile in a short onboarding flow.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="mb-2 block text-sm text-slate-300">Name</label>
                    <input
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white focus:border-[#ff6a3d] focus:outline-none"
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <label className="mb-2 block text-sm text-slate-300">Username</label>
                    <input
                        value={data.username}
                        onChange={(event) =>
                            setData('username', event.target.value.toLowerCase())
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white focus:border-[#ff6a3d] focus:outline-none"
                        placeholder="your-name"
                    />
                    <InputError message={errors.username} className="mt-2" />
                </div>

                <div>
                    <label className="mb-2 block text-sm text-slate-300">Email</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white focus:border-[#ff6a3d] focus:outline-none"
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm text-slate-300">Password</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white focus:border-[#ff6a3d] focus:outline-none"
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={(event) =>
                                setData('password_confirmation', event.target.value)
                            }
                            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white focus:border-[#ff6a3d] focus:outline-none"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-full bg-[#ff6a3d] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#ff875f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Create account
                </button>
            </form>

            <div className="mt-8 text-sm text-slate-400">
                Already have an account?{' '}
                <Link href={route('login')} className="text-white">
                    Log in
                </Link>
            </div>
        </GuestLayout>
    );
}
