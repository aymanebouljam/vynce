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
    const initials = auth.user.name
        ?.split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const sidebar = (
        <div className="space-y-4">
            <div className="app-panel rounded-[28px] p-5">
                <div className="flex items-center gap-3">
                    {auth.user.avatar_url ? (
                        <img
                            src={auth.user.avatar_url}
                            alt={auth.user.name}
                            className="h-14 w-14 rounded-2xl object-cover"
                        />
                    ) : (
                        <div className="app-avatar-fallback flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-semibold">
                            {initials}
                        </div>
                    )}

                    <div className="min-w-0">
                        <div className="truncate text-base font-semibold">{auth.user.name}</div>
                        <div className="app-text-muted truncate text-sm">@{auth.user.username}</div>
                    </div>
                </div>

                <Link
                    href={route('users.show', auth.user.username)}
                    className="app-button-secondary mt-4 inline-flex rounded-full px-4 py-2 text-sm"
                >
                    View profile
                </Link>
            </div>

            <div className="app-panel rounded-[28px] p-5">
                <div className="text-sm font-semibold">Trending now</div>
                <div className="mt-4 space-y-4">
                    {trends.map((trend) => (
                        <div key={trend.label}>
                            <div className="text-sm">#{trend.label}</div>
                            <div className="app-text-soft text-xs">{trend.posts}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="app-panel rounded-[28px] p-5">
                <div className="text-sm font-semibold">People to watch</div>
                <div className="mt-4 space-y-4">
                    {suggestions.map((person) => (
                        <div key={person.username} className="app-card-inset rounded-2xl p-3">
                            <div className="text-sm font-medium">{person.name}</div>
                            <div className="app-text-muted text-xs">@{person.username}</div>
                            <div className="app-text-soft mt-2 text-xs leading-6">{person.tag}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout title="Feed" sidebar={sidebar}>
            <section className="space-y-6">
                <PostComposer />

                <div className="space-y-4">
                    {feed.data.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[28px] p-8 text-sm">
                            Nothing has landed here yet. Follow a few people, post an update, or
                            switch to Discover to find voices worth bringing into your feed.
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
                            className="app-button-secondary inline-flex rounded-full px-5 py-3 text-sm"
                        >
                            Load more
                        </Link>
                    </div>
                )}
            </section>
        </AuthenticatedLayout>
    );
}
