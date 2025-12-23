import { Link } from '@inertiajs/react';

export default function PostCard({ post, canManage = false }) {
    const authorName = post.user?.name ?? 'Unknown user';
    const authorUsername = post.user?.username ?? null;
    const authorHref = authorUsername ? route('users.show', authorUsername) : null;

    return (
        <article className="app-panel-muted overflow-hidden rounded-[28px]">
            <div className="flex items-start justify-between gap-4 p-5">
                <div>
                    {authorHref ? (
                        <Link href={authorHref} className="app-link text-sm font-semibold">
                            {authorName}
                        </Link>
                    ) : (
                        <div className="text-sm font-semibold">{authorName}</div>
                    )}
                    <div className="app-text-muted mt-1 text-xs">
                        {authorUsername ? `@${authorUsername} · ` : ''}
                        {new Date(post.published_at || post.created_at).toLocaleString()}
                    </div>
                </div>

                <span className="app-pill rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em]">
                    {post.visibility}
                </span>
            </div>

            <div className="space-y-4 px-5 pb-5">
                <p className="whitespace-pre-wrap text-sm leading-7">{post.body}</p>

                {post.media?.length > 0 && (
                    <div className="grid gap-3 md:grid-cols-2">
                        {post.media.map((media) => (
                            <img
                                key={media.id}
                                src={media.url}
                                alt=""
                                className="h-72 w-full rounded-3xl object-cover"
                            />
                        ))}
                    </div>
                )}

                {(post.hashtags?.length > 0 || post.mentions?.length > 0) && (
                    <div className="flex flex-wrap gap-2 text-xs">
                        {post.hashtags?.map((tag) => (
                            <span key={tag} className="app-chip rounded-full px-3 py-1">
                                #{tag}
                            </span>
                        ))}
                        {post.mentions?.map((mention) => (
                            <span key={mention} className="app-pill-muted rounded-full px-3 py-1">
                                @{mention}
                            </span>
                        ))}
                    </div>
                )}

                {canManage && (
                    <div className="app-text-muted text-xs">
                        Owner controls are wired on the backend and ready for a fuller inline
                        composer pass.
                    </div>
                )}
            </div>
        </article>
    );
}
