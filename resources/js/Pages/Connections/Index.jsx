import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({
    profile,
    connections,
    type,
    title,
    emptyState,
    routeName,
    routeParams = {},
    search = '',
}) {
    const { auth } = usePage().props;
    const isOwnProfile = auth.user.username === profile.username;
    const canUnfollow = type === 'following' && auth.user.username === profile.username;
    const descriptionByType = {
        friends: isOwnProfile
            ? 'Browse the people you are friends with.'
            : 'Browse the people this profile is friends with.',
        followers: isOwnProfile
            ? 'Browse the people following your profile.'
            : 'Browse the people following this profile.',
        following: isOwnProfile
            ? 'Browse the people your profile follows.'
            : 'Browse the people this profile follows.',
    };
    const [sourceConnections, setSourceConnections] = useState(connections.data);
    const [filteredConnections, setFilteredConnections] = useState(connections.data);
    const [connectionsMeta, setConnectionsMeta] = useState(connections.meta);
    const [personToUnfollow, setPersonToUnfollow] = useState(null);
    const [isUnfollowing, setIsUnfollowing] = useState(false);
    const [personToUnfriend, setPersonToUnfriend] = useState(null);
    const [isUnfriending, setIsUnfriending] = useState(false);
    const [searchTerm, setSearchTerm] = useState(search);
    const [activeSearch, setActiveSearch] = useState(search);
    const [searchOpen, setSearchOpen] = useState(Boolean(search));
    const searchRequestIdRef = useRef(0);

    useEffect(() => {
        setSourceConnections(connections.data);
        setFilteredConnections(connections.data);
        setConnectionsMeta(connections.meta);
        setActiveSearch(search);
    }, [connections.data, connections.meta, search]);

    useEffect(() => {
        setSearchTerm(search);
        if (search) {
            setSearchOpen(true);
        }
    }, [search]);

    useEffect(() => {
        if (searchTerm === activeSearch) {
            return;
        }

        const normalizedTerm = searchTerm.trim().toLowerCase();
        setFilteredConnections(
            normalizedTerm
                ? sourceConnections.filter(
                      (connection) =>
                          connection.name?.toLowerCase().includes(normalizedTerm) ||
                          connection.username?.toLowerCase().includes(normalizedTerm),
                  )
                : sourceConnections,
        );

        const timeoutId = window.setTimeout(() => {
            const requestId = ++searchRequestIdRef.current;

            window.axios
                .get(route(routeName, routeParams), {
                    params: searchTerm ? { search: searchTerm } : {},
                    headers: {
                        Accept: 'application/json',
                    },
                })
                .then(({ data }) => {
                    if (requestId !== searchRequestIdRef.current) {
                        return;
                    }

                    setSourceConnections(data.connections.data);
                    setFilteredConnections(data.connections.data);
                    setConnectionsMeta(data.connections.meta);
                    setActiveSearch(data.search ?? '');
                })
                .catch(() => {
                    if (requestId !== searchRequestIdRef.current) {
                        return;
                    }

                    setFilteredConnections(sourceConnections);
                    setSearchTerm(activeSearch);
                });
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [activeSearch, routeName, routeParams, searchTerm, sourceConnections]);

    const routeWithQuery = (params = {}) =>
        route(routeName, {
            ...routeParams,
            ...(activeSearch ? { search: activeSearch } : {}),
            ...params,
        });
    const friendsRoute = route('users.friends', {
        user: profile.username,
        ...(activeSearch ? { search: activeSearch } : {}),
    });

    const goBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        router.visit(route('feed.home'));
    };

    const closeUnfollowModal = () => {
        if (isUnfollowing) {
            return;
        }

        setPersonToUnfollow(null);
    };

    const closeUnfriendModal = () => {
        if (isUnfriending) {
            return;
        }

        setPersonToUnfriend(null);
    };

    const confirmUnfollow = () => {
        if (!personToUnfollow) {
            return;
        }

        const person = personToUnfollow;
        const previousSourceConnections = sourceConnections;
        const previousFilteredConnections = filteredConnections;

        setIsUnfollowing(true);
        setSourceConnections((current) =>
            current.filter((connection) => connection.id !== person.id),
        );
        setFilteredConnections((current) =>
            current.filter((connection) => connection.id !== person.id),
        );
        setPersonToUnfollow(null);

        window.axios
            .delete(route('users.unfollow', person.id), {
                headers: {
                    Accept: 'application/json',
                },
            })
            .catch(() => {
                setSourceConnections(previousSourceConnections);
                setFilteredConnections(previousFilteredConnections);
            })
            .finally(() => {
                setIsUnfollowing(false);
            });
    };

    const confirmUnfriend = () => {
        if (!personToUnfriend) {
            return;
        }

        const person = personToUnfriend;
        const previousSourceConnections = sourceConnections;
        const previousFilteredConnections = filteredConnections;

        setIsUnfriending(true);
        setSourceConnections((current) =>
            current.filter((connection) => connection.id !== person.id),
        );
        setFilteredConnections((current) =>
            current.filter((connection) => connection.id !== person.id),
        );
        setPersonToUnfriend(null);

        window.axios
            .delete(route('users.friend-requests.destroy', person.id), {
                headers: {
                    Accept: 'application/json',
                },
            })
            .catch(() => {
                setSourceConnections(previousSourceConnections);
                setFilteredConnections(previousFilteredConnections);
            })
            .finally(() => {
                setIsUnfriending(false);
            });
    };

    return (
        <AuthenticatedLayout title={isOwnProfile ? `Your ${title}` : `${profile.name} ${title}`}>
            <section className="app-panel rounded-[28px] p-5 2xl:rounded-[32px] 2xl:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <button
                            type="button"
                            onClick={goBack}
                            className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] 2xl:px-4 2xl:text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
                            Back
                        </button>
                        {!isOwnProfile && (
                            <div className="app-text-soft mt-3 text-[13px] 2xl:mt-4 2xl:text-sm">
                                <Link
                                    href={route('users.show', profile.username)}
                                    className="app-link"
                                >
                                    @{profile.username}
                                </Link>
                            </div>
                        )}
                        <h1 className="mt-2 text-[1.8rem] font-semibold 2xl:text-3xl">
                            {isOwnProfile
                                ? `Your ${title.toLowerCase()}`
                                : `${profile.name}'s ${title.toLowerCase()}`}
                        </h1>
                        <p className="app-text-soft mt-2 text-[13px] leading-6 2xl:mt-3 2xl:text-sm 2xl:leading-7">
                            {descriptionByType[type] ??
                                'Browse the people connected to this profile.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {searchOpen ? (
                            <label className="app-panel-inset flex w-[10rem] items-center gap-2.5 rounded-full px-3.5 py-2 transition-all duration-300 ease-out md:w-[12rem] 2xl:w-[13rem] 2xl:gap-3 2xl:px-4">
                                <Search
                                    className="app-text-muted h-4 w-4 shrink-0"
                                    strokeWidth={1.8}
                                />
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onBlur={() => {
                                        if (!searchTerm) {
                                            setSearchOpen(false);
                                        }
                                    }}
                                    placeholder={`Search ${title.toLowerCase()}`}
                                    className="w-full appearance-none border-0 bg-transparent text-[13px] opacity-100 shadow-none outline-none ring-0 transition-all duration-300 ease-out focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 2xl:text-sm"
                                    style={{ WebkitAppearance: 'none', boxShadow: 'none' }}
                                    autoFocus
                                />
                            </label>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setSearchOpen(true)}
                                className="app-button-secondary h-8.5 w-8.5 inline-flex items-center justify-center rounded-full transition-all duration-300 ease-out 2xl:h-9 2xl:w-9"
                                aria-label={`Search ${title.toLowerCase()}`}
                            >
                                <Search className="h-4 w-4" strokeWidth={1.8} />
                            </button>
                        )}
                        <Link
                            href={friendsRoute}
                            className={`rounded-full px-3.5 py-1.5 text-[13px] 2xl:px-4 2xl:py-2 2xl:text-sm ${
                                type === 'friends' ? 'app-button-primary' : 'app-button-secondary'
                            }`}
                        >
                            Friends
                        </Link>
                        <Link
                            href={route('users.followers', {
                                user: profile.username,
                                ...(activeSearch ? { search: activeSearch } : {}),
                            })}
                            className={`rounded-full px-3.5 py-1.5 text-[13px] 2xl:px-4 2xl:py-2 2xl:text-sm ${
                                type === 'followers' ? 'app-button-primary' : 'app-button-secondary'
                            }`}
                        >
                            Followers
                        </Link>
                        <Link
                            href={route('users.following', {
                                user: profile.username,
                                ...(activeSearch ? { search: activeSearch } : {}),
                            })}
                            className={`rounded-full px-3.5 py-1.5 text-[13px] 2xl:px-4 2xl:py-2 2xl:text-sm ${
                                type === 'following' ? 'app-button-primary' : 'app-button-secondary'
                            }`}
                        >
                            Following
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mt-5 space-y-3 2xl:mt-6 2xl:space-y-4">
                {filteredConnections.length === 0 ? (
                    <div className="app-dashed-panel app-text-muted break-words rounded-[24px] p-6 text-[13px] 2xl:rounded-[28px] 2xl:p-8 2xl:text-sm">
                        {searchTerm ? (
                            <span className="break-all">
                                {`No ${title.toLowerCase()} match "${searchTerm}".`}
                            </span>
                        ) : (
                            emptyState
                        )}
                    </div>
                ) : (
                    filteredConnections.map((person) => (
                        <div
                            key={person.id}
                            className="app-panel rounded-[24px] p-4 2xl:rounded-[28px] 2xl:p-5"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
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

                                    <div className="min-w-0">
                                        <div className="truncate break-all text-[15px] font-semibold 2xl:text-base">
                                            {person.name}
                                        </div>
                                        <div className="app-text-muted truncate break-all text-[13px] 2xl:text-sm">
                                            @{person.username}
                                        </div>
                                        {person.bio && (
                                            <div className="app-text-soft mt-2 line-clamp-2 break-words text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                                                {person.bio}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex shrink-0 gap-2">
                                    {type === 'friends' && isOwnProfile && (
                                        <button
                                            type="button"
                                            onClick={() => setPersonToUnfriend(person)}
                                            className="app-button-secondary rounded-full px-3.5 py-1.5 text-[13px] 2xl:px-4 2xl:py-2 2xl:text-sm"
                                        >
                                            Unfriend
                                        </button>
                                    )}
                                    {canUnfollow && (
                                        <button
                                            type="button"
                                            onClick={() => setPersonToUnfollow(person)}
                                            className="app-button-secondary rounded-full px-3.5 py-1.5 text-[13px] 2xl:px-4 2xl:py-2 2xl:text-sm"
                                        >
                                            Unfollow
                                        </button>
                                    )}
                                    <Link
                                        href={route('users.show', person.username)}
                                        className="app-button-secondary rounded-full px-3.5 py-1.5 text-[13px] 2xl:px-4 2xl:py-2 2xl:text-sm"
                                    >
                                        View profile
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {connectionsMeta.current_page < connectionsMeta.last_page && (
                    <div>
                        <Link
                            href={routeWithQuery({ page: connectionsMeta.current_page + 1 })}
                            className="app-button-secondary inline-flex rounded-full px-4 py-2.5 text-[13px] 2xl:px-5 2xl:py-3 2xl:text-sm"
                        >
                            Load more
                        </Link>
                    </div>
                )}
            </section>

            <Modal show={Boolean(personToUnfollow)} onClose={closeUnfollowModal} maxWidth="md">
                <div className="space-y-4 p-5 2xl:space-y-5 2xl:p-6">
                    <div>
                        <div className="text-base font-semibold 2xl:text-lg">
                            Unfollow {personToUnfollow?.name}?
                        </div>
                        <p className="app-text-soft mt-2 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                            Their posts will stop appearing in your feed until you follow them
                            again.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeUnfollowModal}
                            disabled={isUnfollowing}
                            className="app-button-secondary rounded-full px-3.5 py-1.5 text-[13px] disabled:opacity-60 2xl:px-4 2xl:py-2 2xl:text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmUnfollow}
                            disabled={isUnfollowing}
                            className="app-button-primary rounded-full px-3.5 py-1.5 text-[13px] disabled:opacity-60 2xl:px-4 2xl:py-2 2xl:text-sm"
                        >
                            Unfollow
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={Boolean(personToUnfriend)} onClose={closeUnfriendModal} maxWidth="md">
                <div className="space-y-4 p-5 2xl:space-y-5 2xl:p-6">
                    <div>
                        <div className="text-base font-semibold 2xl:text-lg">
                            Unfriend {personToUnfriend?.name}?
                        </div>
                        <p className="app-text-soft mt-2 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                            You’ll no longer be mutual friends, and the connection will be removed
                            from both sides.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeUnfriendModal}
                            className="app-button-secondary rounded-full px-3.5 py-1.5 text-[13px] 2xl:px-4 2xl:py-2 2xl:text-sm"
                            disabled={isUnfriending}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmUnfriend}
                            className="app-button-primary rounded-full px-3.5 py-1.5 text-[13px] 2xl:px-4 2xl:py-2 2xl:text-sm"
                            disabled={isUnfriending}
                        >
                            {isUnfriending ? 'Unfriending...' : 'Unfriend'}
                        </button>
                    </div>
                </div>
            </Modal>
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
