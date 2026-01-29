import PostCard from '@/Components/App/PostCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';
import { FileText, Hash, Search, Users } from 'lucide-react';

export default function Index({ query, filter = 'people', users = [], posts = [], topics = [] }) {
    const activeFilter = filter === 'posts' ? 'posts' : 'people';

    return (
        <AuthenticatedLayout title="Search">
            <section className="space-y-6">
                <div className="app-panel rounded-[32px] p-6">
                    <div className="flex items-start gap-3">
                        <div className="app-avatar-fallback flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold">
                            <Search className="h-5 w-5" strokeWidth={1.9} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl font-semibold">Search results</h1>
                            <p className="app-text-soft mt-2 text-sm leading-7">
                                {query
                                    ? `Results for “${query}” across people and posts.`
                                    : 'Search for people, posts, or topics.'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        <Link
                            href={route('feed.search', { q: query, filter: 'people' })}
                            className={`rounded-full px-4 py-2 text-sm ${
                                activeFilter === 'people'
                                    ? 'app-button-primary'
                                    : 'app-button-secondary'
                            }`}
                        >
                            People
                        </Link>
                        <Link
                            href={route('feed.search', { q: query, filter: 'posts' })}
                            className={`rounded-full px-4 py-2 text-sm ${
                                activeFilter === 'posts'
                                    ? 'app-button-primary'
                                    : 'app-button-secondary'
                            }`}
                        >
                            Posts
                        </Link>
                    </div>

                    {topics.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {topics.map((topic) => (
                                <Link
                                    key={topic}
                                    href={route('feed.search', { q: topic, filter: activeFilter })}
                                    className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm"
                                >
                                    <Hash className="h-4 w-4" strokeWidth={1.8} />
                                    {topic}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {!query ? (
                    <div className="app-dashed-panel app-text-muted rounded-[28px] p-8 text-sm">
                        Start with a search term to explore people or posts.
                    </div>
                ) : activeFilter === 'people' ? (
                    users.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[28px] p-8 text-sm">
                            No people match “{query}”.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {users.map((person) => (
                                <Link
                                    key={person.id}
                                    href={route('users.show', person.username)}
                                    className="app-panel flex items-center gap-4 rounded-[28px] p-5 transition hover:bg-[var(--vynce-surface-muted)]"
                                >
                                    {person.avatar_url ? (
                                        <img
                                            src={person.avatar_url}
                                            alt={person.name}
                                            className="h-14 w-14 rounded-2xl object-cover"
                                            style={{
                                                objectPosition: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                transform: `scale(${person.avatar_zoom})`,
                                                transformOrigin: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                            }}
                                        />
                                    ) : (
                                        <div className="app-avatar-fallback flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-semibold">
                                            {initialsFor(person.name)}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <Users className="h-4 w-4" strokeWidth={1.8} />
                                            <span className="truncate">{person.name}</span>
                                        </div>
                                        <div className="app-text-soft mt-1 truncate text-sm">
                                            @{person.username}
                                        </div>
                                        {person.bio && (
                                            <div className="app-text-soft mt-2 line-clamp-2 break-words text-sm leading-6">
                                                {person.bio}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )
                ) : posts.length === 0 ? (
                    <div className="app-dashed-panel app-text-muted rounded-[28px] p-8 text-sm">
                        No posts match “{query}”.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="app-panel rounded-[28px] px-5 py-4 text-sm font-semibold">
                            <div className="inline-flex items-center gap-2">
                                <FileText className="h-4 w-4" strokeWidth={1.8} />
                                Posts
                            </div>
                        </div>
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
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
            .toUpperCase() ?? 'VN'
    );
}
