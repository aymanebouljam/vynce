import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-base font-medium 2xl:text-lg">Update Password</h2>

                <p className="app-text-soft mt-1 text-[13px] 2xl:text-sm">
                    Ensure your account is using a long, random password to stay secure.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-5 space-y-4 2xl:mt-6 2xl:space-y-6">
                <div>
                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type="password"
                        className="block w-full rounded-[18px] px-3.5 py-2.5 text-[13px] 2xl:rounded-2xl 2xl:px-4 2xl:py-3 2xl:text-sm"
                        autoComplete="current-password"
                        placeholder="Current password"
                        aria-label="Current password"
                    />

                    <InputError message={errors.current_password} className="mt-2" />
                </div>

                <div>
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="block w-full rounded-[18px] px-3.5 py-2.5 text-[13px] 2xl:rounded-2xl 2xl:px-4 2xl:py-3 2xl:text-sm"
                        autoComplete="new-password"
                        placeholder="New password"
                        aria-label="New password"
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        type="password"
                        className="block w-full rounded-[18px] px-3.5 py-2.5 text-[13px] 2xl:rounded-2xl 2xl:px-4 2xl:py-3 2xl:text-sm"
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        aria-label="Confirm new password"
                    />

                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="flex items-center gap-3 2xl:gap-4">
                    <PrimaryButton
                        disabled={processing}
                        className="rounded-full px-4 py-2 text-[11px] 2xl:px-4 2xl:py-2 2xl:text-xs"
                    >
                        Save
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="app-text-soft text-[13px] 2xl:text-sm">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
