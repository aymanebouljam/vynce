import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import {
    Ellipsis,
    Heart,
    MessageCircle,
    Pencil,
    Repeat2,
    SendHorizontal,
    Trash2,
} from 'lucide-react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function PostCard({
    post,
    profileUsername = null,
    showProfileRepostLabel = true,
    profileRepostLabel = null,
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
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const menuRef = useRef(null);
    const commentForm = useForm({ body: '' });
    const editForm = useForm({
        body: post.body ?? '',
        visibility: post.visibility,
    });
    const deleteForm = useForm({});
    const initials = authorName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const isProfileRepost =
        Boolean(post.profile_reposted_at) && showProfileRepostLabel && profileUsername;

    useEffect(() => {
        setIsLiked(post.is_liked);
        setLikesCount(post.likes_count ?? 0);
    }, [post.id, post.is_liked, post.likes_count]);

    useEffect(() => {
        editForm.setData({
            body: post.body ?? '',
            visibility: post.visibility,
        });
    }, [post.id, post.body, post.visibility]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!menuRef.current?.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
        } catch (error) {
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

    const updateVisibility = (visibility) => {
        if (editForm.processing || editForm.data.visibility === visibility) {
            return;
        }

        editForm
            .transform((data) => ({
                ...data,
                visibility,
            }))
            .patch(route('posts.update', post.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setMenuOpen(false);
                },
                onFinish: () => {
                    editForm.transform((data) => data);
                },
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

    return (
        <>
            <article className="feed-post-card">
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
                                    <span className="feed-post-card__visibility">
                                        {post.visibility}
                                    </span>
                                    {canManage && (
                                        <div ref={menuRef} className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setMenuOpen((open) => !open)}
                                                className="app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
                                                aria-label="Post options"
                                            >
                                                <Ellipsis className="h-4 w-4" strokeWidth={1.9} />
                                            </button>

                                            {menuOpen && (
                                                <div className="app-panel-inset absolute right-0 top-[calc(100%+0.5rem)] z-20 w-44 rounded-2xl p-2 shadow-[var(--vynce-shadow-md)]">
                                                    <div className="app-text-muted px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.18em]">
                                                        Visibility
                                                    </div>
                                                    {['public', 'followers'].map((option) => (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={() => updateVisibility(option)}
                                                            className={`app-nav-link flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                                                                post.visibility === option
                                                                    ? 'app-nav-link-active'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <span>
                                                                {option.charAt(0).toUpperCase() +
                                                                    option.slice(1)}
                                                            </span>
                                                            {post.visibility === option ? (
                                                                <span className="app-text-soft text-xs">
                                                                    Current
                                                                </span>
                                                            ) : null}
                                                        </button>
                                                    ))}
                                                    <div className="my-2 h-px bg-white/10" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditOpen(true);
                                                            setMenuOpen(false);
                                                        }}
                                                        className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm"
                                                    >
                                                        <Pencil
                                                            className="h-4 w-4"
                                                            strokeWidth={1.9}
                                                        />
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
                                                        <Trash2
                                                            className="h-4 w-4"
                                                            strokeWidth={1.9}
                                                        />
                                                        Delete post
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {post.body ? (
                                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[rgba(241,235,251,0.9)]">
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
                                        <div key={media.id} className="feed-post-card__media">
                                            <img
                                                src={media.url}
                                                alt=""
                                                className="feed-post-card__media-image"
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
                                            className="app-button-primary inline-flex h-11 w-11 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-60"
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
                                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
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

                            <div className="space-y-3">
                                <div className="app-text-muted text-xs font-medium uppercase tracking-[0.18em]">
                                    Visibility
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['public', 'followers'].map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => editForm.setData('visibility', option)}
                                            className={`app-button-secondary rounded-full px-4 py-2 text-sm ${
                                                editForm.data.visibility === option
                                                    ? 'app-nav-link-active'
                                                    : ''
                                            }`}
                                        >
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

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
                                    className="app-button-primary rounded-full px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
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
        </>
    );
}
