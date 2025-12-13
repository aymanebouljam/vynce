import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';

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
            <section className="rounded-[32px] border border-white/10 bg-slate-950/60 p-6 md:p-8">
                <div className="mb-8 max-w-2xl">
                    <div className="mb-3 inline-flex rounded-full border border-[#ff6a3d]/30 bg-[#ff6a3d]/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[#ffb39a]">
                        Step 1 of MVP
                    </div>
                    <h1 className="text-3xl font-semibold md:text-4xl">
                        Finish your profile in one pass
                    </h1>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                        Add the essentials now. You can refine visuals, privacy, and content style any time from settings.
                    </p>
                </div>

                <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
                    <Field label="Display name" error={errors.name}>
                        <input
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            className="field"
                        />
                    </Field>
                    <Field label="Username" error={errors.username}>
                        <input
                            value={data.username}
                            onChange={(event) =>
                                setData('username', event.target.value.toLowerCase())
                            }
                            className="field"
                        />
                    </Field>
                    <Field label="Location" error={errors.location}>
                        <input
                            value={data.location}
                            onChange={(event) => setData('location', event.target.value)}
                            className="field"
                        />
                    </Field>
                    <Field label="Website" error={errors.website_url}>
                        <input
                            value={data.website_url}
                            onChange={(event) =>
                                setData('website_url', event.target.value)
                            }
                            className="field"
                        />
                    </Field>
                    <Field label="Bio" error={errors.bio} className="md:col-span-2">
                        <textarea
                            value={data.bio}
                            onChange={(event) => setData('bio', event.target.value)}
                            className="field min-h-32 resize-none"
                            placeholder="Tell people what you’re building, exploring, or sharing."
                        />
                    </Field>
                    <Field label="Avatar" error={errors.avatar}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                setData('avatar', event.target.files[0] ?? null)
                            }
                            className="field file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white"
                        />
                    </Field>
                    <Field label="Cover image" error={errors.cover}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                setData('cover', event.target.files[0] ?? null)
                            }
                            className="field file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white"
                        />
                    </Field>

                    <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                        <input
                            type="checkbox"
                            checked={data.is_private}
                            onChange={(event) =>
                                setData('is_private', event.target.checked)
                            }
                            className="rounded border-white/10 bg-slate-900 text-[#ff6a3d] focus:ring-[#ff6a3d]"
                        />
                        Start with a private account
                    </label>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-[#ff6a3d] px-5 py-3 text-sm font-semibold text-slate-950"
                        >
                            Enter Vynce
                        </button>
                    </div>
                </form>
            </section>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, className = '', children }) {
    return (
        <div className={className}>
            <label className="mb-2 block text-sm text-slate-300">{label}</label>
            {children}
            {error && <div className="mt-2 text-sm text-rose-300">{error}</div>}
        </div>
    );
}
