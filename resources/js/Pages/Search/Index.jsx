import PostCard from '@/Components/App/PostCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';
import { FileText, Hash, Search, Users } from 'lucide-react';

export default function Index({ query, filter = 'people', users = [], posts = [], topics = [] }) {
    const activeFilter = filter === 'posts' ? 'posts' : 'people';

    return (
        <AuthenticatedLayout title="Search">
            <section className="space-y-5 2xl:space-y-6">
                <div className="app-panel rounded-[28px] p-5 2xl:rounded-[32px] 2xl:p-6">
                    <div className="flex items-start gap-3">
                        <div className="app-avatar-fallback flex h-10 w-10 items-center justify-center rounded-[18px] text-sm font-semibold 2xl:h-12 2xl:w-12 2xl:rounded-2xl">
                            <Search className="h-4 w-4 2xl:h-5 2xl:w-5" strokeWidth={1.9} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-[1.6rem] font-semibold 2xl:text-2xl">
                                Search results
                            </h1>
                            <p className="app-text-soft mt-2 text-[13px] leading-6 2xl:text-sm 2xl:leading-7">
                                {query
                                    ? `Results for “${query}” across people and posts.`
                                    : 'Search for people, posts, or topics.'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 2xl:mt-5">
                        <Link
                            href={route('feed.search', { q: query, filter: 'people' })}
                            className={`rounded-full px-3.5 py-1.5 text-[13px] 2xl:px-4 2xl:py-2 2xl:text-sm ${
                                activeFilter === 'people'
                                    ? 'app-button-primary'
                                    : 'app-button-secondary'
                            }`}
                        >
                            People
                        </Link>
                        <Link
                            href={route('feed.search', { q: query, filter: 'posts' })}
                            className={`rounded-full px-3.5 py-1.5 text-[13px] 2xl:px-4 2xl:py-2 2xl:text-sm ${
                                activeFilter === 'posts'
                                    ? 'app-button-primary'
                                    : 'app-button-secondary'
                            }`}
                        >
                            Posts
                        </Link>
                    </div>

                    {topics.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 2xl:mt-5">
                            {topics.map((topic) => (
                                <Link
                                    key={topic}
                                    href={route('feed.search', { q: topic, filter: activeFilter })}
                                    className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] 2xl:py-2 2xl:text-sm"
                                >
                                    <Hash className="h-4 w-4" strokeWidth={1.8} />
                                    {topic}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {!query ? (
                    <div className="app-dashed-panel app-text-muted rounded-[24px] p-6 text-[13px] 2xl:rounded-[28px] 2xl:p-8 2xl:text-sm">
                        Start with a search term to explore people or posts.
                    </div>
                ) : activeFilter === 'people' ? (
                    users.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[24px] p-6 text-[13px] 2xl:rounded-[28px] 2xl:p-8 2xl:text-sm">
                            No people match “{query}”.
                        </div>
                    ) : (
                        <div className="space-y-3 2xl:space-y-4">
                            {users.map((person) => (
                                <Link
                                    key={person.id}
                                    href={route('users.show', person.username)}
                                    className="app-panel flex items-center gap-3 rounded-[24px] p-4 transition hover:bg-[var(--vynce-surface-muted)] 2xl:gap-4 2xl:rounded-[28px] 2xl:p-5"
                                >
                                    {person.avatar_url ? (
                                        <img
                                            src={person.avatar_url}
                                            alt={person.name}
                                            className="h-11 w-11 rounded-[18px] object-cover 2xl:h-14 2xl:w-14 2xl:rounded-2xl"
                                            style={{
                                                objectPosition: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                transform: `scale(${person.avatar_zoom})`,
                                                transformOrigin: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                            }}
                                        />
                                    ) : (
                                        <div className="app-avatar-fallback flex h-11 w-11 items-center justify-center rounded-[18px] text-[13px] font-semibold 2xl:h-14 2xl:w-14 2xl:rounded-2xl 2xl:text-sm">
                                            {initialsFor(person.name)}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 text-[13px] font-semibold 2xl:text-sm">
                                            <Users className="h-4 w-4" strokeWidth={1.8} />
                                            <span className="truncate">{person.name}</span>
                                        </div>
                                        <div className="app-text-soft mt-1 truncate text-[13px] 2xl:text-sm">
                                            @{person.username}
                                        </div>
                                        {person.bio && (
                                            <div className="app-text-soft mt-2 line-clamp-2 break-words text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                                                {person.bio}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )
                ) : posts.length === 0 ? (
                    <div className="app-dashed-panel app-text-muted rounded-[24px] p-6 text-[13px] 2xl:rounded-[28px] 2xl:p-8 2xl:text-sm">
                        No posts match “{query}”.
                    </div>
                ) : (
                    <div className="space-y-3 2xl:space-y-4">
                        <div className="app-panel rounded-[24px] px-4 py-3 text-[13px] font-semibold 2xl:rounded-[28px] 2xl:px-5 2xl:py-4 2xl:text-sm">
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
