import { Link } from '@inertiajs/react';

export default function PostCard({ post }) {
    const authorName = post.user?.name ?? 'Unknown user';
    const authorUsername = post.user?.username ?? null;
    const authorHref = authorUsername ? route('users.show', authorUsername) : null;
    const publishedAt = new Date(post.published_at || post.created_at).toLocaleString();
    const initials = authorName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

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

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[rgba(241,235,251,0.9)]">
                            {post.body}
                        </p>

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
                    </div>
                </div>
            </div>
        </article>
    );
}
