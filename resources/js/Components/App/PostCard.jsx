import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import {
    ChevronLeft,
    ChevronRight,
    Ellipsis,
    Globe,
    Heart,
    MessageCircle,
    Pencil,
    Repeat2,
    SendHorizontal,
    Trash2,
    Users,
} from 'lucide-react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function PostCard({
    post,
    profileUsername = null,
    showProfileRepostLabel = true,
    profileRepostLabel = null,
    highlighted = false,
}) {
    const { auth } = usePage().props;
    const authorName = post.user?.name ?? 'Unknown user';
    const authorUsername = post.user?.username ?? null;
    const authorHref = authorUsername ? route('users.show', authorUsername) : null;
    const publishedAt = new Date(post.published_at || post.created_at).toLocaleString();
    const canManage = auth?.user?.id === post.user?.id;
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [liking, setLiking] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [visibilityMenuOpen, setVisibilityMenuOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(null);
    const [selectedVisibility, setSelectedVisibility] = useState(post.visibility);
    const [isVisibilitySaving, setIsVisibilitySaving] = useState(false);
    const menuButtonRef = useRef(null);
    const menuPanelRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const visibilityButtonRef = useRef(null);
    const visibilityPanelRef = useRef(null);
    const [visibilityMenuPosition, setVisibilityMenuPosition] = useState({ top: 0, left: 0 });
    const commentForm = useForm({ body: '' });
    const editForm = useForm({
        body: post.body ?? '',
        visibility: post.visibility,
    });
    const deleteForm = useForm({});
    const currentVisibility = selectedVisibility ?? post.visibility;
    const initials = authorName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const isProfileRepost =
        Boolean(post.profile_reposted_at) && showProfileRepostLabel && profileUsername;
    const visibilityIcon =
        currentVisibility === 'followers' ? (
            <Users className="h-3.5 w-3.5" strokeWidth={1.9} />
        ) : (
            <Globe className="h-3.5 w-3.5" strokeWidth={1.9} />
        );

    useEffect(() => {
        setIsLiked(post.is_liked);
        setLikesCount(post.likes_count ?? 0);
    }, [post.id, post.is_liked, post.likes_count]);

    useEffect(() => {
        setSelectedVisibility(post.visibility);
    }, [post.id, post.visibility]);

    useEffect(() => {
        setViewerIndex(null);
    }, [post.id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedButton = menuButtonRef.current?.contains(event.target);
            const clickedPanel = menuPanelRef.current?.contains(event.target);
            const clickedVisibilityButton = visibilityButtonRef.current?.contains(event.target);
            const clickedVisibilityPanel = visibilityPanelRef.current?.contains(event.target);

            if (!clickedButton && !clickedPanel) {
                setMenuOpen(false);
            }

            if (!clickedVisibilityButton && !clickedVisibilityPanel) {
                setVisibilityMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (viewerIndex === null) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft') {
                setViewerIndex((current) => {
                    if (current === null) {
                        return current;
                    }

                    return current === 0 ? post.media.length - 1 : current - 1;
                });
            }

            if (event.key === 'ArrowRight') {
                setViewerIndex((current) => {
                    if (current === null) {
                        return current;
                    }

                    return current === post.media.length - 1 ? 0 : current + 1;
                });
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [viewerIndex, post.media.length]);

    useEffect(() => {
        if (!menuOpen) {
            return undefined;
        }

        const updateMenuPosition = () => {
            const rect = menuButtonRef.current?.getBoundingClientRect();

            if (!rect) {
                return;
            }

            setMenuPosition({
                top: rect.bottom + 8,
                left: rect.right - 176,
            });
        };

        updateMenuPosition();

        window.addEventListener('resize', updateMenuPosition);
        window.addEventListener('scroll', updateMenuPosition, true);

        return () => {
            window.removeEventListener('resize', updateMenuPosition);
            window.removeEventListener('scroll', updateMenuPosition, true);
        };
    }, [menuOpen]);

    useEffect(() => {
        if (!visibilityMenuOpen) {
            return undefined;
        }

        const updateVisibilityMenuPosition = () => {
            const rect = visibilityButtonRef.current?.getBoundingClientRect();

            if (!rect) {
                return;
            }

            setVisibilityMenuPosition({
                top: rect.bottom + 12,
                left: rect.right - 176,
            });
        };

        updateVisibilityMenuPosition();

        window.addEventListener('resize', updateVisibilityMenuPosition);
        window.addEventListener('scroll', updateVisibilityMenuPosition, true);

        return () => {
            window.removeEventListener('resize', updateVisibilityMenuPosition);
            window.removeEventListener('scroll', updateVisibilityMenuPosition, true);
        };
    }, [visibilityMenuOpen]);

    const submitComment = (event) => {
        event.preventDefault();

        commentForm.post(route('posts.comments.store', post.id), {
            preserveScroll: true,
            onSuccess: () => {
                commentForm.reset();
                setCommentsOpen(true);
            },
        });
    };

    const toggleLike = async () => {
        if (liking) {
            return;
        }

        const previousLiked = isLiked;
        const previousCount = likesCount;
        const nextLiked = !previousLiked;

        setLiking(true);
        setIsLiked(nextLiked);
        setLikesCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));

        try {
            const response = await window.axios.post(route('posts.likes.toggle', post.id), null, {
                headers: {
                    Accept: 'application/json',
                },
            });

            setIsLiked(response.data.liked);
            setLikesCount(response.data.likes_count);
        } catch {
            setIsLiked(previousLiked);
            setLikesCount(previousCount);
        } finally {
            setLiking(false);
        }
    };

    const submitEdit = (event) => {
        event.preventDefault();

        editForm.patch(route('posts.update', post.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setMenuOpen(false);
            },
        });
    };

    const openEditModal = () => {
        editForm.setData({
            body: post.body ?? '',
            visibility: post.visibility,
        });
        setSelectedVisibility(post.visibility);
        setEditOpen(true);
    };

    const updateVisibility = (visibility) => {
        if (editForm.processing || isVisibilitySaving || currentVisibility === visibility) {
            return;
        }

        const previousVisibility = currentVisibility;
        setVisibilityMenuOpen(false);
        setSelectedVisibility(visibility);
        editForm.setData('visibility', visibility);
        setIsVisibilitySaving(true);

        window.axios
            .patch(
                route('posts.update', post.id),
                {
                    body: editForm.data.body,
                    visibility,
                },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            )
            .then(({ data }) => {
                const persistedVisibility = data.post?.visibility ?? visibility;

                setSelectedVisibility(persistedVisibility);
                editForm.setData((current) => ({
                    ...current,
                    visibility: persistedVisibility,
                }));
            })
            .catch(() => {
                setSelectedVisibility(previousVisibility);
                editForm.setData((current) => ({
                    ...current,
                    visibility: previousVisibility,
                }));
            })
            .finally(() => {
                setIsVisibilitySaving(false);
            });
    };

    const submitDelete = () => {
        deleteForm.delete(route('posts.destroy', post.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setMenuOpen(false);
            },
        });
    };

    const currentViewerMedia =
        viewerIndex !== null && post.media?.[viewerIndex] ? post.media[viewerIndex] : null;

    const showPreviousMedia = () => {
        setViewerIndex((current) => {
            if (current === null) {
                return current;
            }

            return current === 0 ? post.media.length - 1 : current - 1;
        });
    };

    const showNextMedia = () => {
        setViewerIndex((current) => {
            if (current === null) {
                return current;
            }

            return current === post.media.length - 1 ? 0 : current + 1;
        });
    };

    return (
        <>
            <article
                className={`feed-post-card ${highlighted ? 'feed-post-card--highlighted' : ''}`}
            >
                <div className="feed-post-card__inner">
                    <div className="flex items-start gap-3">
                        {post.user?.avatar_url ? (
                            <div className="feed-post-card__avatar overflow-hidden">
                                <img
                                    src={post.user.avatar_url}
                                    alt={authorName}
                                    className="h-full w-full object-cover"
                                    style={{
                                        objectPosition: `${post.user.avatar_position_x}% ${post.user.avatar_position_y}%`,
                                        transform: `scale(${post.user.avatar_zoom})`,
                                        transformOrigin: `${post.user.avatar_position_x}% ${post.user.avatar_position_y}%`,
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="app-avatar-fallback feed-post-card__avatar flex items-center justify-center text-sm font-bold">
                                {initials}
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            {isProfileRepost && (
                                <div className="app-text-soft mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
                                    <Repeat2 className="h-3.5 w-3.5" strokeWidth={1.9} />
                                    {profileRepostLabel ?? `Reposted by @${profileUsername}`}
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    {authorHref ? (
                                        <Link
                                            href={authorHref}
                                            className="app-link text-sm font-semibold"
                                        >
                                            {authorName}
                                        </Link>
                                    ) : (
                                        <div className="text-sm font-semibold">{authorName}</div>
                                    )}
                                    <div className="app-text-muted mt-1 text-xs">
                                        {authorUsername ? `@${authorUsername} · ` : ''}
                                        {publishedAt}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        ref={visibilityButtonRef}
                                        type="button"
                                        onClick={() =>
                                            canManage && setVisibilityMenuOpen((open) => !open)
                                        }
                                        className="feed-post-card__visibility"
                                        title={currentVisibility}
                                        aria-label={currentVisibility}
                                    >
                                        {visibilityIcon}
                                    </button>
                                    {canManage && (
                                        <div className="relative">
                                            <button
                                                ref={menuButtonRef}
                                                type="button"
                                                onClick={() => setMenuOpen((open) => !open)}
                                                className="app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
                                                aria-label="Post options"
                                            >
                                                <Ellipsis className="h-4 w-4" strokeWidth={1.9} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {post.body ? (
                                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[rgba(241,235,251,0.9)]">
                                    {post.body}
                                </p>
                            ) : null}

                            {post.media?.length > 0 && (
                                <div
                                    className={`mt-4 grid gap-3 ${
                                        post.media.length > 1 ? 'md:grid-cols-2' : ''
                                    }`}
                                >
                                    {post.media.map((media, index) => (
                                        <div
                                            key={media.id}
                                            className={`feed-post-card__media ${
                                                post.media.length === 1
                                                    ? 'feed-post-card__media--single'
                                                    : ''
                                            }`}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setViewerIndex(index)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    setViewerIndex(index);
                                                }
                                            }}
                                        >
                                            <img
                                                src={media.url}
                                                alt=""
                                                className="feed-post-card__media-image"
                                                style={postMediaTransformStyle(media)}
                                            />
                                            {index === 0 && (
                                                <div className="feed-post-card__media-badge">
                                                    {post.media.length}{' '}
                                                    {post.media.length === 1 ? 'item' : 'items'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(post.hashtags?.length > 0 || post.mentions?.length > 0) && (
                                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                    {post.hashtags?.map((tag) => (
                                        <span key={tag} className="app-chip rounded-full px-3 py-1">
                                            #{tag}
                                        </span>
                                    ))}
                                    {post.mentions?.map((mention) => (
                                        <span
                                            key={mention}
                                            className="app-pill-muted rounded-full px-3 py-1"
                                        >
                                            @{mention}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={toggleLike}
                                    className={`app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                                        isLiked
                                            ? 'border-rose-400/30 bg-rose-500/15 text-rose-200'
                                            : ''
                                    } ${liking ? 'opacity-70' : ''}`}
                                >
                                    <Heart
                                        className={`h-4 w-4 ${isLiked ? 'fill-current text-rose-400' : ''}`}
                                        strokeWidth={1.9}
                                    />
                                    {likesCount}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCommentsOpen((open) => !open)}
                                    className={`app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                                        commentsOpen ? 'app-nav-link-active' : ''
                                    }`}
                                >
                                    <MessageCircle className="h-4 w-4" strokeWidth={1.9} />
                                    {post.comments_count ?? 0}
                                </button>

                                <Link
                                    href={route('posts.reposts.toggle', post.id)}
                                    method="post"
                                    as="button"
                                    className={`app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                                        post.is_reposted ? 'app-nav-link-active' : ''
                                    }`}
                                >
                                    <Repeat2 className="h-4 w-4" strokeWidth={1.9} />
                                    {post.reposts_count ?? 0}
                                </Link>
                            </div>

                            {commentsOpen && (
                                <div className="app-panel-inset mt-4 space-y-4 rounded-[24px] p-4">
                                    <form
                                        onSubmit={submitComment}
                                        className="flex items-start gap-3"
                                    >
                                        <textarea
                                            value={commentForm.data.body}
                                            onChange={(event) =>
                                                commentForm.setData('body', event.target.value)
                                            }
                                            className="field min-h-20 flex-1 resize-none text-sm"
                                            placeholder="Write a reply..."
                                        />
                                        <button
                                            type="submit"
                                            disabled={commentForm.processing}
                                            className="app-button-primary inline-flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-60"
                                        >
                                            <SendHorizontal className="h-4 w-4" strokeWidth={1.9} />
                                        </button>
                                    </form>

                                    {commentForm.errors.body && (
                                        <div className="text-sm text-rose-300">
                                            {commentForm.errors.body}
                                        </div>
                                    )}

                                    {post.comments?.length > 0 ? (
                                        <div className="space-y-3">
                                            {post.comments.map((comment) => (
                                                <div
                                                    key={comment.id}
                                                    className="app-card-inset rounded-2xl px-4 py-3"
                                                >
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-semibold">
                                                            {comment.user?.name ?? 'Unknown user'}
                                                        </span>
                                                        {comment.user?.username && (
                                                            <span className="app-text-muted text-xs">
                                                                @{comment.user.username}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                                                        {comment.body}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="app-text-soft text-sm">
                                            No comments yet. Start the conversation.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </article>
            {menuOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={menuPanelRef}
                        className="app-panel-inset fixed z-[220] w-44 rounded-2xl p-2 shadow-[var(--vynce-shadow-md)]"
                        style={{
                            top: `${menuPosition.top}px`,
                            left: `${Math.max(16, menuPosition.left)}px`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                openEditModal();
                                setMenuOpen(false);
                            }}
                            className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm"
                        >
                            <Pencil className="h-4 w-4" strokeWidth={1.9} />
                            Edit post
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDeleteOpen(true);
                                setMenuOpen(false);
                            }}
                            className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-200"
                        >
                            <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                            Delete post
                        </button>
                    </div>,
                    document.body,
                )}
            {visibilityMenuOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={visibilityPanelRef}
                        className="app-panel-inset fixed z-[220] w-44 rounded-2xl p-2 shadow-[var(--vynce-shadow-md)]"
                        style={{
                            top: `${visibilityMenuPosition.top}px`,
                            left: `${Math.max(16, visibilityMenuPosition.left)}px`,
                        }}
                    >
                        <div className="app-text-muted px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.18em]">
                            Visibility
                        </div>
                        <div className="space-y-1">
                            {[
                                { key: 'public', label: 'Public', icon: Globe },
                                { key: 'followers', label: 'Followers', icon: Users },
                            ].map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => updateVisibility(option.key)}
                                    className={`app-nav-link flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                                        currentVisibility === option.key
                                            ? 'app-nav-link-active'
                                            : ''
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <option.icon className="h-4 w-4" strokeWidth={1.9} />
                                        {option.label}
                                    </span>
                                    {currentVisibility === option.key ? (
                                        <span className="app-text-soft text-xs">Current</span>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    </div>,
                    document.body,
                )}
            {canManage && (
                <>
                    <Modal show={editOpen} onClose={() => setEditOpen(false)} maxWidth="xl">
                        <form onSubmit={submitEdit} className="space-y-5 p-6">
                            <div>
                                <div className="text-lg font-semibold">Edit post</div>
                                <p className="app-text-soft mt-2 text-sm leading-6">
                                    Update the copy or change who can see this post.
                                </p>
                            </div>

                            <textarea
                                value={editForm.data.body}
                                onChange={(event) => editForm.setData('body', event.target.value)}
                                className="field min-h-40 resize-none text-sm"
                                placeholder="Write something sharp, useful, or memorable."
                            />

                            {editForm.errors.body && (
                                <div className="text-sm text-rose-300">{editForm.errors.body}</div>
                            )}

                            <div className="flex justify-end gap-3">
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setEditOpen(false)}
                                    className="rounded-full px-4 py-2 text-sm normal-case tracking-normal"
                                >
                                    Cancel
                                </SecondaryButton>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="app-button-primary rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60"
                                >
                                    Save changes
                                </button>
                            </div>
                        </form>
                    </Modal>

                    <Modal show={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="md">
                        <div className="space-y-5 p-6">
                            <div>
                                <div className="text-lg font-semibold">Delete post?</div>
                                <p className="app-text-soft mt-2 text-sm leading-6">
                                    This will remove the post from feeds and your profile timeline.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setDeleteOpen(false)}
                                    className="rounded-full px-4 py-2 text-sm normal-case tracking-normal"
                                >
                                    Cancel
                                </SecondaryButton>
                                <DangerButton
                                    type="button"
                                    onClick={submitDelete}
                                    className="rounded-full px-4 py-2 text-sm normal-case tracking-normal"
                                    disabled={deleteForm.processing}
                                >
                                    Delete post
                                </DangerButton>
                            </div>
                        </div>
                    </Modal>
                </>
            )}
            <Modal
                show={viewerIndex !== null}
                onClose={() => setViewerIndex(null)}
                maxWidth="3xl"
                centered
                panel={false}
            >
                <div className="relative mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center">
                    {currentViewerMedia ? (
                        <>
                            <div className="app-panel-inset relative w-full overflow-hidden rounded-[32px] p-4 sm:p-5">
                                <img
                                    src={currentViewerMedia.url}
                                    alt=""
                                    className="mx-auto max-h-[72vh] w-full rounded-[24px] object-contain"
                                    style={postMediaTransformStyle(currentViewerMedia)}
                                />

                                <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
                                    <div className="app-panel-subtle rounded-full px-3 py-1 text-xs font-medium">
                                        {viewerIndex + 1} / {post.media.length}
                                    </div>
                                </div>
                            </div>

                            {post.media.length > 1 ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={showPreviousMedia}
                                        className="app-button-secondary absolute left-2 inline-flex h-11 w-11 items-center justify-center rounded-full sm:left-4"
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft className="h-5 w-5" strokeWidth={1.9} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={showNextMedia}
                                        className="app-button-secondary absolute right-2 inline-flex h-11 w-11 items-center justify-center rounded-full sm:right-4"
                                        aria-label="Next image"
                                    >
                                        <ChevronRight className="h-5 w-5" strokeWidth={1.9} />
                                    </button>
                                </>
                            ) : null}
                        </>
                    ) : null}
                </div>
            </Modal>
        </>
    );
}

function postMediaTransformStyle(media) {
    const positionX = media.position_x ?? 50;
    const positionY = media.position_y ?? 50;
    const zoom = media.zoom ?? 1;

    return {
        objectPosition: `${positionX}% ${positionY}%`,
        transform: `scale(${zoom})`,
        transformOrigin: `${positionX}% ${positionY}%`,
    };
}
