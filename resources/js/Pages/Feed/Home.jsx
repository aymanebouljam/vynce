import PostCard from '@/Components/App/PostCard';
import PostComposer from '@/Components/App/PostComposer';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Check, Flame, TrendingUp, UserPlus } from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const trends = [
    { label: 'Design systems', posts: '1,284 posts today' },
    { label: 'Launch notes', posts: '842 posts today' },
    { label: 'Creator workflow', posts: '511 posts today' },
];

export default function Home({ feed, activeTab, pendingRequests = [], suggestions = [] }) {
    const { flash } = usePage().props;
    const newPostId = flash?.new_post_id;
    const isDiscover = activeTab === 'discover';
    const [visibleSuggestions, setVisibleSuggestions] = useState(suggestions);
    const [processingSuggestionIds, setProcessingSuggestionIds] = useState([]);
    const [confirmedSuggestionIds, setConfirmedSuggestionIds] = useState([]);
    const [exitingSuggestionIds, setExitingSuggestionIds] = useState([]);
    const [removedSuggestionIds, setRemovedSuggestionIds] = useState([]);

    useEffect(() => {
        setVisibleSuggestions(
            suggestions.filter((person) => !removedSuggestionIds.includes(person.id)),
        );
    }, [suggestions, removedSuggestionIds]);

    const addSuggestion = async (person) => {
        if (processingSuggestionIds.includes(person.id)) {
            return;
        }

        setProcessingSuggestionIds((current) => [...current, person.id]);

        try {
            await window.axios.post(route('users.follow', person.id), null, {
                headers: {
                    Accept: 'application/json',
                },
            });

            setConfirmedSuggestionIds((current) => [...current, person.id]);

            window.setTimeout(() => {
                setExitingSuggestionIds((current) => [...current, person.id]);
            }, 180);

            window.setTimeout(() => {
                setVisibleSuggestions((current) =>
                    current.filter((suggestion) => suggestion.id !== person.id),
                );
                setRemovedSuggestionIds((current) => [...current, person.id]);
                setConfirmedSuggestionIds((current) => current.filter((id) => id !== person.id));
                setExitingSuggestionIds((current) => current.filter((id) => id !== person.id));

                router.reload({
                    only: ['suggestions', 'pendingRequests'],
                    preserveScroll: true,
                    preserveState: true,
                });
            }, 560);
        } finally {
            setProcessingSuggestionIds((current) => current.filter((id) => id !== person.id));
        }
    };

    const sidebar = (
        <div className="space-y-4">
            {!isDiscover && (
                <div className="app-panel rounded-[28px] p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <TrendingUp className="h-4 w-4" strokeWidth={1.9} />
                        Trending now
                    </div>
                    <div className="mt-4 space-y-4">
                        {trends.map((trend) => (
                            <div key={trend.label}>
                                <div className="text-sm">#{trend.label}</div>
                                <div className="app-text-soft text-xs">{trend.posts}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

            {!isDiscover && (
                <div className="app-panel rounded-[28px] p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <UserPlus className="h-4 w-4" strokeWidth={1.9} />
                        Add people
                    </div>
                    <div className="mt-4 space-y-4">
                        {visibleSuggestions.length === 0 ? (
                            <div className="app-text-soft text-sm leading-6">
                                You’re caught up for now. As more people join your orbit, they’ll
                                show up here.
                            </div>
                        ) : (
                            visibleSuggestions.map((person) => {
                                const isProcessing = processingSuggestionIds.includes(person.id);
                                const isConfirmed = confirmedSuggestionIds.includes(person.id);
                                const isExiting = exitingSuggestionIds.includes(person.id);

                                return (
                                    <div
                                        key={person.id}
                                        className={`app-card-inset rounded-2xl p-3 transition-all duration-500 ${
                                            isExiting
                                                ? 'translate-y-2 scale-[0.98] opacity-0'
                                                : 'translate-y-0 scale-100 opacity-100'
                                        }`}
                                    >
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

                                            <button
                                                type="button"
                                                onClick={() => addSuggestion(person)}
                                                disabled={isProcessing || isConfirmed}
                                                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                                                    isConfirmed
                                                        ? 'app-panel-inset text-emerald-200'
                                                        : 'app-button-primary'
                                                } disabled:cursor-default disabled:opacity-100`}
                                                aria-label={
                                                    person.is_private
                                                        ? `Add ${person.name}`
                                                        : `Follow ${person.name}`
                                                }
                                            >
                                                {isConfirmed ? (
                                                    <Check className="h-4 w-4" strokeWidth={2.2} />
                                                ) : (
                                                    <UserPlus className="h-4 w-4" strokeWidth={2} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <AuthenticatedLayout title="Feed" sidebar={isDiscover ? null : sidebar}>
            <section className="space-y-6">
                {isDiscover ? (
                    <DiscoverExperience posts={feed.data} newPostId={newPostId} />
                ) : (
                    <>
                        <PostComposer compact />

                        <div className="space-y-4">
                            {feed.data.length === 0 ? (
                                <div className="app-dashed-panel app-text-muted rounded-[28px] p-8 text-sm">
                                    Nothing has landed here yet. Follow a few people, post an
                                    update, or switch to Discover to find voices worth bringing into
                                    your feed.
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
                    </>
                )}

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

function DiscoverExperience({ posts, newPostId }) {
    const [contentType, setContentType] = useState('all');
    const [languageFilter, setLanguageFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [topicFilter, setTopicFilter] = useState('all');
    const [fieldFilter, setFieldFilter] = useState('all');
    const topicOptions = Array.from(
        new Set(posts.flatMap((post) => inferTopicsFromPost(post)).filter(Boolean)),
    ).slice(0, 6);
    const fieldOptions = ['Design', 'Engineering', 'Product', 'Creative', 'General'];
    const filteredPosts = rankPosts(posts).filter((post) => {
        const language = guessLanguage(`${post.body ?? ''} ${(post.hashtags ?? []).join(' ')}`);
        const topics = inferTopicsFromPost(post);

        return (
            (languageFilter === 'all' || language === languageFilter) &&
            (dateFilter === 'all' || matchesDateFilter(post, dateFilter)) &&
            (topicFilter === 'all' || topics.includes(topicFilter))
        );
    });
    return (
        <div className="space-y-6">
            <section className="app-panel rounded-[32px] p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <Flame className="h-5 w-5" strokeWidth={1.9} />
                        Trending filters
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all', label: 'Everything' },
                            { key: 'posts', label: 'Posts' },
                            { key: 'people', label: 'People' },
                        ].map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                onClick={() => setContentType(option.key)}
                                className={`rounded-full px-4 py-2 text-sm ${
                                    contentType === option.key
                                        ? 'app-button-primary'
                                        : 'app-button-secondary'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <FilterGroup
                        label="Language"
                        value={languageFilter}
                        onChange={setLanguageFilter}
                        options={[
                            ['all', 'All'],
                            ['english', 'English'],
                            ['french', 'French'],
                            ['arabic', 'Arabic'],
                            ['other', 'Other'],
                        ]}
                    />
                    <FilterGroup
                        label="Date"
                        value={dateFilter}
                        onChange={setDateFilter}
                        options={[
                            ['all', 'Any time'],
                            ['today', 'Today'],
                            ['week', 'This week'],
                            ['month', 'This month'],
                        ]}
                    />
                    <FilterGroup
                        label="Topic"
                        value={topicFilter}
                        onChange={setTopicFilter}
                        options={[
                            ['all', 'All topics'],
                            ...topicOptions.map((topic) => [topic, `#${topic}`]),
                        ]}
                    />
                    <FilterGroup
                        label="Field"
                        value={fieldFilter}
                        onChange={setFieldFilter}
                        options={[
                            ['all', 'All fields'],
                            ...fieldOptions.map((field) => [field, field]),
                        ]}
                    />
                </div>
            </section>

            {(contentType === 'all' || contentType === 'posts') && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <TrendingUp className="h-5 w-5" strokeWidth={1.9} />
                        Trending posts
                    </div>
                    {filteredPosts.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[28px] p-8 text-sm">
                            No public posts match the current discovery filters.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPosts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    highlighted={Number(newPostId) === post.id}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

function FilterGroup({ label, value, onChange, options }) {
    return (
        <label className="space-y-2">
            <div className="app-text-soft text-xs font-medium uppercase tracking-[0.18em]">
                {label}
            </div>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="app-select-field w-full rounded-full px-4 py-3 text-sm"
            >
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
        </label>
    );
}

function rankPosts(posts) {
    return [...posts].sort((left, right) => {
        const leftScore =
            (left.likes_count ?? 0) * 2 +
            (left.comments_count ?? 0) * 3 +
            (left.reposts_count ?? 0) * 4;
        const rightScore =
            (right.likes_count ?? 0) * 2 +
            (right.comments_count ?? 0) * 3 +
            (right.reposts_count ?? 0) * 4;

        return rightScore - leftScore;
    });
}

function matchesDateFilter(post, filter) {
    const publishedAt = new Date(post.published_at ?? post.created_at ?? Date.now());
    const now = new Date();
    const diffMs = now.getTime() - publishedAt.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (filter === 'today') {
        return diffMs <= oneDay;
    }

    if (filter === 'week') {
        return diffMs <= oneDay * 7;
    }

    if (filter === 'month') {
        return diffMs <= oneDay * 31;
    }

    return true;
}

function inferTopicsFromPost(post) {
    if (post.hashtags?.length) {
        return post.hashtags.map((tag) => tag.toLowerCase());
    }

    const body = `${post.body ?? ''}`.toLowerCase();
    const matches = [
        ['design', ['design', 'ui', 'ux', 'brand']],
        ['startup', ['startup', 'launch', 'founder', 'product']],
        ['tech', ['code', 'dev', 'engineering', 'api', 'software']],
        ['creator', ['creator', 'content', 'audience', 'community']],
    ];

    return matches
        .filter(([, words]) => words.some((word) => body.includes(word)))
        .map(([topic]) => topic);
}

function guessLanguage(text) {
    if (/[\u0600-\u06FF]/.test(text)) {
        return 'arabic';
    }

    if (/[àâçéèêëîïôûùüÿœ]/i.test(text)) {
        return 'french';
    }

    if (/[a-z]/i.test(text)) {
        return 'english';
    }

    return 'other';
}
