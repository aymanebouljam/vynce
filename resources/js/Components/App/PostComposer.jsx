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
        <form onSubmit={submit} className="app-panel space-y-4 rounded-[28px] p-5 backdrop-blur">
            <div className="flex items-start gap-3">
                <div className="app-avatar-fallback flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold">
                    V
                </div>
                <div className="flex-1">
                    <textarea
                        value={data.body}
                        onChange={(event) => setData('body', event.target.value)}
                        className="field min-h-28 w-full resize-none text-sm"
                        placeholder="Share something sharp, useful, or memorable."
                    />
                    <InputError message={errors.body} className="mt-2" />
                </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <select
                        value={data.visibility}
                        onChange={(event) => setData('visibility', event.target.value)}
                        className="field rounded-2xl py-2 text-sm"
                    >
                        <option value="public">Public</option>
                        <option value="followers">Followers</option>
                        <option value="private">Only me</option>
                    </select>

                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(event) => setData('media', Array.from(event.target.files))}
                        className="app-file-input block text-xs"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="app-button-primary rounded-full px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
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
