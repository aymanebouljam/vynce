import PostCard from '@/Components/App/PostCard';
import PostComposer from '@/Components/App/PostComposer';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { UserPlus } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';

const trends = [
    { label: 'Design systems', posts: '1,284 posts today' },
    { label: 'Launch notes', posts: '842 posts today' },
    { label: 'Creator workflow', posts: '511 posts today' },
];

export default function Home({ feed, activeTab, pendingRequests = [], suggestions = [] }) {
    const { auth, flash } = usePage().props;
    const newPostId = flash?.new_post_id;

    const sidebar = (
        <div className="space-y-4">
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
                                <div className="flex items-center gap-3">
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                        {person.avatar_url ? (
                                            <img
                                                src={person.avatar_url}
                                                alt={person.name}
                                                className="h-12 w-12 rounded-2xl object-cover"
                                            />
                                        ) : (
                                            <div className="app-avatar-fallback flex h-12 w-12 items-center justify-center rounded-2xl text-xs font-semibold">
                                                {initialsFor(person.name)}
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium leading-6">
                                                {person.name}
                                            </div>
                                            <div className="app-text-muted mt-0.5 truncate text-xs">
                                                @{person.username}
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={route('users.follow', person.id)}
                                        method="post"
                                        as="button"
                                        className="app-button-primary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                                        aria-label={
                                            person.is_private
                                                ? `Add ${person.name}`
                                                : `Follow ${person.name}`
                                        }
                                    >
                                        <UserPlus className="h-4 w-4" strokeWidth={2} />
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
                <PostComposer compact />

                <div className="space-y-4">
                    {feed.data.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[28px] p-8 text-sm">
                            Nothing has landed here yet. Follow a few people, post an update, or
                            switch to Discover to find voices worth bringing into your feed.
                        </div>
                    ) : (
                        feed.data.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                highlighted={Number(newPostId) === post.id}
                            />
                        ))
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

function initialsFor(name) {
    return (
        name
            ?.split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() ?? 'U'
    );
}
