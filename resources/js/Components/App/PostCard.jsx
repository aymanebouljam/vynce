import { Heart, MessageCircle, Repeat2, SendHorizontal } from 'lucide-react';
import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function PostCard({ post, profileUsername = null, showProfileRepostLabel = true }) {
    const authorName = post.user?.name ?? 'Unknown user';
    const authorUsername = post.user?.username ?? null;
    const authorHref = authorUsername ? route('users.show', authorUsername) : null;
    const publishedAt = new Date(post.published_at || post.created_at).toLocaleString();
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [liking, setLiking] = useState(false);
    const commentForm = useForm({ body: '' });
    const initials = authorName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const isProfileRepost =
        Boolean(post.profile_reposted_at) &&
        showProfileRepostLabel &&
        profileUsername &&
        authorUsername &&
        authorUsername !== profileUsername;

    useEffect(() => {
        setIsLiked(post.is_liked);
        setLikesCount(post.likes_count ?? 0);
    }, [post.id, post.is_liked, post.likes_count]);

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

    return (
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
                                Reposted by @{profileUsername}
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

                            <span className="feed-post-card__visibility">{post.visibility}</span>
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
                                    isLiked ? 'border-rose-400/30 bg-rose-500/15 text-rose-200' : ''
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
                                <form onSubmit={submitComment} className="flex items-start gap-3">
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
    );
}
