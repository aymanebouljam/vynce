import InputError from '@/Components/InputError';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';

const visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'followers', label: 'Followers' },
];

export default function PostComposer() {
    const { data, setData, post, processing, errors, reset } = useForm({
        body: '',
        visibility: 'public',
        media: [],
    });
    const [isAudienceOpen, setIsAudienceOpen] = useState(false);
    const audienceRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!audienceRef.current?.contains(event.target)) {
                setIsAudienceOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const submit = (event) => {
        event.preventDefault();

        post(route('posts.store'), {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    const activeVisibility =
        visibilityOptions.find((option) => option.value === data.visibility) ??
        visibilityOptions[0];

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
                    <div ref={audienceRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setIsAudienceOpen((open) => !open)}
                            className="app-select-field flex w-28 items-center justify-between gap-2 py-2 pl-4 pr-3 text-sm"
                        >
                            <span>{activeVisibility.label}</span>
                            <ChevronDown
                                className={`app-text-muted h-4 w-4 transition ${isAudienceOpen ? 'rotate-180' : ''}`}
                                strokeWidth={2}
                            />
                        </button>

                        {isAudienceOpen && (
                            <div className="app-panel-inset absolute left-0 top-[calc(100%+0.5rem)] z-20 w-40 space-y-1 rounded-2xl p-2 shadow-[var(--vynce-shadow-md)]">
                                {visibilityOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            setData('visibility', option.value);
                                            setIsAudienceOpen(false);
                                        }}
                                        className={`flex w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                                            data.visibility === option.value
                                                ? 'app-nav-link-active'
                                                : 'app-nav-link'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

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
