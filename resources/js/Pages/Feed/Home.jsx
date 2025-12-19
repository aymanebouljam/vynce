import FeedTabs from '@/Components/App/FeedTabs';
import PostCard from '@/Components/App/PostCard';
import PostComposer from '@/Components/App/PostComposer';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, usePage } from '@inertiajs/react';

const trends = [
    { label: 'Design systems', posts: '1,284 posts today' },
    { label: 'Launch notes', posts: '842 posts today' },
    { label: 'Creator workflow', posts: '511 posts today' },
];

const suggestions = [
    { name: 'Layla Stone', username: 'laylastone', tag: 'Shares launch breakdowns' },
    { name: 'Noah Vale', username: 'noahvale', tag: 'Writes product postmortems' },
    { name: 'Kenza Idris', username: 'kenzaidris', tag: 'Posts sharp design critiques' },
];

export default function Home({ feed, activeTab }) {
    const { auth } = usePage().props;

    const sidebar = (
        <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5">
                <div className="text-sm text-slate-400">Your profile</div>
                <div className="mt-3 text-xl font-semibold">{auth.user.name}</div>
                <div className="text-sm text-slate-400">@{auth.user.username}</div>
                <div className="mt-3 text-sm leading-7 text-slate-500">
                    Keep your people close and your updates easy to find.
                </div>
                <Link
                    href={route('users.show', auth.user.username)}
                    className="mt-5 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200"
                >
                    View profile
                </Link>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5">
                <div className="text-sm font-semibold">Trending now</div>
                <div className="mt-4 space-y-4">
                    {trends.map((trend) => (
                        <div key={trend.label}>
                            <div className="text-sm text-slate-100">#{trend.label}</div>
                            <div className="text-xs text-slate-500">{trend.posts}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5">
                <div className="text-sm font-semibold">People to watch</div>
                <div className="mt-4 space-y-4">
                    {suggestions.map((person) => (
                        <div key={person.username} className="rounded-2xl bg-white/5 p-3">
                            <div className="text-sm font-medium">{person.name}</div>
                            <div className="text-xs text-slate-400">@{person.username}</div>
                            <div className="mt-2 text-xs leading-6 text-slate-500">
                                {person.tag}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout title="Feed" sidebar={sidebar}>
            <section className="space-y-6">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold">What your circle is talking about</h1>
                            <p className="mt-2 text-sm leading-7 text-slate-400">
                                Jump between close-follow updates, broader discovery, and the conversations worth replying to tonight.
                            </p>
                        </div>
                        <FeedTabs activeTab={activeTab} />
                    </div>

                    <PostComposer />
                </div>

                <div className="space-y-4">
                    {feed.data.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-950/40 p-8 text-sm text-slate-400">
                            Nothing has landed here yet. Follow a few people, post an update, or switch to Discover to find voices worth bringing into your feed.
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
