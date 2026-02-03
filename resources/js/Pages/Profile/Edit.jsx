import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { cloneElement } from 'react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';

export default function Edit({ profile }) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'patch',
        name: profile.name ?? '',
        username: profile.username ?? '',
        email: profile.email ?? '',
        bio: profile.bio ?? '',
        website_url: profile.website_url ?? '',
        location: profile.location ?? '',
        is_private: profile.is_private ?? false,
    });
    const goBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        router.visit(route('feed.home'));
    };

    const submit = (event) => {
        event.preventDefault();

        post(route('profile.update'), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout title="Edit profile">
            <Head title="Edit profile" />

            <div className="space-y-5 2xl:space-y-6">
                <section className="app-panel rounded-[28px] p-5 2xl:rounded-[32px] 2xl:p-6">
                    <div className="mb-5 2xl:mb-6">
                        <button
                            type="button"
                            onClick={goBack}
                            className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] 2xl:px-4 2xl:text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
                            Back
                        </button>
                        <h1 className="mt-3 text-[1.6rem] font-semibold 2xl:mt-4 2xl:text-2xl">
                            Edit profile
                        </h1>
                        <p className="app-text-soft mt-2 text-[13px] leading-6 2xl:text-sm 2xl:leading-7">
                            Keep identity fields clean and update your public-facing details here.
                        </p>
                    </div>

                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 2xl:gap-5">
                        <Field placeholder="Name" error={errors.name}>
                            <input
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                className="field px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            />
                        </Field>
                        <Field placeholder="Username" error={errors.username}>
                            <input
                                value={data.username}
                                onChange={(event) =>
                                    setData('username', event.target.value.toLowerCase())
                                }
                                className="field px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            />
                        </Field>
                        <Field placeholder="Email" error={errors.email}>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                className="field px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            />
                        </Field>
                        <Field placeholder="Location" error={errors.location}>
                            <input
                                value={data.location}
                                onChange={(event) => setData('location', event.target.value)}
                                className="field px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            />
                        </Field>
                        <Field
                            placeholder="Website"
                            error={errors.website_url}
                            className="md:col-span-2"
                        >
                            <input
                                value={data.website_url}
                                onChange={(event) => setData('website_url', event.target.value)}
                                className="field px-3.5 py-2.5 text-[13px] 2xl:px-4 2xl:py-3 2xl:text-sm"
                            />
                        </Field>
                        <Field placeholder="Bio" error={errors.bio} className="md:col-span-2">
                            <textarea
                                value={data.bio}
                                onChange={(event) => setData('bio', event.target.value)}
                                className="field min-h-24 resize-none px-3.5 py-2.5 text-[13px] 2xl:min-h-28 2xl:px-4 2xl:py-3 2xl:text-sm"
                            />
                        </Field>
                        <label className="app-panel-inset app-text-high inline-flex w-fit items-center gap-2.5 rounded-[18px] px-3.5 py-3 text-[13px] md:col-span-2 2xl:gap-3 2xl:rounded-2xl 2xl:px-4 2xl:py-4 2xl:text-sm">
                            <input
                                type="checkbox"
                                checked={data.is_private}
                                onChange={(event) => setData('is_private', event.target.checked)}
                                className="app-input-check rounded"
                            />
                            Private account
                        </label>

                        <div className="md:col-span-2">
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2"
                            >
                                Save changes
                            </PrimaryButton>
                        </div>
                    </form>
                </section>

                <section className="app-panel rounded-[28px] p-5 2xl:rounded-[32px] 2xl:p-6">
                    <UpdatePasswordForm className="max-w-xl" />
                </section>

                <section className="app-panel rounded-[28px] p-5 2xl:rounded-[32px] 2xl:p-6">
                    <DeleteUserForm className="max-w-xl" />
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function Field({ placeholder, hint, error, className = '', children }) {
    const childProps = children.props ?? {};
    const enhancedProps = {
        ...childProps,
        placeholder:
            childProps.type === 'file'
                ? childProps.placeholder
                : (childProps.placeholder ?? placeholder),
        'aria-label': childProps['aria-label'] ?? placeholder,
    };

    return (
        <div className={className}>
            {hint && (
                <div className="app-text-muted mb-2 text-[11px] font-medium 2xl:text-xs">
                    {hint}
                </div>
            )}
            {cloneElement(children, enhancedProps)}
            {error && <div className="mt-2 text-[13px] text-rose-300 2xl:text-sm">{error}</div>}
        </div>
    );
}
