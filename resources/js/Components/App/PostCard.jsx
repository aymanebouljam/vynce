import { Link } from '@inertiajs/react';

export default function PostCard({ post, canManage = false }) {
    return (
        <article className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/60 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4 p-5">
                <div>
                    <Link
                        href={route('users.show', post.user.username)}
                        className="text-sm font-semibold text-white"
                    >
                        {post.user.name}
                    </Link>
                    <div className="mt-1 text-xs text-slate-400">
                        @{post.user.username} ·{' '}
                        {new Date(post.published_at || post.created_at).toLocaleString()}
                    </div>
                </div>

                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                    {post.visibility}
                </span>
            </div>

            <div className="space-y-4 px-5 pb-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-100">
                    {post.body}
                </p>

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
                            <span
                                key={tag}
                                className="rounded-full bg-[#ff6a3d]/15 px-3 py-1 text-[#ffb39a]"
                            >
                                #{tag}
                            </span>
                        ))}
                        {post.mentions?.map((mention) => (
                            <span
                                key={mention}
                                className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-200"
                            >
                                @{mention}
                            </span>
                        ))}
                    </div>
                )}

                {canManage && (
                    <div className="text-xs text-slate-400">
                        Owner controls are wired on the backend and ready for a fuller inline composer pass.
                    </div>
                )}
            </div>
        </article>
    );
}
