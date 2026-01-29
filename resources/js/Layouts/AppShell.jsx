import ApplicationLogo from '@/Components/ApplicationLogo';
import Modal from '@/Components/Modal';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Compass, House, LogOut, MessageCircle, Search, Settings, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function AppShell({ children, title, sidebar, navSearch = null }) {
    const { auth } = usePage().props;
    const ownProfileActive =
        route().current('users.show') && route().params.user === auth.user.username;
    const ownFriendsActive =
        route().current('users.friends') && route().params.user === auth.user.username;
    const initials = auth.user.name
        ?.split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const showFeedSearch =
        route().current('feed.home') ||
        route().current('feed.following') ||
        route().current('feed.search');
    const [feedSearchOpen, setFeedSearchOpen] = useState(false);
    const [feedSearchValue, setFeedSearchValue] = useState('');
    const [feedSearchResults, setFeedSearchResults] = useState({
        users: [],
    });
    const [feedSearchLoading, setFeedSearchLoading] = useState(false);
    const feedSearchInputRef = useRef(null);
    const [navSearchOpen, setNavSearchOpen] = useState(false);
    const navSearchInputRef = useRef(null);

    useEffect(() => {
        if (navSearch && navSearchOpen) {
            navSearchInputRef.current?.focus();
        }
    }, [navSearch, navSearchOpen]);

    useEffect(() => {
        if (showFeedSearch && feedSearchOpen) {
            feedSearchInputRef.current?.focus();
        }
    }, [showFeedSearch, feedSearchOpen]);

    useEffect(() => {
        if (!feedSearchOpen) {
            return;
        }

        setFeedSearchValue('');
        setFeedSearchResults({
            users: [],
        });
        setFeedSearchLoading(false);
    }, [feedSearchOpen]);

    useEffect(() => {
        if (!showFeedSearch || !feedSearchOpen) {
            return undefined;
        }

        const term = feedSearchValue.trim();

        if (!term) {
            setFeedSearchResults({
                users: [],
            });
            setFeedSearchLoading(false);
            return undefined;
        }

        let cancelled = false;
        setFeedSearchLoading(true);

        const timeoutId = window.setTimeout(() => {
            window.axios
                .get(route('feed.search'), {
                    params: { q: term },
                    headers: {
                        Accept: 'application/json',
                    },
                })
                .then(({ data }) => {
                    if (cancelled) {
                        return;
                    }

                    setFeedSearchResults({
                        users: data.users ?? [],
                    });
                })
                .catch(() => {
                    if (cancelled) {
                        return;
                    }

                    setFeedSearchResults({
                        users: [],
                    });
                })
                .finally(() => {
                    if (!cancelled) {
                        setFeedSearchLoading(false);
                    }
                });
        }, 220);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [showFeedSearch, feedSearchOpen, feedSearchValue]);

    useEffect(() => {
        if (!navSearch) {
            setNavSearchOpen(false);
        }
    }, [navSearch]);

    const submitFeedSearch = (event) => {
        event.preventDefault();

        const term = feedSearchValue.trim();

        if (!term) {
            return;
        }

        setFeedSearchOpen(false);
        router.visit(route('feed.search', { q: term, filter: 'people' }));
    };
    const navigation = [
        {
            label: 'Home',
            href: route('feed.home'),
            active: route().current('feed.home'),
            icon: House,
        },
        {
            label: 'Contacts',
            href: route('users.friends', auth.user.username),
            active: ownFriendsActive,
            icon: Users,
        },
        {
            label: 'Discover',
            href: route('feed.discover'),
            active: route().current('feed.discover'),
            icon: Compass,
        },
        {
            label: 'Messages',
            href: route('messages.index'),
            active: route().current('messages.index') || route().current('messages.show'),
            icon: MessageCircle,
        },
        {
            label: 'Settings',
            href: route('settings'),
            active: route().current('settings') || route().current('profile.edit'),
            icon: Settings,
        },
    ];

    return (
        <>
            <Head title={title} />

            <div className="app-page-shell min-h-screen">
                <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 min-[1246px]:flex-row min-[1246px]:px-6">
                    <aside className="min-[1246px]:sticky min-[1246px]:top-6 min-[1246px]:h-[calc(100vh-3rem)] min-[1246px]:w-72">
                        <div className="app-panel-strong flex h-full flex-col justify-between rounded-[32px] p-5 backdrop-blur">
                            <div className="space-y-6">
                                <Link
                                    href={route('feed.home')}
                                    className="auth-brand-lockup inline-flex items-center gap-0 self-start"
                                >
                                    <ApplicationLogo className="auth-wordmark-icon h-11 w-11 fill-current" />
                                    <div>
                                        <div className="auth-wordmark text-[1.7rem] font-semibold">
                                            ynce
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    href={route('users.show', auth.user.username)}
                                    className={`app-panel-inset app-sidebar-user-link flex items-center gap-3 rounded-[24px] px-4 py-3 ${
                                        ownProfileActive ? 'app-sidebar-user-link-active' : ''
                                    }`}
                                >
                                    {auth.user.avatar_url ? (
                                        <div className="h-12 w-12 overflow-hidden rounded-2xl">
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
                                        <div
                                            className="app-avatar-fallback flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold"
                                            style={
                                                ownProfileActive
                                                    ? {
                                                          background: 'rgba(77, 53, 112, 0.92)',
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {initials}
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold">
                                            {auth.user.name}
                                        </div>
                                        <div className="app-text-muted truncate text-xs">
                                            @{auth.user.username}
                                        </div>
                                    </div>
                                </Link>

                                <nav className="space-y-2">
                                    {navSearch && !navSearchOpen && (
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setNavSearchOpen(true)}
                                                className="app-nav-link inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                                                aria-label={navSearch.ariaLabel ?? 'Open search'}
                                            >
                                                <Search
                                                    className="h-5 w-5 shrink-0"
                                                    strokeWidth={1.8}
                                                />
                                            </button>
                                        </div>
                                    )}
                                    {navSearch && navSearchOpen && (
                                        <label className="app-panel-inset flex items-center gap-3 rounded-2xl px-4 py-3">
                                            <Search
                                                className="app-text-muted h-5 w-5 shrink-0"
                                                strokeWidth={1.8}
                                            />
                                            <input
                                                ref={navSearchInputRef}
                                                type="search"
                                                value={navSearch.value}
                                                onChange={(event) =>
                                                    navSearch.onChange(event.target.value)
                                                }
                                                onBlur={() => {
                                                    if (!navSearch.value) {
                                                        setNavSearchOpen(false);
                                                    }
                                                }}
                                                placeholder={navSearch.placeholder ?? 'Search'}
                                                className="w-full bg-transparent text-sm focus:outline-none"
                                            />
                                        </label>
                                    )}
                                    {navigation.map((item) => (
                                        <div key={item.label} className="space-y-2">
                                            <Link
                                                href={item.href}
                                                className={`app-nav-link flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                                                    item.active ? 'app-nav-link-active' : ''
                                                }`}
                                            >
                                                <item.icon
                                                    className="h-5 w-5 shrink-0"
                                                    strokeWidth={1.8}
                                                />
                                                {item.label}
                                            </Link>
                                            {item.label === 'Home' && showFeedSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFeedSearchOpen(true)}
                                                    className="app-nav-link flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium"
                                                >
                                                    <Search
                                                        className="h-5 w-5 shrink-0"
                                                        strokeWidth={1.8}
                                                    />
                                                    Search
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </nav>
                            </div>

                            <div className="space-y-4">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="app-button-secondary app-button-secondary--logout app-panel-inset flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm"
                                >
                                    <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                                    Log out
                                </Link>
                            </div>
                        </div>
                    </aside>

                    <main className="min-w-0 flex-1 space-y-6">{children}</main>

                    {sidebar && (
                        <aside className="min-[1246px]:sticky min-[1246px]:top-6 min-[1246px]:h-fit min-[1246px]:w-80">
                            {sidebar}
                        </aside>
                    )}
                </div>
            </div>

            <Modal
                show={showFeedSearch && feedSearchOpen}
                onClose={() => {
                    setFeedSearchOpen(false);
                    setFeedSearchValue('');
                    setFeedSearchResults({ users: [] });
                    setFeedSearchLoading(false);
                }}
                maxWidth="xl"
                centered
            >
                <div className="space-y-5 p-6">
                    <div>
                        <div className="text-lg font-semibold">Search</div>
                        <p className="app-text-soft mt-2 text-sm leading-6">
                            Search people here, or continue to the full search page.
                        </p>
                    </div>

                    <form onSubmit={submitFeedSearch} className="space-y-4">
                        <label className="app-search flex items-center gap-3 rounded-[24px] px-4 py-3 backdrop-blur transition">
                            <Search className="app-text-muted h-5 w-5 shrink-0" strokeWidth={1.8} />
                            <input
                                ref={feedSearchInputRef}
                                type="search"
                                value={feedSearchValue}
                                onChange={(event) => setFeedSearchValue(event.target.value)}
                                placeholder="Search people"
                                className="app-search-input w-full bg-transparent text-sm focus:outline-none"
                            />
                        </label>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={!feedSearchValue.trim()}
                                className="app-button-primary rounded-full px-4 py-2 text-sm disabled:opacity-60"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {feedSearchLoading ? (
                        <div className="app-panel-inset rounded-[24px] px-4 py-4 text-sm">
                            Searching...
                        </div>
                    ) : feedSearchValue.trim() ? (
                        <div className="space-y-4">
                            {feedSearchResults.users.length > 0 && (
                                <div className="space-y-3">
                                    <div className="app-text-soft text-xs uppercase tracking-[0.18em]">
                                        People
                                    </div>
                                    <div className="space-y-3">
                                        {feedSearchResults.users.map((person) => (
                                            <Link
                                                key={person.id}
                                                href={route('users.show', person.username)}
                                                onClick={() => setFeedSearchOpen(false)}
                                                className="app-card-inset flex items-center gap-3 rounded-[22px] px-4 py-3 transition hover:bg-[var(--vynce-surface-muted)]"
                                            >
                                                {person.avatar_url ? (
                                                    <img
                                                        src={person.avatar_url}
                                                        alt={person.name}
                                                        className="h-11 w-11 rounded-2xl object-cover"
                                                        style={{
                                                            objectPosition: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                            transform: `scale(${person.avatar_zoom})`,
                                                            transformOrigin: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="app-avatar-fallback flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold">
                                                        {initialsFor(person.name)}
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-semibold">
                                                        {person.name}
                                                    </div>
                                                    <div className="app-text-soft truncate text-xs">
                                                        @{person.username}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {feedSearchResults.users.length === 0 && (
                                <div className="app-dashed-panel app-text-muted rounded-[24px] p-5 text-sm leading-6">
                                    No results match “{feedSearchValue.trim()}”.
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </Modal>
        </>
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
