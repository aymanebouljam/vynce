import FeedTabs from '@/Components/App/FeedTabs';
import PostCard from '@/Components/App/PostCard';
import PostComposer from '@/Components/App/PostComposer';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, usePage } from '@inertiajs/react';

export default function Home({ feed, activeTab }) {
    const { auth } = usePage().props;

    const sidebar = (
        <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5">
                <div className="text-sm text-slate-400">Profile snapshot</div>
                <div className="mt-3 text-xl font-semibold">{auth.user.name}</div>
                <div className="text-sm text-slate-400">@{auth.user.username}</div>
                <Link
                    href={route('users.show', auth.user.username)}
                    className="mt-5 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200"
                >
                    View public profile
                </Link>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout title="Feed" sidebar={sidebar}>
            <section className="space-y-6">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold">Your feed</h1>
                            <p className="mt-2 text-sm leading-7 text-slate-400">
                                Move between network-driven and discovery-driven timelines without losing context.
                            </p>
                        </div>
                        <FeedTabs activeTab={activeTab} />
                    </div>

                    <PostComposer />
                </div>

                <div className="space-y-4">
                    {feed.data.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-950/40 p-8 text-sm text-slate-400">
                            Your feed is quiet. Follow a few people or publish your first post to start shaping it.
                        </div>
                    ) : (
                        feed.data.map((post) => <PostCard key={post.id} post={post} />)
                    )}
                </div>

                {feed.meta.current_page < feed.meta.last_page && (
                    <div>
                        <Link
                            href={route(
                                activeTab === 'following'
                                    ? 'feed.following'
                                    : activeTab === 'discover'
                                      ? 'feed.discover'
                                      : 'feed.home',
                                { page: feed.meta.current_page + 1 },
                            )}
                            className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm text-slate-200"
                        >
                            Load more
                        </Link>
                    </div>
                )}
            </section>
        </AuthenticatedLayout>
    );
}
