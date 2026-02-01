import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import {
    ChevronDown,
    Image,
    MessageCircle,
    SendHorizontal,
    SquareDashedMousePointer,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';

const visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'followers', label: 'Followers' },
];
const cropAspectRatio = 4 / 5;
const minimumCropWidth = 160;
const cropHandles = [
    {
        name: 'nw',
        label: 'Resize crop from top left',
        className: 'left-0 top-0',
        cursorClass: 'cursor-nwse-resize',
        left: () => 0,
        top: () => 0,
    },
    {
        name: 'ne',
        label: 'Resize crop from top right',
        className: 'left-full top-0',
        cursorClass: 'cursor-nesw-resize',
        left: (rect) => rect.width,
        top: () => 0,
    },
    {
        name: 'sw',
        label: 'Resize crop from bottom left',
        className: 'left-0 top-full',
        cursorClass: 'cursor-nesw-resize',
        left: () => 0,
        top: (rect) => rect.height,
    },
    {
        name: 'se',
        label: 'Resize crop from bottom right',
        className: 'left-full top-full',
        cursorClass: 'cursor-nwse-resize',
        left: (rect) => rect.width,
        top: (rect) => rect.height,
    },
];

export default function PostComposer({ onSuccess = () => {}, compact = false }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        body: '',
        visibility: 'public',
        media: [],
        media_transform: [],
    });
    const [isAudienceOpen, setIsAudienceOpen] = useState(false);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [activeMediaIndex, setActiveMediaIndex] = useState(null);
    const [isApplyingCrop, setIsApplyingCrop] = useState(false);
    const [cropBounds, setCropBounds] = useState(null);
    const [cropRect, setCropRect] = useState(null);
    const [cropInteractionState, setCropInteractionState] = useState(null);
    const audienceRef = useRef(null);
    const mediaInputRef = useRef(null);
    const cropStageRef = useRef(null);
    const cropImageRef = useRef(null);
    const initials = auth.user.name
        ?.split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const activeVisibility =
        visibilityOptions.find((option) => option.value === data.visibility) ??
        visibilityOptions[0];
    const activeMediaPreview =
        activeMediaIndex !== null ? (mediaPreviews[activeMediaIndex] ?? null) : null;

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

    useEffect(() => {
        if (!cropInteractionState || !cropBounds || !cropRect) {
            return undefined;
        }

        const handlePointerMove = (event) => {
            const deltaX = event.clientX - cropInteractionState.startX;
            const deltaY = event.clientY - cropInteractionState.startY;

            setCropRect((currentRect) => {
                if (!currentRect) {
                    return currentRect;
                }

                if (cropInteractionState.mode === 'resize') {
                    return resizeCropRect({
                        bounds: cropBounds,
                        rect: currentRect,
                        interaction: cropInteractionState,
                        deltaX,
                        deltaY,
                    });
                }

                return {
                    ...currentRect,
                    x: clamp(
                        cropInteractionState.originX + deltaX,
                        0,
                        cropBounds.width - currentRect.width,
                    ),
                    y: clamp(
                        cropInteractionState.originY + deltaY,
                        0,
                        cropBounds.height - currentRect.height,
                    ),
                };
            });
        };

        const handlePointerUp = () => {
            setCropInteractionState(null);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [cropBounds, cropInteractionState, cropRect]);

    useEffect(() => {
        if (activeMediaIndex === null || !activeMediaPreview) {
            setCropBounds(null);
            setCropRect(null);
            setCropInteractionState(null);
            return undefined;
        }

        const syncCropOverlay = () => {
            const stage = cropStageRef.current;
            const image = cropImageRef.current;

            if (!stage || !image || image.clientWidth === 0 || image.clientHeight === 0) {
                return;
            }

            const stageRect = stage.getBoundingClientRect();
            const imageRect = image.getBoundingClientRect();
            const nextBounds = {
                x: imageRect.left - stageRect.left,
                y: imageRect.top - stageRect.top,
                width: imageRect.width,
                height: imageRect.height,
            };

            setCropBounds(nextBounds);
            setCropRect((currentRect) => createCropRect(nextBounds, currentRect));
        };

        syncCropOverlay();

        const resizeObserver = new ResizeObserver(() => {
            syncCropOverlay();
        });

        if (cropStageRef.current) {
            resizeObserver.observe(cropStageRef.current);
        }

        if (cropImageRef.current) {
            resizeObserver.observe(cropImageRef.current);
        }

        window.addEventListener('resize', syncCropOverlay);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', syncCropOverlay);
        };
    }, [activeMediaIndex, activeMediaPreview]);

    const handleMediaChange = (files) => {
        const nextFiles = Array.from(files ?? []).slice(0, 4);

        mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));

        setData('media', nextFiles);
        setData(
            'media_transform',
            nextFiles.map(() => ({
                position_x: 50,
                position_y: 50,
            })),
        );
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
        setData(
            'media_transform',
            data.media_transform.filter((_, index) => index !== indexToRemove),
        );
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

        if (activeMediaIndex === indexToRemove) {
            setActiveMediaIndex(null);
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

    const replaceMediaAtIndex = (indexToReplace, nextFile) => {
        const nextFiles = data.media.map((file, fileIndex) =>
            fileIndex === indexToReplace ? nextFile : file,
        );

        mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));

        setData('media', nextFiles);
        setData(
            'media_transform',
            data.media_transform.map((transform, transformIndex) =>
                transformIndex === indexToReplace
                    ? {
                          position_x: 50,
                          position_y: 50,
                      }
                    : transform,
            ),
        );
        setMediaPreviews(
            nextFiles.map((file, previewIndex) => ({
                id: `${file.name}-${file.size}-${previewIndex}-${Date.now()}`,
                url: URL.createObjectURL(file),
                name: file.name,
            })),
        );
    };

    const closeActiveCropModal = () => {
        if (!isApplyingCrop) {
            setCropBounds(null);
            setCropRect(null);
            setCropInteractionState(null);
            setActiveMediaIndex(null);
        }
    };

    const applyCropToActiveMedia = async () => {
        if (
            activeMediaIndex === null ||
            !data.media[activeMediaIndex] ||
            isApplyingCrop ||
            !cropRect ||
            !cropBounds
        ) {
            return;
        }

        setIsApplyingCrop(true);

        try {
            const croppedFile = await cropFileToPostFrame(
                data.media[activeMediaIndex],
                cropRect,
                cropBounds,
            );

            replaceMediaAtIndex(activeMediaIndex, croppedFile);
            setCropBounds(null);
            setCropRect(null);
            setCropInteractionState(null);
            setActiveMediaIndex(null);
        } finally {
            setIsApplyingCrop(false);
        }
    };

    const startCropDrag = (event) => {
        if (!cropRect) {
            return;
        }

        event.preventDefault();

        setCropInteractionState({
            mode: 'move',
            startX: event.clientX,
            startY: event.clientY,
            originX: cropRect.x,
            originY: cropRect.y,
        });
    };

    const startCropResize = (handle) => (event) => {
        if (!cropRect || !cropBounds) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        setCropInteractionState({
            mode: 'resize',
            handle,
            startX: event.clientX,
            startY: event.clientY,
            startRect: cropRect,
            bounds: cropBounds,
        });
    };

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
                                        style={{
                                            objectPosition: `${data.media_transform[index]?.position_x ?? 50}% ${data.media_transform[index]?.position_y ?? 50}%`,
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="app-button-secondary absolute right-3 top-3 rounded-full px-3 py-1 text-xs"
                                    >
                                        Remove
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveMediaIndex(index)}
                                        className="app-button-secondary absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
                                    >
                                        <SquareDashedMousePointer
                                            className="h-3.5 w-3.5"
                                            strokeWidth={1.9}
                                        />
                                        Crop
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

            <Modal
                show={activeMediaIndex !== null && Boolean(activeMediaPreview)}
                onClose={closeActiveCropModal}
                maxWidth="2xl"
                centered
            >
                {activeMediaPreview && activeMediaIndex !== null && (
                    <div className="space-y-6 p-6">
                        <div>
                            <div className="text-lg font-semibold">Crop image</div>
                            <p className="app-text-soft mt-2 text-sm leading-6">
                                Move the selection frame to choose exactly what will be published.
                            </p>
                        </div>

                        <div
                            ref={cropStageRef}
                            className="app-panel-inset relative flex min-h-[24rem] items-center justify-center overflow-hidden rounded-[32px] p-4 sm:p-6"
                        >
                            <img
                                ref={cropImageRef}
                                src={activeMediaPreview.url}
                                alt={activeMediaPreview.name}
                                onLoad={() => {
                                    const stage = cropStageRef.current;
                                    const image = cropImageRef.current;

                                    if (!stage || !image) {
                                        return;
                                    }

                                    const stageRect = stage.getBoundingClientRect();
                                    const imageRect = image.getBoundingClientRect();
                                    const nextBounds = {
                                        x: imageRect.left - stageRect.left,
                                        y: imageRect.top - stageRect.top,
                                        width: imageRect.width,
                                        height: imageRect.height,
                                    };

                                    setCropBounds(nextBounds);
                                    setCropRect((currentRect) =>
                                        createCropRect(nextBounds, currentRect),
                                    );
                                }}
                                className="max-h-[70vh] w-full rounded-[24px] object-contain"
                            />

                            {cropBounds && cropRect ? (
                                <>
                                    <div
                                        className="pointer-events-none absolute bg-black/50"
                                        style={{
                                            left: cropBounds.x,
                                            top: cropBounds.y,
                                            width: cropBounds.width,
                                            height: cropRect.y,
                                        }}
                                    />
                                    <div
                                        className="pointer-events-none absolute bg-black/50"
                                        style={{
                                            left: cropBounds.x,
                                            top: cropBounds.y + cropRect.y + cropRect.height,
                                            width: cropBounds.width,
                                            height:
                                                cropBounds.height - cropRect.y - cropRect.height,
                                        }}
                                    />
                                    <div
                                        className="pointer-events-none absolute bg-black/50"
                                        style={{
                                            left: cropBounds.x,
                                            top: cropBounds.y + cropRect.y,
                                            width: cropRect.x,
                                            height: cropRect.height,
                                        }}
                                    />
                                    <div
                                        className="pointer-events-none absolute bg-black/50"
                                        style={{
                                            left: cropBounds.x + cropRect.x + cropRect.width,
                                            top: cropBounds.y + cropRect.y,
                                            width: cropBounds.width - cropRect.x - cropRect.width,
                                            height: cropRect.height,
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onPointerDown={startCropDrag}
                                        className="absolute cursor-grab active:cursor-grabbing"
                                        style={{
                                            left: cropBounds.x + cropRect.x,
                                            top: cropBounds.y + cropRect.y,
                                            width: cropRect.width,
                                            height: cropRect.height,
                                        }}
                                        aria-label="Move crop selection"
                                    >
                                        <span className="pointer-events-none absolute inset-0 rounded-[28px] border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.02)]" />
                                        <span className="pointer-events-none absolute inset-[10px] rounded-[20px] border border-white/35" />
                                        <span className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/25" />
                                        <span className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/25" />
                                        {cropHandles.map((handle) => (
                                            <span
                                                key={handle.name}
                                                className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[rgba(17,11,28,0.75)] bg-white ${handle.className}`}
                                            />
                                        ))}
                                    </button>
                                    {cropHandles.map((handle) => (
                                        <button
                                            key={handle.name}
                                            type="button"
                                            onPointerDown={startCropResize(handle.name)}
                                            className={`absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full ${handle.cursorClass}`}
                                            style={{
                                                left:
                                                    cropBounds.x +
                                                    cropRect.x +
                                                    handle.left(cropRect),
                                                top:
                                                    cropBounds.y +
                                                    cropRect.y +
                                                    handle.top(cropRect),
                                            }}
                                            aria-label={handle.label}
                                        />
                                    ))}
                                </>
                            ) : null}
                        </div>

                        <p className="app-text-muted text-xs">
                            The crop frame stays in a `4:5` portrait ratio for feed posts.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeActiveCropModal}
                                disabled={isApplyingCrop}
                                className="app-button-secondary rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={applyCropToActiveMedia}
                                disabled={isApplyingCrop}
                                className="app-button-primary rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                            >
                                Apply crop
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </form>
    );
}

async function cropFileToPostFrame(file, cropRect, cropBounds) {
    const image = await loadImageFromFile(file);
    const canvas = document.createElement('canvas');
    const frameWidth = 1200;
    const frameHeight = 1500;
    const scaleX = image.naturalWidth / cropBounds.width;
    const scaleY = image.naturalHeight / cropBounds.height;
    const sourceX = cropRect.x * scaleX;
    const sourceY = cropRect.y * scaleY;
    const sourceWidth = cropRect.width * scaleX;
    const sourceHeight = cropRect.height * scaleY;

    canvas.width = frameWidth;
    canvas.height = frameHeight;

    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Could not prepare image crop.');
    }

    context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        frameWidth,
        frameHeight,
    );

    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const extension = mimeType === 'image/png' ? 'png' : 'jpg';
    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (nextBlob) => {
                if (nextBlob) {
                    resolve(nextBlob);
                    return;
                }

                reject(new Error('Could not export cropped image.'));
            },
            mimeType,
            0.92,
        );
    });

    const baseName = file.name.replace(/\.[^/.]+$/, '');

    return new File([blob], `${baseName}-cropped.${extension}`, {
        type: mimeType,
        lastModified: Date.now(),
    });
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new window.Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Could not load image for cropping.'));
        };

        image.src = objectUrl;
    });
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function createCropRect(bounds, currentRect = null) {
    const inset = 24;
    const maxWidth = Math.max(bounds.width - inset, bounds.width * 0.72);
    const maxHeight = Math.max(bounds.height - inset, bounds.height * 0.72);

    let width = Math.min(maxWidth, maxHeight * cropAspectRatio);
    let height = width / cropAspectRatio;

    if (height > maxHeight) {
        height = maxHeight;
        width = height * cropAspectRatio;
    }

    if (currentRect) {
        const nextWidth = clamp(currentRect.width, minimumCropWidth, bounds.width);
        const widthFromHeight = bounds.height * cropAspectRatio;
        const clampedWidth = Math.min(nextWidth, widthFromHeight, bounds.width);
        const nextHeight = clampedWidth / cropAspectRatio;

        return {
            ...currentRect,
            width: clampedWidth,
            height: nextHeight,
            x: clamp(currentRect.x, 0, bounds.width - clampedWidth),
            y: clamp(currentRect.y, 0, bounds.height - nextHeight),
        };
    }

    return {
        width,
        height,
        x: (bounds.width - width) / 2,
        y: (bounds.height - height) / 2,
    };
}

function resizeCropRect({ bounds, rect, interaction, deltaX, deltaY }) {
    const minimumWidth = Math.min(minimumCropWidth, bounds.width, bounds.height * cropAspectRatio);
    const minimumHeight = minimumWidth / cropAspectRatio;
    const startRect = interaction.startRect;

    const anchoredRight = startRect.x + startRect.width;
    const anchoredBottom = startRect.y + startRect.height;
    const horizontalDelta = interaction.handle.includes('w') ? -deltaX : deltaX;
    const verticalDelta = interaction.handle.includes('n') ? -deltaY : deltaY;
    const dominantDelta =
        Math.abs(horizontalDelta) >= Math.abs(verticalDelta * cropAspectRatio)
            ? horizontalDelta
            : verticalDelta * cropAspectRatio;

    let nextWidth = clamp(
        startRect.width + dominantDelta,
        minimumWidth,
        Math.min(bounds.width, bounds.height * cropAspectRatio),
    );
    let nextHeight = nextWidth / cropAspectRatio;

    if (interaction.handle.includes('w')) {
        nextWidth = Math.min(nextWidth, anchoredRight);
    } else {
        nextWidth = Math.min(nextWidth, bounds.width - startRect.x);
    }

    nextHeight = nextWidth / cropAspectRatio;

    if (interaction.handle.includes('n')) {
        nextHeight = Math.min(nextHeight, anchoredBottom);
        nextWidth = nextHeight * cropAspectRatio;
    } else {
        nextHeight = Math.min(nextHeight, bounds.height - startRect.y);
        nextWidth = nextHeight * cropAspectRatio;
    }

    nextWidth = Math.max(nextWidth, minimumWidth);
    nextHeight = Math.max(nextHeight, minimumHeight);

    let nextX = startRect.x;
    let nextY = startRect.y;

    if (interaction.handle.includes('w')) {
        nextX = anchoredRight - nextWidth;
    }

    if (interaction.handle.includes('n')) {
        nextY = anchoredBottom - nextHeight;
    }

    nextX = clamp(nextX, 0, bounds.width - nextWidth);
    nextY = clamp(nextY, 0, bounds.height - nextHeight);

    return {
        ...rect,
        x: nextX,
        y: nextY,
        width: nextWidth,
        height: nextHeight,
    };
}
