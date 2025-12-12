import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';

export default function PostComposer() {
    const { data, setData, post, processing, errors, reset } = useForm({
        body: '',
        visibility: 'public',
        media: [],
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('posts.store'), {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <form
            onSubmit={submit}
            className="space-y-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.32)] backdrop-blur"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6a3d] to-[#ffd166] text-sm font-bold text-slate-950">
                    V
                </div>
                <div className="flex-1">
                    <textarea
                        value={data.body}
                        onChange={(event) => setData('body', event.target.value)}
                        className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#ff6a3d] focus:outline-none focus:ring-0"
                        placeholder="Share something sharp, useful, or memorable."
                    />
                    <InputError message={errors.body} className="mt-2" />
                </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <select
                        value={data.visibility}
                        onChange={(event) =>
                            setData('visibility', event.target.value)
                        }
                        className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white focus:border-[#ff6a3d] focus:outline-none"
                    >
                        <option value="public">Public</option>
                        <option value="followers">Followers</option>
                        <option value="private">Only me</option>
                    </select>

                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(event) =>
                            setData('media', Array.from(event.target.files))
                        }
                        className="block text-xs text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-full bg-[#ff6a3d] px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[#ff875f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Publish
                </button>
            </div>

            <InputError message={errors.visibility} />
            <InputError message={errors.media} />
            <InputError message={errors['media.0']} />
        </form>
    );
}
