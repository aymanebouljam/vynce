import { Link, useForm, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    CornerDownRight,
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
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';

export default function PostCard({
    post,
    profileUsername = null,
    showProfileRepostLabel = true,
    profileRepostLabel = null,
    highlighted = false,
    openCommentsByDefault = false,
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
    const [isReposted, setIsReposted] = useState(post.is_reposted);
    const [repostsCount, setRepostsCount] = useState(post.reposts_count ?? 0);
    const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0);
    const [localComments, setLocalComments] = useState(post.comments ?? []);
    const [liking, setLiking] = useState(false);
    const [reposting, setReposting] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [visibilityMenuOpen, setVisibilityMenuOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(null);
    const [selectedVisibility, setSelectedVisibility] = useState(post.visibility);
    const [isVisibilitySaving, setIsVisibilitySaving] = useState(false);
    const [replyTarget, setReplyTarget] = useState(null);
    const menuButtonRef = useRef(null);
    const menuPanelRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const visibilityButtonRef = useRef(null);
    const visibilityPanelRef = useRef(null);
    const [visibilityMenuPosition, setVisibilityMenuPosition] = useState({ top: 0, left: 0 });
    const commentForm = useForm({
        body: '',
        parent_id: null,
    });
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
        setIsReposted(post.is_reposted);
        setRepostsCount(post.reposts_count ?? 0);
        setCommentsCount(post.comments_count ?? 0);
    }, [post.id, post.is_reposted, post.reposts_count, post.comments_count]);

    useEffect(() => {
        setSelectedVisibility(post.visibility);
    }, [post.id, post.visibility]);

    useEffect(() => {
        setLocalComments(post.comments ?? []);
    }, [post.id, post.comments]);

    useEffect(() => {
        setViewerIndex(null);
    }, [post.id]);

    useEffect(() => {
        setCommentsOpen(openCommentsByDefault);
    }, [openCommentsByDefault, post.id]);

    useEffect(() => {
        setReplyTarget(null);
        commentForm.setData('parent_id', null);
    }, [post.id]);

    useEffect(() => {
        if (!highlighted || typeof document === 'undefined') {
            return;
        }

        const element = document.getElementById(`post-${post.id}`);

        if (!element) {
            return;
        }

        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    }, [highlighted, post.id]);

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
                setReplyTarget(null);
                setCommentsOpen(true);
                setCommentsCount((count) => count + 1);
            },
        });
    };

    const startReply = (comment) => {
        setReplyTarget({
            id: comment.id,
            name: comment.user?.name ?? 'Unknown user',
            username: comment.user?.username ?? null,
        });
        commentForm.setData('parent_id', comment.id);
        setCommentsOpen(true);
    };

    const cancelReply = () => {
        setReplyTarget(null);
        commentForm.setData('parent_id', null);
    };

    const toggleCommentLove = async (comment) => {
        const previousComments = localComments;

        setLocalComments((current) =>
            updateCommentTree(current, comment.id, (item) => ({
                ...item,
                is_liked: !item.is_liked,
                likes_count: Math.max(0, (item.likes_count ?? 0) + (item.is_liked ? -1 : 1)),
            })),
        );

        try {
            const { data } = await window.axios.post(
                route('posts.comments.likes.toggle', [post.id, comment.id]),
                null,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            setLocalComments((current) =>
                updateCommentTree(current, comment.id, (item) => ({
                    ...item,
                    is_liked: data.liked,
                    likes_count: data.likes_count,
                })),
            );
        } catch {
            setLocalComments(previousComments);
        }
    };

    const editComment = async (commentId, body) => {
        const nextBody = body.trim();

        if (!nextBody) {
            return;
        }

        const previousComments = localComments;

        setLocalComments((current) =>
            updateCommentTree(current, commentId, (item) => ({
                ...item,
                body: nextBody,
            })),
        );

        try {
            await window.axios.patch(
                route('posts.comments.update', [post.id, commentId]),
                { body: nextBody },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );
        } catch {
            setLocalComments(previousComments);
        }
    };

    const deleteComment = async (comment) => {
        if (!window.confirm('Delete this comment?')) {
            return;
        }

        const previousComments = localComments;
        const previousCount = commentsCount;
        const { nextComments, removedCount } = removeCommentBranch(previousComments, comment.id);

        setLocalComments(nextComments);
        setCommentsCount((count) => Math.max(0, count - removedCount));

        try {
            await window.axios.delete(route('posts.comments.destroy', [post.id, comment.id]), {
                headers: {
                    Accept: 'application/json',
                },
            });
        } catch {
            setLocalComments(previousComments);
            setCommentsCount(previousCount);
        }
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

    const toggleRepost = async () => {
        if (reposting) {
            return;
        }

        const previousReposted = isReposted;
        const previousCount = repostsCount;
        const nextReposted = !previousReposted;

        setReposting(true);
        setIsReposted(nextReposted);
        setRepostsCount((count) => Math.max(0, count + (nextReposted ? 1 : -1)));

        try {
            const response = await window.axios.post(route('posts.reposts.toggle', post.id), null, {
                headers: {
                    Accept: 'application/json',
                },
            });

            setIsReposted(response.data.reposted);
            setRepostsCount(response.data.reposts_count);
        } catch {
            setIsReposted(previousReposted);
            setRepostsCount(previousCount);
        } finally {
            setReposting(false);
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
                id={`post-${post.id}`}
                className={`feed-post-card ${highlighted ? 'feed-post-card--highlighted' : ''}`}
            >
                <div className="feed-post-card__inner">
                    <div className="flex items-start gap-2.5">
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
                                <div className="app-text-soft mb-2.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em]">
                                    <Repeat2 className="h-3.5 w-3.5" strokeWidth={1.9} />
                                    {profileRepostLabel ?? `Reposted by @${profileUsername}`}
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    {authorHref ? (
                                        <Link
                                            href={authorHref}
                                            className="app-link text-[13px] font-semibold"
                                        >
                                            {authorName}
                                        </Link>
                                    ) : (
                                        <div className="text-[13px] font-semibold">
                                            {authorName}
                                        </div>
                                    )}
                                    <div className="app-text-muted mt-0.5 text-[11px]">
                                        {authorUsername ? `@${authorUsername} · ` : ''}
                                        {publishedAt}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
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
                                                className="app-button-secondary inline-flex h-8 w-8 items-center justify-center rounded-full"
                                                aria-label="Post options"
                                            >
                                                <Ellipsis className="h-4 w-4" strokeWidth={1.9} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {post.body ? (
                                <p className="mt-3 whitespace-pre-wrap break-words text-[13px] leading-6 text-[rgba(241,235,251,0.9)]">
                                    {post.body}
                                </p>
                            ) : null}

                            {post.media?.length > 0 && (
                                <div
                                    className={`mt-3 grid gap-2.5 ${
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
                                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                                    {post.hashtags?.map((tag) => (
                                        <span
                                            key={tag}
                                            className="app-chip rounded-full px-2.5 py-1"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                    {post.mentions?.map((mention) => (
                                        <span
                                            key={mention}
                                            className="app-pill-muted rounded-full px-2.5 py-1"
                                        >
                                            @{mention}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={toggleLike}
                                    className={`app-button-secondary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] ${
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
                                    className={`app-button-secondary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] ${
                                        commentsOpen ? 'app-nav-link-active' : ''
                                    }`}
                                >
                                    <MessageCircle className="h-4 w-4" strokeWidth={1.9} />
                                    {commentsCount}
                                </button>

                                <button
                                    type="button"
                                    onClick={toggleRepost}
                                    className={`app-button-secondary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] ${
                                        isReposted ? 'app-nav-link-active' : ''
                                    } ${reposting ? 'opacity-70' : ''}`}
                                >
                                    <Repeat2 className="h-4 w-4" strokeWidth={1.9} />
                                    {repostsCount}
                                </button>
                            </div>

                            {commentsOpen && (
                                <div className="app-panel-inset mt-4 space-y-4 rounded-[24px] p-4">
                                    <form onSubmit={submitComment} className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[rgba(241,235,251,0.6)]">
                                                Reply
                                            </div>
                                            {replyTarget ? (
                                                <button
                                                    type="button"
                                                    onClick={cancelReply}
                                                    className="app-text-soft text-xs font-medium hover:text-[rgba(241,235,251,0.95)]"
                                                >
                                                    Cancel reply
                                                </button>
                                            ) : null}
                                        </div>

                                        {replyTarget ? (
                                            <div className="app-card-inset flex items-center gap-2 rounded-2xl px-3 py-2 text-sm">
                                                <CornerDownRight className="h-4 w-4 text-[rgba(241,235,251,0.65)]" />
                                                <span className="font-medium">
                                                    Replying to {replyTarget.name}
                                                </span>
                                                {replyTarget.username ? (
                                                    <span className="app-text-muted text-xs">
                                                        @{replyTarget.username}
                                                    </span>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        <div className="flex items-start gap-3">
                                            <textarea
                                                value={commentForm.data.body}
                                                onChange={(event) =>
                                                    commentForm.setData('body', event.target.value)
                                                }
                                                className="field min-h-20 flex-1 resize-none text-sm"
                                                placeholder={
                                                    replyTarget
                                                        ? `Reply to ${replyTarget.name}...`
                                                        : 'Write a reply...'
                                                }
                                            />
                                            <button
                                                type="submit"
                                                disabled={commentForm.processing}
                                                className="app-button-primary inline-flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-60"
                                            >
                                                <SendHorizontal
                                                    className="h-4 w-4"
                                                    strokeWidth={1.9}
                                                />
                                            </button>
                                        </div>
                                    </form>

                                    {commentForm.errors.body && (
                                        <div className="text-sm text-rose-300">
                                            {commentForm.errors.body}
                                        </div>
                                    )}

                                    {localComments?.length > 0 ? (
                                        <div className="space-y-3">
                                            {renderCommentThreads(localComments, {
                                                onReply: startReply,
                                                onToggleLove: toggleCommentLove,
                                                onEdit: editComment,
                                                onDelete: deleteComment,
                                                currentUserId: auth?.user?.id ?? null,
                                            })}
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
                            <div className="relative w-full overflow-hidden rounded-[32px] bg-[rgba(8,12,20,0.94)] p-4 sm:p-5">
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

function formatRelativeTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const diffMs = Date.now() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) {
        return `${Math.max(1, diffSeconds)}s`;
    }

    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffMinutes < 60) {
        return `${diffMinutes}m`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
        return `${diffHours}h`;
    }

    const diffDays = Math.floor(diffHours / 24);

    if (diffDays < 30) {
        return `${diffDays}d`;
    }

    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths < 12) {
        return `${diffMonths}M`;
    }

    const diffYears = Math.floor(diffMonths / 12);

    return `${diffYears}y`;
}

function renderCommentThreads(threads, handlers, depth = 0) {
    const comments = Array.isArray(threads) ? threads : [];

    return comments.map((comment) => (
        <CommentThread key={comment.id} comment={comment} handlers={handlers} depth={depth} />
    ));
}

function CommentThread({ comment, handlers, depth = 0 }) {
    const indentClass = depth > 0 ? 'ml-5 border-l border-white/10 pl-4' : '';
    const createdAt = comment.created_at ? formatRelativeTime(comment.created_at) : null;
    const replies = comment.replies ?? [];
    const avatarFallback = comment.user?.name
        ?.split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const canManage = handlers.currentUserId && handlers.currentUserId === comment.user?.id;
    const [isEditing, setIsEditing] = useState(false);
    const [draftBody, setDraftBody] = useState(comment.body ?? '');

    useEffect(() => {
        setDraftBody(comment.body ?? '');
    }, [comment.body]);

    return (
        <div className={`${indentClass} space-y-3`}>
            <div className="flex items-start gap-3">
                <div className="shrink-0">
                    {comment.user?.avatar_url ? (
                        <img
                            src={comment.user.avatar_url}
                            alt={comment.user?.name ?? 'Unknown user'}
                            className="h-9 w-9 rounded-2xl object-cover"
                            style={{
                                objectPosition: `${comment.user.avatar_position_x}% ${comment.user.avatar_position_y}%`,
                                transform: `scale(${comment.user.avatar_zoom})`,
                                transformOrigin: `${comment.user.avatar_position_x}% ${comment.user.avatar_position_y}%`,
                            }}
                        />
                    ) : (
                        <div className="app-avatar-fallback flex h-9 w-9 items-center justify-center rounded-2xl text-[11px] font-semibold">
                            {avatarFallback ?? 'US'}
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="app-panel-muted rounded-2xl px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <span className="font-semibold">
                                        {comment.user?.name ?? 'Unknown user'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="mt-3 space-y-3">
                                <textarea
                                    value={draftBody}
                                    onChange={(event) => setDraftBody(event.target.value)}
                                    className="field min-h-24 resize-none text-sm"
                                />

                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDraftBody(comment.body ?? '');
                                            setIsEditing(false);
                                        }}
                                        className="app-button-secondary rounded-full px-3 py-1.5 text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await handlers.onEdit(comment.id, draftBody);
                                            setIsEditing(false);
                                        }}
                                        className="app-button-primary rounded-full px-3 py-1.5 text-xs"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                                {comment.body}
                            </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handlers.onToggleLove(comment)}
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                                    comment.is_liked
                                        ? 'border border-rose-400/30 bg-rose-500/15 text-rose-100'
                                        : 'app-button-secondary'
                                }`}
                            >
                                <Heart
                                    className={`h-3.5 w-3.5 ${comment.is_liked ? 'fill-current text-rose-400' : ''}`}
                                    strokeWidth={1.9}
                                />
                                {comment.likes_count ?? 0}
                            </button>

                            <button
                                type="button"
                                onClick={() => handlers.onReply(comment)}
                                className="app-button-secondary rounded-full px-3 py-1 text-xs font-medium"
                            >
                                Reply
                            </button>

                            {canManage ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="app-button-secondary rounded-full px-3 py-1 text-xs font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlers.onDelete(comment)}
                                        className="app-button-secondary rounded-full px-3 py-1 text-xs font-medium text-rose-200"
                                    >
                                        Delete
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>

                    {createdAt ? (
                        <div className="app-text-muted mt-2 px-1 text-[11px]">{createdAt}</div>
                    ) : null}
                </div>
            </div>

            {replies.length > 0 ? renderCommentThreads(replies, handlers, depth + 1) : null}
        </div>
    );
}

function updateCommentTree(comments, commentId, updater) {
    return comments.map((comment) => {
        if (comment.id === commentId) {
            return updater(comment);
        }

        if (!comment.replies?.length) {
            return comment;
        }

        return {
            ...comment,
            replies: updateCommentTree(comment.replies, commentId, updater),
        };
    });
}

function removeCommentBranch(comments, commentId) {
    let removedCount = 0;

    const nextComments = comments.flatMap((comment) => {
        if (comment.id === commentId) {
            removedCount += countCommentBranch(comment);
            return [];
        }

        if (!comment.replies?.length) {
            return [comment];
        }

        const result = removeCommentBranch(comment.replies, commentId);
        removedCount += result.removedCount;

        if (result.removedCount === 0) {
            return [comment];
        }

        return [
            {
                ...comment,
                replies: result.nextComments,
            },
        ];
    });

    return {
        nextComments,
        removedCount,
    };
}

function countCommentBranch(comment) {
    return (
        1 + (comment.replies ?? []).reduce((count, reply) => count + countCommentBranch(reply), 0)
    );
}
