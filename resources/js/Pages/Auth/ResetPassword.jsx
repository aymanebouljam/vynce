import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <div className="pt-12 lg:pt-20 2xl:pt-10">
                <div className="mb-6 2xl:mb-7">
                    <div className="app-text-muted text-[0.7rem] font-semibold uppercase tracking-[0.28em]">
                        Choose a new password
                    </div>
                    <p className="mt-2.5 text-[13px] font-medium leading-5 text-[rgba(241,235,251,0.9)] lg:text-[0.84rem] lg:leading-6 xl:text-lg xl:leading-7">
                        Pick a strong password to get back into your account.
                    </p>
                </div>

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
                            autoComplete="new-password"
                            onChange={(event) => setData('password', event.target.value)}
                            className="field w-full px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            placeholder="New password"
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            onChange={(event) =>
                                setData('password_confirmation', event.target.value)
                            }
                            className="field w-full px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            placeholder="Confirm new password"
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="app-button-primary w-full rounded-full px-4 py-2.5 text-[13px] font-semibold disabled:opacity-60 2xl:px-5 2xl:py-3 2xl:text-sm"
                        >
                            Reset Password
                        </button>

                        <Link
                            href={route('login')}
                            className="app-link app-text-muted block text-center text-[13px] 2xl:text-sm"
                        >
                            Back to login
                        </Link>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
