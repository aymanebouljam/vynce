import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';

export default function Index({ profile, connections, type, title, emptyState }) {
    return (
        <AuthenticatedLayout title={`${profile.name} ${title}`}>
            <section className="app-panel rounded-[32px] p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="app-text-soft text-sm">
                            <Link href={route('users.show', profile.username)} className="app-link">
                                @{profile.username}
                            </Link>
                        </div>
                        <h1 className="mt-2 text-3xl font-semibold">
                            {profile.name}'s {title.toLowerCase()}
                        </h1>
                        <p className="app-text-soft mt-3 text-sm leading-7">
                            Browse the people connected to this profile.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('users.friends', profile.username)}
                            className={`rounded-full px-4 py-2 text-sm ${
                                type === 'friends' ? 'app-button-primary' : 'app-button-secondary'
                            }`}
                        >
                            Friends
                        </Link>
                        <Link
                            href={route('users.followers', profile.username)}
                            className={`rounded-full px-4 py-2 text-sm ${
                                type === 'followers' ? 'app-button-primary' : 'app-button-secondary'
                            }`}
                        >
                            Followers
                        </Link>
                        <Link
                            href={route('users.following', profile.username)}
                            className={`rounded-full px-4 py-2 text-sm ${
                                type === 'following' ? 'app-button-primary' : 'app-button-secondary'
                            }`}
                        >
                            Following
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mt-6 space-y-4">
                {connections.data.length === 0 ? (
                    <div className="app-dashed-panel app-text-muted rounded-[28px] p-8 text-sm">
                        {emptyState}
                    </div>
                ) : (
                    connections.data.map((person) => (
                        <div key={person.id} className="app-panel rounded-[28px] p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    {person.avatar_url ? (
                                        <img
                                            src={person.avatar_url}
                                            alt={person.name}
                                            className="h-14 w-14 rounded-2xl object-cover"
                                        />
                                    ) : (
                                        <div className="app-avatar-fallback flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-semibold">
                                            {initialsFor(person.name)}
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <div className="truncate text-base font-semibold">
                                            {person.name}
                                        </div>
                                        <div className="app-text-muted truncate text-sm">
                                            @{person.username}
                                        </div>
                                        {person.bio && (
                                            <div className="app-text-soft mt-2 line-clamp-2 text-sm leading-6">
                                                {person.bio}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Link
                                    href={route('users.show', person.username)}
                                    className="app-button-secondary shrink-0 rounded-full px-4 py-2 text-sm"
                                >
                                    View profile
                                </Link>
                            </div>
                        </div>
                    ))
                )}

                {connections.meta.current_page < connections.meta.last_page && (
                    <div>
                        <Link
                            href={route(`users.${type}`, {
                                user: profile.username,
                                page: connections.meta.current_page + 1,
                            })}
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
            .toUpperCase() ?? 'VN'
    );
}
