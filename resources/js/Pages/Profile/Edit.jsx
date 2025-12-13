import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
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
        avatar: null,
        cover: null,
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('profile.update'), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout title="Edit profile">
            <Head title="Edit profile" />

            <div className="space-y-6">
                <section className="rounded-[32px] border border-white/10 bg-slate-950/60 p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold">Edit profile</h1>
                        <p className="mt-2 text-sm leading-7 text-slate-400">
                            Keep identity fields clean and update your public-facing details here.
                        </p>
                    </div>

                    <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
                        <Field label="Name" error={errors.name}>
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
                        <Field label="Email" error={errors.email}>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
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
                        <Field
                            label="Website"
                            error={errors.website_url}
                            className="md:col-span-2"
                        >
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
                                className="field min-h-28 resize-none"
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
                            Private account
                        </label>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-full bg-[#ff6a3d] px-5 py-3 text-sm font-semibold text-slate-950"
                            >
                                Save changes
                            </button>
                        </div>
                    </form>
                </section>

                <section className="rounded-[32px] border border-white/10 bg-slate-950/60 p-6">
                    <UpdatePasswordForm className="max-w-xl" />
                </section>

                <section className="rounded-[32px] border border-white/10 bg-slate-950/60 p-6">
                    <DeleteUserForm className="max-w-xl" />
                </section>
            </div>
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
