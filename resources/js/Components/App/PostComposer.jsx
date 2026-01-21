import InputError from '@/Components/InputError';
import { ChevronDown, Image, MessageCircle, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';

const visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'followers', label: 'Followers' },
];

export default function PostComposer({ onSuccess = () => {}, compact = false }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        body: '',
        visibility: 'public',
        media: [],
    });
    const [isAudienceOpen, setIsAudienceOpen] = useState(false);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const audienceRef = useRef(null);
    const mediaInputRef = useRef(null);
    const initials = auth.user.name
        ?.split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

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

    useEffect(() => {
        return () => {
            mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [mediaPreviews]);

    const handleMediaChange = (files) => {
        const nextFiles = Array.from(files ?? []).slice(0, 4);

        mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));

        setData('media', nextFiles);
        setMediaPreviews(
            nextFiles.map((file, index) => ({
                id: `${file.name}-${file.size}-${index}`,
                url: URL.createObjectURL(file),
                name: file.name,
            })),
        );
    };

    const removeMedia = (indexToRemove) => {
        const nextFiles = data.media.filter((_, index) => index !== indexToRemove);

        mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));

        setData('media', nextFiles);
        setMediaPreviews(
            nextFiles.map((file, index) => ({
                id: `${file.name}-${file.size}-${index}`,
                url: URL.createObjectURL(file),
                name: file.name,
            })),
        );

        if (mediaInputRef.current) {
            mediaInputRef.current.value = '';
        }
    };

    const submit = (event) => {
        event.preventDefault();

        post(route('posts.store'), {
            forceFormData: true,
            onSuccess: () => {
                mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
                setMediaPreviews([]);
                reset();

                if (mediaInputRef.current) {
                    mediaInputRef.current.value = '';
                }

                onSuccess();
            },
        });
    };

    const activeVisibility =
        visibilityOptions.find((option) => option.value === data.visibility) ??
        visibilityOptions[0];

    return (
        <form
            onSubmit={submit}
            className="app-panel feed-composer-shell w-full rounded-[28px] p-5 backdrop-blur"
        >
            <div className="feed-composer-card">
                {auth.user.avatar_url ? (
                    <div className="feed-composer-avatar overflow-hidden">
                        <img
                            src={auth.user.avatar_url}
                            alt={auth.user.name}
                            className="h-full w-full object-cover"
                            style={{
                                objectPosition: `${auth.user.avatar_position_x}% ${auth.user.avatar_position_y}%`,
                                transform: `scale(${auth.user.avatar_zoom})`,
                                transformOrigin: `${auth.user.avatar_position_x}% ${auth.user.avatar_position_y}%`,
                            }}
                        />
                    </div>
                ) : (
                    <div className="app-avatar-fallback feed-composer-avatar flex items-center justify-center text-sm font-bold">
                        {initials}
                    </div>
                )}

                <div className="feed-composer-body">
                    <div className="feed-composer-pill">
                        <textarea
                            value={data.body}
                            onChange={(event) => setData('body', event.target.value)}
                            className={`feed-composer-textarea ${
                                compact ? '' : 'feed-composer-textarea--profile-modal'
                            }`}
                            placeholder="Share something sharp, useful, or memorable."
                        />
                    </div>

                    {mediaPreviews.length > 0 && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {mediaPreviews.map((preview, index) => (
                                <div
                                    key={preview.id}
                                    className="app-panel-inset relative overflow-hidden rounded-3xl"
                                >
                                    <img
                                        src={preview.url}
                                        alt={preview.name}
                                        className="h-40 w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="app-button-secondary absolute right-3 top-3 rounded-full px-3 py-1 text-xs"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="feed-composer-actions">
                        <label className="feed-composer-action cursor-pointer">
                            <Image className="h-4 w-4" />
                            {data.media.length > 0
                                ? `${data.media.length} image${data.media.length > 1 ? 's' : ''}`
                                : 'Media'}
                            <input
                                ref={mediaInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(event) => handleMediaChange(event.target.files)}
                                className="hidden"
                                aria-label="Add images"
                            />
                        </label>

                        <div ref={audienceRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setIsAudienceOpen((open) => !open)}
                                className="feed-composer-action"
                            >
                                <MessageCircle className="h-4 w-4" />
                                {activeVisibility.label}
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

                        <button
                            type="submit"
                            disabled={processing}
                            className="feed-composer-send disabled:opacity-60"
                        >
                            <SendHorizontal className="h-4 w-4" />
                        </button>
                    </div>

                    <InputError message={errors.body} className="mt-2" />
                    <InputError message={errors.visibility} className="mt-2" />
                    <InputError message={errors.media} className="mt-2" />
                    <InputError message={errors['media.0']} className="mt-2" />
                </div>
            </div>
        </form>
    );
}
