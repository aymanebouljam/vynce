import PostCard from '@/Components/App/PostCard';
import PostComposer from '@/Components/App/PostComposer';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, usePage } from '@inertiajs/react';

const trends = [
    { label: 'Design systems', posts: '1,284 posts today' },
    { label: 'Launch notes', posts: '842 posts today' },
    { label: 'Creator workflow', posts: '511 posts today' },
];

export default function Home({ feed, activeTab, pendingRequests = [], suggestions = [] }) {
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
                        <div className="h-14 w-14 overflow-hidden rounded-2xl">
                            <img
                                src={auth.user.avatar_url}
                                alt={auth.user.name}
                                className="h-full w-full object-cover"
                                style={{
                                    objectPosition: `${auth.user.avatar_position_x}% ${auth.user.avatar_position_y}%`,
                                    transform: `scale(${auth.user.avatar_zoom})`,
                                    transformOrigin: `${auth.user.avatar_position_x}% ${auth.user.avatar_position_y}%`,
                                }}
                            />
                        </div>
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

            {pendingRequests.length > 0 && (
                <div className="app-panel rounded-[28px] p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">Invitations</div>
                        <div className="app-text-soft text-xs">
                            {pendingRequests.length} pending
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {pendingRequests.map((person) => (
                            <div key={person.id} className="app-card-inset rounded-2xl p-3">
                                <div className="text-sm font-medium">{person.name}</div>
                                <div className="app-text-muted text-xs">@{person.username}</div>
                                <div className="mt-3 flex gap-2">
                                    <Link
                                        href={route('users.follow-requests.accept', person.id)}
                                        method="post"
                                        as="button"
                                        className="app-button-primary rounded-full px-3 py-2 text-xs font-semibold"
                                    >
                                        Accept
                                    </Link>
                                    <Link
                                        href={route('users.follow-requests.reject', person.id)}
                                        method="delete"
                                        as="button"
                                        className="app-button-secondary rounded-full px-3 py-2 text-xs"
                                    >
                                        Refuse
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="app-panel rounded-[28px] p-5">
                <div className="text-sm font-semibold">Add people</div>
                <div className="mt-4 space-y-4">
                    {suggestions.length === 0 ? (
                        <div className="app-text-soft text-sm leading-6">
                            You’re caught up for now. As more people join your orbit, they’ll show
                            up here.
                        </div>
                    ) : (
                        suggestions.map((person) => (
                            <div key={person.id} className="app-card-inset rounded-2xl p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">
                                            {person.name}
                                        </div>
                                        <div className="app-text-muted truncate text-xs">
                                            @{person.username}
                                        </div>
                                        <div className="app-text-soft mt-2 text-xs leading-6">
                                            {person.bio || 'See what they’re sharing on Vynce.'}
                                        </div>
                                    </div>
                                    <Link
                                        href={route('users.follow', person.id)}
                                        method="post"
                                        as="button"
                                        className="app-button-primary shrink-0 rounded-full px-3 py-2 text-xs font-semibold"
                                    >
                                        {person.is_private ? 'Add' : 'Follow'}
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
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
