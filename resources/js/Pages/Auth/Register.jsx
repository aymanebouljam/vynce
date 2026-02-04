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

            <div className="pt-4 lg:pt-12 2xl:pt-0">
                <div className="mb-6 2xl:mb-7">
                    <div className="app-text-muted text-[0.7rem] font-semibold uppercase tracking-[0.28em]">
                        Join Vynce
                    </div>
                    <p className="mt-2.5 text-[13px] font-medium leading-5 text-[rgba(241,235,251,0.9)] lg:text-[0.92rem] lg:leading-6 xl:text-lg xl:leading-7">
                        Set up your profile and step into the feed.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-4 2xl:space-y-5">
                    <div>
                        <input
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            className="field w-full px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            placeholder="Name"
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <input
                            value={data.username}
                            onChange={(event) =>
                                setData('username', event.target.value.toLowerCase())
                            }
                            className="field w-full px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            placeholder="Username"
                        />
                        <InputError message={errors.username} className="mt-2" />
                    </div>

                    <div>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(event) => setData('email', event.target.value)}
                            className="field w-full px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            placeholder="Email"
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 2xl:gap-5">
                        <div>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                className="field w-full px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
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
                                className="field w-full px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                                placeholder="Confirm password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="app-button-primary w-full rounded-full px-4 py-2.5 text-[13px] font-semibold disabled:opacity-60 2xl:px-5 2xl:py-3 2xl:text-sm"
                    >
                        Create account
                    </button>
                </form>

                <div className="app-text-muted mt-6 text-[13px] 2xl:mt-8 2xl:text-sm">
                    Already have an account?{' '}
                    <Link href={route('login')} className="app-link">
                        Log in
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
