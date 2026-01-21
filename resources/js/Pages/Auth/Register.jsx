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

            <div className="mb-7">
                <div className="app-text-muted text-[0.7rem] font-semibold uppercase tracking-[0.28em]">
                    Join Vynce
                </div>
                <p className="mt-3 text-sm font-medium leading-6 text-[rgba(241,235,251,0.9)] lg:text-[0.95rem] lg:leading-6 xl:text-lg xl:leading-7">
                    Set up your profile and step into the feed.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <input
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        className="field w-full"
                        placeholder="Name"
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <input
                        value={data.username}
                        onChange={(event) => setData('username', event.target.value.toLowerCase())}
                        className="field w-full"
                        placeholder="Username"
                    />
                    <InputError message={errors.username} className="mt-2" />
                </div>

                <div>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        className="field w-full"
                        placeholder="Email"
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            className="field w-full"
                            placeholder="Password"
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={(event) =>
                                setData('password_confirmation', event.target.value)
                            }
                            className="field w-full"
                            placeholder="Confirm password"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="app-button-primary w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
                >
                    Create account
                </button>
            </form>

            <div className="app-text-muted mt-8 text-sm">
                Already have an account?{' '}
                <Link href={route('login')} className="app-link">
                    Log in
                </Link>
            </div>
        </GuestLayout>
    );
}
