import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Compass,
    House,
    LogOut,
    MessageCircle,
    Search,
    Settings,
    Trash2,
    UserRoundPlus,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Modal from '@/Components/Modal';

export default function AppShell({ children, title, sidebar, navSearch = null }) {
    const { auth, topbar } = usePage().props;
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
    const showFeedSearch = true;
    const [feedSearchOpen, setFeedSearchOpen] = useState(false);
    const [feedSearchValue, setFeedSearchValue] = useState('');
    const [feedSearchResults, setFeedSearchResults] = useState({
        users: [],
    });
    const [feedSearchLoading, setFeedSearchLoading] = useState(false);
    const feedSearchInputRef = useRef(null);
    const topbarSearchInputRef = useRef(null);
    const [topbarSearchOpen, setTopbarSearchOpen] = useState(false);
    const [navSearchOpen, setNavSearchOpen] = useState(false);
    const navSearchInputRef = useRef(null);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [requestsOpen, setRequestsOpen] = useState(false);
    const pendingRequests = topbar?.pending_requests ?? [];
    const pendingRequestsCount = topbar?.pending_requests_count ?? 0;
    const unreadMessagesCount = topbar?.unread_messages_count ?? 0;
    const [notificationsCount, setNotificationsCount] = useState(topbar?.notifications_count ?? 0);
    const [notifications, setNotifications] = useState(topbar?.notifications ?? []);
    const [notificationsPage, setNotificationsPage] = useState(topbar?.notifications_page ?? 1);
    const [notificationsHasMore, setNotificationsHasMore] = useState(
        topbar?.notifications_has_more ?? false,
    );
    const [notificationsLoadingMore, setNotificationsLoadingMore] = useState(false);
    const [notificationConfirm, setNotificationConfirm] = useState(null);

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
        if (topbarSearchOpen) {
            topbarSearchInputRef.current?.focus();
        }
    }, [topbarSearchOpen]);

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
        if (!showFeedSearch || (!feedSearchOpen && !topbarSearchOpen)) {
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
    }, [showFeedSearch, feedSearchOpen, topbarSearchOpen, feedSearchValue]);

    useEffect(() => {
        if (!navSearch) {
            setNavSearchOpen(false);
        }
    }, [navSearch]);

    useEffect(() => {
        setNotificationsCount(topbar?.notifications_count ?? 0);
        setNotifications(topbar?.notifications ?? []);
        setNotificationsPage(topbar?.notifications_page ?? 1);
        setNotificationsHasMore(topbar?.notifications_has_more ?? false);
    }, [
        topbar?.notifications,
        topbar?.notifications_count,
        topbar?.notifications_has_more,
        topbar?.notifications_page,
    ]);

    const runFeedSearch = () => {
        const term = feedSearchValue.trim();

        if (!term) {
            return false;
        }

        setFeedSearchOpen(false);
        setTopbarSearchOpen(false);
        router.visit(route('feed.search', { q: term, filter: 'people' }));

        return true;
    };

    const submitFeedSearch = (event) => {
        event.preventDefault();
        runFeedSearch();
    };

    const handleTopbarSearchButton = () => {
        if (!topbarSearchOpen) {
            setTopbarSearchOpen(true);
            return;
        }

        runFeedSearch();
    };

    const openNotifications = () => {
        setNotificationsOpen(true);

        if (notificationsCount === 0) {
            return;
        }

        setNotificationsCount(0);
        setNotifications((current) =>
            current.map((notification) => ({
                ...notification,
                read_at: notification.read_at ?? new Date().toISOString(),
            })),
        );

        window.axios
            .post(
                route('notifications.read'),
                {},
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            )
            .catch(() => {
                router.reload({
                    only: ['topbar'],
                    preserveScroll: true,
                    preserveState: true,
                });
            });
    };

    const closeNotifications = () => {
        setNotificationsOpen(false);
        setNotificationConfirm(null);
    };

    const removeNotification = (notificationId) => {
        const previousNotifications = notifications;
        const previousCount = notificationsCount;
        const nextNotifications = notifications.filter(
            (notification) => notification.id !== notificationId,
        );

        setNotifications(nextNotifications);
        setNotificationsCount(
            Math.max(
                0,
                previousCount -
                    (previousNotifications.find(
                        (notification) =>
                            notification.id === notificationId && !notification.read_at,
                    )
                        ? 1
                        : 0),
            ),
        );

        window.axios
            .delete(route('notifications.destroy', notificationId), {
                headers: {
                    Accept: 'application/json',
                },
            })
            .catch(() => {
                setNotifications(previousNotifications);
                setNotificationsCount(previousCount);
            });
    };

    const clearNotifications = () => {
        const previousNotifications = notifications;
        const previousCount = notificationsCount;
        const previousHasMore = notificationsHasMore;
        const previousPage = notificationsPage;

        setNotifications([]);
        setNotificationsCount(0);
        setNotificationsHasMore(false);
        setNotificationsPage(1);

        window.axios
            .delete(route('notifications.clear'), {
                headers: {
                    Accept: 'application/json',
                },
            })
            .catch(() => {
                setNotifications(previousNotifications);
                setNotificationsCount(previousCount);
                setNotificationsHasMore(previousHasMore);
                setNotificationsPage(previousPage);
            });
    };

    const confirmNotificationAction = () => {
        if (!notificationConfirm) {
            return;
        }

        if (notificationConfirm.type === 'clear_all') {
            clearNotifications();
        }

        if (notificationConfirm.type === 'remove_one') {
            removeNotification(notificationConfirm.notificationId);
        }

        setNotificationConfirm(null);
    };

    const loadMoreNotifications = () => {
        if (notificationsLoadingMore || !notificationsHasMore) {
            return;
        }

        const nextPage = notificationsPage + 1;
        setNotificationsLoadingMore(true);

        window.axios
            .get(route('notifications.index'), {
                params: { page: nextPage },
                headers: {
                    Accept: 'application/json',
                },
            })
            .then(({ data }) => {
                setNotifications((current) => [...current, ...(data.notifications ?? [])]);
                setNotificationsPage(data.page ?? nextPage);
                setNotificationsHasMore(Boolean(data.has_more));
            })
            .finally(() => {
                setNotificationsLoadingMore(false);
            });
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
                    <aside className="min-[1246px]:sticky min-[1246px]:top-6 min-[1246px]:h-[calc(100vh-3rem)] min-[1246px]:w-64 2xl:w-72">
                        <div className="app-panel-strong flex h-full flex-col gap-5 rounded-[28px] p-4 backdrop-blur min-[1246px]:pb-6 2xl:gap-6 2xl:rounded-[32px] 2xl:p-5 2xl:pb-7">
                            <div className="space-y-5 2xl:space-y-6">
                                <Link
                                    href={route('feed.home')}
                                    className="auth-brand-lockup inline-flex items-center gap-0 self-start"
                                >
                                    <ApplicationLogo className="auth-wordmark-icon h-10 w-10 fill-current 2xl:h-11 2xl:w-11" />
                                    <div>
                                        <div className="auth-wordmark text-[1.55rem] font-semibold 2xl:text-[1.7rem]">
                                            ynce
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    href={route('users.show', auth.user.username)}
                                    className={`app-panel-inset app-sidebar-user-link flex items-center gap-2.5 rounded-[22px] px-3.5 py-2.5 2xl:gap-3 2xl:rounded-[24px] 2xl:px-4 2xl:py-3 ${
                                        ownProfileActive ? 'app-sidebar-user-link-active' : ''
                                    }`}
                                >
                                    {auth.user.avatar_url ? (
                                        <div className="h-10 w-10 overflow-hidden rounded-[18px] 2xl:h-12 2xl:w-12 2xl:rounded-2xl">
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
                                            className="app-avatar-fallback flex h-10 w-10 items-center justify-center rounded-[18px] text-xs font-semibold 2xl:h-12 2xl:w-12 2xl:rounded-2xl 2xl:text-sm"
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
                                        <div className="truncate text-[13px] font-semibold 2xl:text-sm">
                                            {auth.user.name}
                                        </div>
                                        <div className="app-text-muted truncate text-[11px] 2xl:text-xs">
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
                                                className="app-nav-link inline-flex h-10 w-10 items-center justify-center rounded-[18px] 2xl:h-11 2xl:w-11 2xl:rounded-2xl"
                                                aria-label={navSearch.ariaLabel ?? 'Open search'}
                                            >
                                                <Search
                                                    className="h-4 w-4 shrink-0 2xl:h-5 2xl:w-5"
                                                    strokeWidth={1.8}
                                                />
                                            </button>
                                        </div>
                                    )}
                                    {navSearch && navSearchOpen && (
                                        <label className="app-panel-inset flex items-center gap-2.5 rounded-[18px] px-3.5 py-2.5 2xl:gap-3 2xl:rounded-2xl 2xl:px-4 2xl:py-3">
                                            <Search
                                                className="app-text-muted h-4 w-4 shrink-0 2xl:h-5 2xl:w-5"
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
                                                className="w-full bg-transparent text-[13px] focus:outline-none 2xl:text-sm"
                                            />
                                        </label>
                                    )}
                                    {navigation.map((item) => (
                                        <div key={item.label} className="space-y-2">
                                            <Link
                                                href={item.href}
                                                className={`app-nav-link flex items-center gap-2.5 rounded-[18px] px-3.5 py-2.5 text-[13px] font-medium 2xl:gap-3 2xl:rounded-2xl 2xl:px-4 2xl:py-3 2xl:text-sm ${
                                                    item.active ? 'app-nav-link-active' : ''
                                                }`}
                                            >
                                                <item.icon
                                                    className="h-4 w-4 shrink-0 2xl:h-5 2xl:w-5"
                                                    strokeWidth={1.8}
                                                />
                                                {item.label}
                                            </Link>
                                            {item.label === 'Home' && showFeedSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFeedSearchOpen(true)}
                                                    className="app-nav-link flex w-full items-center gap-2.5 rounded-[18px] px-3.5 py-2.5 text-[13px] font-medium 2xl:gap-3 2xl:rounded-2xl 2xl:px-4 2xl:py-3 2xl:text-sm"
                                                >
                                                    <Search
                                                        className="h-4 w-4 shrink-0 2xl:h-5 2xl:w-5"
                                                        strokeWidth={1.8}
                                                    />
                                                    Search
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </nav>
                            </div>

                            <div className="mt-auto space-y-3 pt-1 2xl:space-y-4 2xl:pt-2">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="app-button-secondary app-button-secondary--logout app-panel-inset flex w-full items-center gap-2.5 rounded-[18px] px-3.5 py-2.5 text-left text-[13px] 2xl:gap-3 2xl:rounded-2xl 2xl:px-4 2xl:py-3 2xl:text-sm"
                                >
                                    <LogOut
                                        className="h-4 w-4 shrink-0 2xl:h-5 2xl:w-5"
                                        strokeWidth={1.8}
                                    />
                                    Log out
                                </Link>
                            </div>
                        </div>
                    </aside>

                    <main className="min-w-0 flex-1 space-y-6">
                        <div className="sticky top-6 z-30">
                            <div
                                className={`mx-auto w-full space-y-2 transition-all duration-200 ${
                                    topbarSearchOpen
                                        ? 'max-w-[32rem] 2xl:max-w-[36rem]'
                                        : 'max-w-[22rem] 2xl:max-w-[26rem]'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2 rounded-[22px] border border-[var(--vynce-border)] bg-[var(--vynce-surface-subtle)] px-3 py-2 shadow-[var(--vynce-shadow-md)] backdrop-blur 2xl:rounded-[26px] 2xl:px-3.5 2xl:py-2.5">
                                    <form
                                        onSubmit={submitFeedSearch}
                                        className={`min-w-0 transition-all duration-200 ${
                                            topbarSearchOpen
                                                ? 'w-full max-w-[20rem] flex-1 sm:max-w-[24rem]'
                                                : 'w-auto'
                                        }`}
                                    >
                                        {topbarSearchOpen ? (
                                            <div className="2xl:pl-5.5 2xl:pr-5.5 flex items-center gap-2 rounded-full bg-[rgba(17,11,28,0.34)] py-2 pl-5 pr-5 2xl:py-2.5">
                                                <button
                                                    type="submit"
                                                    className="app-text-muted inline-flex h-4 w-4 shrink-0 items-center justify-center 2xl:h-5 2xl:w-5"
                                                    aria-label="Search Vynce"
                                                >
                                                    <Search
                                                        className="h-4 w-4 2xl:h-5 2xl:w-5"
                                                        strokeWidth={1.8}
                                                    />
                                                </button>
                                                <input
                                                    ref={topbarSearchInputRef}
                                                    type="search"
                                                    value={feedSearchValue}
                                                    onChange={(event) =>
                                                        setFeedSearchValue(event.target.value)
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.key === 'Escape' &&
                                                            !feedSearchValue.trim()
                                                        ) {
                                                            setTopbarSearchOpen(false);
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (!feedSearchValue.trim()) {
                                                            setTopbarSearchOpen(false);
                                                        }
                                                    }}
                                                    placeholder="Search Vynce"
                                                    className="app-search-input w-full min-w-0 appearance-none border-0 bg-transparent text-[13px] shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 2xl:text-sm"
                                                />
                                                {feedSearchValue.trim() ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFeedSearchValue('')}
                                                        className="app-text-muted inline-flex h-4 w-4 shrink-0 items-center justify-center 2xl:h-5 2xl:w-5"
                                                        aria-label="Clear search"
                                                    >
                                                        <X
                                                            className="h-4 w-4 2xl:h-5 2xl:w-5"
                                                            strokeWidth={1.8}
                                                        />
                                                    </button>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleTopbarSearchButton}
                                                className="app-nav-link inline-flex h-10 w-10 items-center justify-center rounded-[16px] 2xl:h-11 2xl:w-11 2xl:rounded-[18px]"
                                                aria-label="Open search"
                                            >
                                                <Search
                                                    className="h-4 w-4 shrink-0 2xl:h-5 2xl:w-5"
                                                    strokeWidth={1.8}
                                                />
                                            </button>
                                        )}
                                    </form>
                                    <TopbarLinkButton
                                        label="Messages"
                                        ariaLabel="Open messages"
                                        href={route('messages.index')}
                                        active={
                                            route().current('messages.index') ||
                                            route().current('messages.show')
                                        }
                                        icon={MessageCircle}
                                        count={unreadMessagesCount}
                                    />
                                    <TopbarIconButton
                                        label="Notifications"
                                        ariaLabel="Open notifications"
                                        onClick={openNotifications}
                                        icon={Bell}
                                        count={notificationsCount}
                                    />
                                    <TopbarIconButton
                                        label="Friend requests"
                                        ariaLabel="Open friendship requests"
                                        onClick={() => setRequestsOpen(true)}
                                        icon={UserRoundPlus}
                                        count={pendingRequestsCount}
                                    />
                                </div>

                                {topbarSearchOpen && feedSearchValue.trim() ? (
                                    <div className="px-1 pt-1">
                                        {feedSearchLoading ? (
                                            <div className="app-panel-inset rounded-[18px] px-3.5 py-3 text-[13px] 2xl:rounded-[22px] 2xl:px-4 2xl:py-4 2xl:text-sm">
                                                Searching...
                                            </div>
                                        ) : feedSearchResults.users.length > 0 ? (
                                            <div className="space-y-2">
                                                {feedSearchResults.users.map((person) => (
                                                    <Link
                                                        key={person.id}
                                                        href={route('users.show', person.username)}
                                                        onClick={() => setTopbarSearchOpen(false)}
                                                        className="app-card-inset flex items-center gap-2.5 rounded-[18px] px-3.5 py-2.5 transition hover:bg-[var(--vynce-surface-muted)] 2xl:gap-3 2xl:rounded-[22px] 2xl:px-4 2xl:py-3"
                                                    >
                                                        {person.avatar_url ? (
                                                            <img
                                                                src={person.avatar_url}
                                                                alt={person.name}
                                                                className="h-10 w-10 rounded-[18px] object-cover 2xl:h-11 2xl:w-11 2xl:rounded-2xl"
                                                                style={{
                                                                    objectPosition: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                                    transform: `scale(${person.avatar_zoom})`,
                                                                    transformOrigin: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="app-avatar-fallback flex h-10 w-10 items-center justify-center rounded-[18px] text-[13px] font-semibold 2xl:h-11 2xl:w-11 2xl:rounded-2xl 2xl:text-sm">
                                                                {initialsFor(person.name)}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-[13px] font-semibold 2xl:text-sm">
                                                                {person.name}
                                                            </div>
                                                            <div className="app-text-soft truncate text-[11px] 2xl:text-xs">
                                                                @{person.username}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="app-dashed-panel app-text-muted rounded-[18px] p-4 text-[13px] leading-5 2xl:rounded-[22px] 2xl:p-5 2xl:text-sm 2xl:leading-6">
                                                No results match “{feedSearchValue.trim()}”.
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {children}
                    </main>

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
                <div className="space-y-4 p-5 2xl:space-y-5 2xl:p-6">
                    <div>
                        <div className="text-base font-semibold 2xl:text-lg">Search</div>
                        <p className="app-text-soft mt-2 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                            Search people here, or continue to the full search page.
                        </p>
                    </div>

                    <form onSubmit={submitFeedSearch} className="space-y-3 2xl:space-y-4">
                        <label className="app-search flex items-center gap-2.5 rounded-[20px] px-3.5 py-2.5 backdrop-blur transition 2xl:gap-3 2xl:rounded-[24px] 2xl:px-4 2xl:py-3">
                            <Search
                                className="app-text-muted h-4 w-4 shrink-0 2xl:h-5 2xl:w-5"
                                strokeWidth={1.8}
                            />
                            <input
                                ref={feedSearchInputRef}
                                type="search"
                                value={feedSearchValue}
                                onChange={(event) => setFeedSearchValue(event.target.value)}
                                placeholder="Search people"
                                className="app-search-input w-full bg-transparent text-[13px] focus:outline-none 2xl:text-sm"
                            />
                        </label>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={!feedSearchValue.trim()}
                                className="app-button-primary rounded-full px-3.5 py-1.5 text-[13px] disabled:opacity-60 2xl:px-4 2xl:py-2 2xl:text-sm"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {feedSearchLoading ? (
                        <div className="app-panel-inset rounded-[20px] px-3.5 py-3 text-[13px] 2xl:rounded-[24px] 2xl:px-4 2xl:py-4 2xl:text-sm">
                            Searching...
                        </div>
                    ) : feedSearchValue.trim() ? (
                        <div className="space-y-3 2xl:space-y-4">
                            {feedSearchResults.users.length > 0 && (
                                <div className="space-y-2.5 2xl:space-y-3">
                                    <div className="app-text-soft text-[11px] uppercase tracking-[0.18em] 2xl:text-xs">
                                        People
                                    </div>
                                    <div className="space-y-2.5 2xl:space-y-3">
                                        {feedSearchResults.users.map((person) => (
                                            <Link
                                                key={person.id}
                                                href={route('users.show', person.username)}
                                                onClick={() => setFeedSearchOpen(false)}
                                                className="app-card-inset flex items-center gap-2.5 rounded-[18px] px-3.5 py-2.5 transition hover:bg-[var(--vynce-surface-muted)] 2xl:gap-3 2xl:rounded-[22px] 2xl:px-4 2xl:py-3"
                                            >
                                                {person.avatar_url ? (
                                                    <img
                                                        src={person.avatar_url}
                                                        alt={person.name}
                                                        className="h-10 w-10 rounded-[18px] object-cover 2xl:h-11 2xl:w-11 2xl:rounded-2xl"
                                                        style={{
                                                            objectPosition: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                            transform: `scale(${person.avatar_zoom})`,
                                                            transformOrigin: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="app-avatar-fallback flex h-10 w-10 items-center justify-center rounded-[18px] text-[13px] font-semibold 2xl:h-11 2xl:w-11 2xl:rounded-2xl 2xl:text-sm">
                                                        {initialsFor(person.name)}
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-[13px] font-semibold 2xl:text-sm">
                                                        {person.name}
                                                    </div>
                                                    <div className="app-text-soft truncate text-[11px] 2xl:text-xs">
                                                        @{person.username}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {feedSearchResults.users.length === 0 && (
                                <div className="app-dashed-panel app-text-muted rounded-[20px] p-4 text-[13px] leading-5 2xl:rounded-[24px] 2xl:p-5 2xl:text-sm 2xl:leading-6">
                                    No results match “{feedSearchValue.trim()}”.
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </Modal>

            <Modal show={notificationsOpen} onClose={closeNotifications} maxWidth="lg" centered>
                <div className="space-y-4 p-5 2xl:space-y-5 2xl:p-6">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="text-base font-semibold 2xl:text-lg">Notifications</div>
                            <p className="app-text-soft mt-2 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                                Recent activity across messages, follows, comments, and requests.
                            </p>
                        </div>
                        {notifications.length > 0 ? (
                            <button
                                type="button"
                                onClick={() =>
                                    setNotificationConfirm({
                                        type: 'clear_all',
                                        title: 'Clear all notifications?',
                                        body: 'This will remove every notification from this list.',
                                        confirmLabel: 'Clear all',
                                    })
                                }
                                className="app-button-secondary inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] 2xl:text-[13px]"
                            >
                                <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                                Clear all
                            </button>
                        ) : null}
                    </div>

                    {notificationConfirm ? (
                        <div className="app-panel-inset flex items-center justify-between gap-3 rounded-[18px] px-4 py-3 2xl:rounded-[20px]">
                            <div className="min-w-0">
                                <div className="text-[13px] font-semibold 2xl:text-sm">
                                    {notificationConfirm.title}
                                </div>
                                <div className="app-text-soft mt-1 text-[12px] leading-5 2xl:text-[13px]">
                                    {notificationConfirm.body}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNotificationConfirm(null)}
                                    className="app-button-secondary rounded-full px-3 py-1.5 text-[12px] 2xl:text-[13px]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmNotificationAction}
                                    className="app-button-primary rounded-full px-3 py-1.5 text-[12px] 2xl:text-[13px]"
                                >
                                    {notificationConfirm.confirmLabel}
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {notifications.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[20px] p-4 text-[13px] leading-5 2xl:rounded-[24px] 2xl:p-5 2xl:text-sm 2xl:leading-6">
                            You’re all caught up.
                        </div>
                    ) : (
                        <div className="space-y-3 2xl:space-y-4">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="app-card-inset flex items-start gap-3 rounded-[18px] p-3 transition hover:bg-[var(--vynce-surface-muted)] 2xl:rounded-2xl 2xl:p-4"
                                >
                                    <Link
                                        href={notification.href}
                                        onClick={() => setNotificationsOpen(false)}
                                        className="flex min-w-0 flex-1 items-start gap-3"
                                    >
                                        {notification.actor?.avatar_url ? (
                                            <img
                                                src={notification.actor.avatar_url}
                                                alt={notification.actor.name}
                                                className="h-11 w-11 rounded-[18px] object-cover 2xl:h-12 2xl:w-12 2xl:rounded-2xl"
                                                style={{
                                                    objectPosition: `${notification.actor.avatar_position_x}% ${notification.actor.avatar_position_y}%`,
                                                    transform: `scale(${notification.actor.avatar_zoom})`,
                                                    transformOrigin: `${notification.actor.avatar_position_x}% ${notification.actor.avatar_position_y}%`,
                                                }}
                                            />
                                        ) : (
                                            <div className="app-avatar-fallback flex h-11 w-11 items-center justify-center rounded-[18px] text-[12px] font-semibold 2xl:h-12 2xl:w-12 2xl:rounded-2xl">
                                                {initialsFor(notification.actor?.name)}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-[13px] font-semibold 2xl:text-sm">
                                                        {notification.title}
                                                    </div>
                                                    <div className="app-text-soft mt-1 text-[12px] leading-5 2xl:text-[13px]">
                                                        {notification.body}
                                                    </div>
                                                </div>
                                                {!notification.read_at ? (
                                                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--vynce-accent)]" />
                                                ) : null}
                                            </div>
                                            <div className="app-text-muted mt-2 text-[11px] 2xl:text-xs">
                                                {notification.created_at_human}
                                            </div>
                                        </div>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            setNotificationConfirm({
                                                type: 'remove_one',
                                                notificationId: notification.id,
                                                title: 'Remove this notification?',
                                                body: 'This item will be removed from your notifications list.',
                                                confirmLabel: 'Remove',
                                            });
                                        }}
                                        className="app-text-muted inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-[var(--vynce-surface-muted)] hover:text-white"
                                        aria-label="Remove notification"
                                        title="Remove notification"
                                    >
                                        <X className="h-4 w-4" strokeWidth={1.9} />
                                    </button>
                                </div>
                            ))}
                            {notificationsHasMore ? (
                                <div className="flex justify-center pt-1">
                                    <button
                                        type="button"
                                        onClick={loadMoreNotifications}
                                        disabled={notificationsLoadingMore}
                                        className="app-button-secondary rounded-full px-4 py-2 text-[13px] disabled:opacity-60 2xl:text-sm"
                                    >
                                        {notificationsLoadingMore ? 'Loading...' : 'Load more'}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </Modal>

            <Modal
                show={requestsOpen}
                onClose={() => setRequestsOpen(false)}
                maxWidth="lg"
                centered
            >
                <div className="space-y-4 p-5 2xl:space-y-5 2xl:p-6">
                    <div>
                        <div className="text-base font-semibold 2xl:text-lg">
                            Friendship requests
                        </div>
                        <p className="app-text-soft mt-2 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                            Review pending requests from people who want to connect with you.
                        </p>
                    </div>

                    {pendingRequests.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[20px] p-4 text-[13px] leading-5 2xl:rounded-[24px] 2xl:p-5 2xl:text-sm 2xl:leading-6">
                            No pending friendship requests right now.
                        </div>
                    ) : (
                        <div className="space-y-3 2xl:space-y-4">
                            {pendingRequests.map((person) => (
                                <div
                                    key={person.id}
                                    className="app-card-inset rounded-[18px] p-3 2xl:rounded-2xl 2xl:p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={route('users.show', person.username)}
                                            onClick={() => setRequestsOpen(false)}
                                            className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] transition-opacity hover:opacity-80"
                                        >
                                            {person.avatar_url ? (
                                                <img
                                                    src={person.avatar_url}
                                                    alt={person.name}
                                                    className="h-11 w-11 rounded-[18px] object-cover 2xl:h-12 2xl:w-12 2xl:rounded-2xl"
                                                    style={{
                                                        objectPosition: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                        transform: `scale(${person.avatar_zoom})`,
                                                        transformOrigin: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                    }}
                                                />
                                            ) : (
                                                <div className="app-avatar-fallback flex h-11 w-11 items-center justify-center rounded-[18px] text-[12px] font-semibold 2xl:h-12 2xl:w-12 2xl:rounded-2xl">
                                                    {initialsFor(person.name)}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-[13px] font-semibold 2xl:text-sm">
                                                    {person.name}
                                                </div>
                                                <div className="app-text-soft truncate text-[11px] 2xl:text-xs">
                                                    @{person.username}
                                                </div>
                                            </div>
                                        </Link>

                                        <div className="flex gap-2">
                                            <Link
                                                href={route(
                                                    'users.friend-requests.accept',
                                                    person.id,
                                                )}
                                                method="post"
                                                as="button"
                                                className="app-button-primary rounded-full px-3 py-1.5 text-[11px] font-semibold 2xl:py-2 2xl:text-xs"
                                            >
                                                Accept
                                            </Link>
                                            <Link
                                                href={route(
                                                    'users.friend-requests.reject',
                                                    person.id,
                                                )}
                                                method="delete"
                                                as="button"
                                                className="app-button-secondary rounded-full px-3 py-1.5 text-[11px] 2xl:py-2 2xl:text-xs"
                                            >
                                                Refuse
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}

function TopbarLinkButton({ href, icon: Icon, count = 0, active = false, ariaLabel }) {
    return (
        <Link
            href={href}
            className={`app-nav-link relative inline-flex h-10 w-10 items-center justify-center rounded-full 2xl:h-11 2xl:w-11 ${
                active ? 'app-nav-link-active' : ''
            }`}
            aria-label={ariaLabel}
        >
            <Icon className="h-4 w-4 2xl:h-5 2xl:w-5" strokeWidth={1.9} />
            {count > 0 ? <TopbarBadge count={count} /> : null}
        </Link>
    );
}

function TopbarIconButton({ onClick, icon: Icon, count = 0, ariaLabel, disabled = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="app-nav-link relative inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-default disabled:opacity-70 2xl:h-11 2xl:w-11"
            aria-label={ariaLabel}
        >
            <Icon className="h-4 w-4 2xl:h-5 2xl:w-5" strokeWidth={1.9} />
            {count > 0 ? <TopbarBadge count={count} /> : null}
        </button>
    );
}

function TopbarBadge({ count }) {
    return (
        <span className="app-button-primary absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none">
            {count > 99 ? '99+' : count}
        </span>
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
