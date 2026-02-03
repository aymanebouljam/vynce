import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-5 2xl:space-y-6 ${className}`}>
            <header>
                <h2 className="text-base font-medium 2xl:text-lg">Delete Account</h2>

                <p className="app-text-soft mt-1 text-[13px] 2xl:text-sm">
                    Once your account is deleted, all of its resources and data will be permanently
                    deleted. Before deleting your account, please download any data or information
                    that you wish to retain.
                </p>
            </header>

            <DangerButton
                onClick={confirmUserDeletion}
                className="rounded-full px-4 py-2 text-[11px] 2xl:px-4 2xl:py-2 2xl:text-xs"
            >
                Delete Account
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-5 2xl:p-6">
                    <h2 className="text-base font-medium 2xl:text-lg">
                        Are you sure you want to delete your account?
                    </h2>

                    <p className="app-text-soft mt-1 text-[13px] 2xl:text-sm">
                        Once your account is deleted, all of its resources and data will be
                        permanently deleted. Please enter your password to confirm you would like to
                        permanently delete your account.
                    </p>

                    <div className="mt-5 2xl:mt-6">
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-1 block w-full rounded-[18px] px-3.5 py-2.5 text-[13px] sm:w-3/4 2xl:rounded-2xl 2xl:px-4 2xl:py-3 2xl:text-sm"
                            isFocused
                            placeholder="Password"
                            aria-label="Password"
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-5 flex justify-end 2xl:mt-6">
                        <SecondaryButton
                            onClick={closeModal}
                            className="rounded-full px-4 py-2 text-[11px] 2xl:px-4 2xl:py-2 2xl:text-xs"
                        >
                            Cancel
                        </SecondaryButton>

                        <DangerButton
                            className="ms-3 rounded-full px-4 py-2 text-[11px] 2xl:px-4 2xl:py-2 2xl:text-xs"
                            disabled={processing}
                        >
                            Delete Account
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
