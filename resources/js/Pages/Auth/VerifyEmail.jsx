import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    const closeLogoutConfirm = () => {
        setLogoutConfirmOpen(false);
    };

    const confirmLogout = () => {
        router.post(route('logout'), {
            preserveScroll: true,
            onFinish: closeLogoutConfirm,
        });
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="mb-4 text-sm text-gray-600">
                Thanks for signing up! Before getting started, could you verify your email address
                by clicking on the link we just emailed to you? If you didn&apos;t receive the
                email, we will gladly send you another.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    A new verification link has been sent to the email address you provided during
                    registration.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>Resend Verification Email</PrimaryButton>

                    <button
                        type="button"
                        onClick={() => setLogoutConfirmOpen(true)}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Log Out
                    </button>
                </div>
            </form>

            <Modal show={logoutConfirmOpen} onClose={closeLogoutConfirm} maxWidth="md" centered>
                <div className="space-y-4 p-4 2xl:space-y-5 2xl:p-6">
                    <div className="space-y-1.5">
                        <div className="text-[15px] font-semibold 2xl:text-lg">Log out now?</div>
                        <div className="app-text-soft text-[12px] leading-5 2xl:text-sm 2xl:leading-6">
                            You can come back and continue after signing in again.
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeLogoutConfirm}
                            className="app-button-secondary rounded-full px-2.5 py-1 text-[11px] font-medium normal-case tracking-normal 2xl:px-3 2xl:py-1.5 2xl:text-[12px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmLogout}
                            className="app-button-primary rounded-full px-2.5 py-1 text-[11px] font-medium normal-case tracking-normal 2xl:px-3 2xl:py-1.5 2xl:text-[12px]"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </Modal>
        </GuestLayout>
    );
}
