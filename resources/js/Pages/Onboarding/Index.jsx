import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';
import { cloneElement } from 'react';

export default function Onboarding({ profile }) {
    const { data, setData, post, processing, errors } = useForm({
        name: profile.name ?? '',
        username: profile.username ?? '',
        bio: profile.bio ?? '',
        website_url: profile.website_url ?? '',
        location: profile.location ?? '',
        is_private: profile.is_private ?? false,
        avatar: null,
        cover: null,
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('onboarding.store'), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout title="Onboarding">
            <section className="app-panel rounded-[32px] p-6 md:p-8">
                <div className="mb-8 max-w-2xl">
                    <h1 className="text-3xl font-semibold md:text-4xl">
                        Finish your profile in one pass
                    </h1>
                    <p className="app-text-soft mt-3 text-sm leading-7">
                        Add the essentials now. You can refine visuals, privacy, and content style
                        any time from settings.
                    </p>
                </div>

                <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
                    <Field placeholder="Display name" error={errors.name}>
                        <input
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            className="field"
                        />
                    </Field>
                    <Field placeholder="Username" error={errors.username}>
                        <input
                            value={data.username}
                            onChange={(event) =>
                                setData('username', event.target.value.toLowerCase())
                            }
                            className="field"
                        />
                    </Field>
                    <Field placeholder="Location" error={errors.location}>
                        <input
                            value={data.location}
                            onChange={(event) => setData('location', event.target.value)}
                            className="field"
                        />
                    </Field>
                    <Field placeholder="Website" error={errors.website_url}>
                        <input
                            value={data.website_url}
                            onChange={(event) => setData('website_url', event.target.value)}
                            className="field"
                        />
                    </Field>
                    <Field
                        placeholder="Tell people what you’re building, exploring, or sharing."
                        error={errors.bio}
                        className="md:col-span-2"
                    >
                        <textarea
                            value={data.bio}
                            onChange={(event) => setData('bio', event.target.value)}
                            className="field min-h-32 resize-none"
                        />
                    </Field>
                    <Field placeholder="Avatar" hint="Avatar" error={errors.avatar}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => setData('avatar', event.target.files[0] ?? null)}
                            className="field app-file-input app-file-input-compact"
                        />
                    </Field>
                    <Field placeholder="Cover image" hint="Cover image" error={errors.cover}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => setData('cover', event.target.files[0] ?? null)}
                            className="field app-file-input app-file-input-compact"
                        />
                    </Field>

                    <label className="app-panel-inset app-text-high flex items-center gap-3 rounded-2xl px-4 py-4 text-sm md:col-span-2">
                        <input
                            type="checkbox"
                            checked={data.is_private}
                            onChange={(event) => setData('is_private', event.target.checked)}
                            className="app-input-check rounded"
                        />
                        Start with a private account
                    </label>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="app-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
                        >
                            Join
                        </button>
                    </div>
                </form>
            </section>
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
            {hint && <div className="app-text-muted mb-2 text-xs font-medium">{hint}</div>}
            {cloneElement(children, enhancedProps)}
            {error && <div className="mt-2 text-sm text-rose-300">{error}</div>}
        </div>
    );
}
