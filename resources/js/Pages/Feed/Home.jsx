import { Link, router, usePage } from '@inertiajs/react';
import {
    Check,
    Flame,
    MessageCircle,
    SendHorizonal,
    TrendingUp,
    UserRoundPlus,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PostCard from '@/Components/App/PostCard';
import PostComposer from '@/Components/App/PostComposer';
import useLiveInertiaReload from '@/hooks/useLiveInertiaReload';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const trends = [
    { label: 'Design systems', posts: '1,284 posts today' },
    { label: 'Launch notes', posts: '842 posts today' },
    { label: 'Creator workflow', posts: '511 posts today' },
];

export default function Home({ feed, activeTab, suggestions = [], messages = [] }) {
    const page = usePage();
    const { auth } = page.props;
    const { flash } = page.props;
    const pageUrl = page.url;
    const newPostId = flash?.new_post_id;
    const [targetPostId, setTargetPostId] = useState(null);
    const [targetCommentsOpen, setTargetCommentsOpen] = useState(false);
    const [messagesOpen, setMessagesOpen] = useState(false);
    const [activeThread, setActiveThread] = useState(null);
    const [activeThreadMessages, setActiveThreadMessages] = useState([]);
    const [loadingThreadId, setLoadingThreadId] = useState(null);
    const [threadDraft, setThreadDraft] = useState('');
    const [threadSending, setThreadSending] = useState(false);
    const threadComposerRef = useRef(null);
    const [recentThreads, setRecentThreads] = useState(messages);
    const isDiscover = activeTab === 'discover';
    const [visibleSuggestions, setVisibleSuggestions] = useState(suggestions);
    const [processingSuggestionIds, setProcessingSuggestionIds] = useState([]);
    const [confirmedSuggestionIds, setConfirmedSuggestionIds] = useState([]);
    const [exitingSuggestionIds, setExitingSuggestionIds] = useState([]);
    const [removedSuggestionIds, setRemovedSuggestionIds] = useState([]);

    useLiveInertiaReload(['feed', 'messages', 'topbar'], 5000);

    useEffect(() => {
        setVisibleSuggestions(
            suggestions.filter((person) => !removedSuggestionIds.includes(person.id)),
        );
    }, [suggestions, removedSuggestionIds]);

    useEffect(() => {
        setRecentThreads(messages);
    }, [messages]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const search = new URLSearchParams(window.location.search);
        const requestedPostId = Number(search.get('post'));

        setTargetPostId(
            Number.isFinite(requestedPostId) && requestedPostId > 0 ? requestedPostId : null,
        );
        setTargetCommentsOpen(search.get('comments') === '1');
        setMessagesOpen(false);
        setActiveThread(null);
        setActiveThreadMessages([]);
        setLoadingThreadId(null);
        setThreadDraft('');
        setThreadSending(false);
    }, [pageUrl]);

    useEffect(() => {
        if (!messagesOpen) {
            setActiveThread(null);
            setActiveThreadMessages([]);
            setLoadingThreadId(null);
            setThreadDraft('');
            setThreadSending(false);
        }
    }, [messagesOpen]);

    useEffect(() => {
        const textarea = threadComposerRef.current;

        if (!textarea) {
            return;
        }

        textarea.style.height = '0px';
        const nextHeight = Math.min(textarea.scrollHeight, 112);
        textarea.style.height = `${Math.max(nextHeight, 36)}px`;
    }, [threadDraft, activeThread?.id, messagesOpen]);

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
                    only: ['suggestions'],
                    preserveScroll: true,
                    preserveState: true,
                });
            }, 560);
        } finally {
            setProcessingSuggestionIds((current) => current.filter((id) => id !== person.id));
        }
    };

    const openThread = async (conversation) => {
        if (!conversation?.id) {
            return;
        }

        if (activeThread?.id === conversation.id) {
            setMessagesOpen(true);
            return;
        }

        setMessagesOpen(true);
        setLoadingThreadId(conversation.id);

        try {
            const { data } = await window.axios.get(route('messages.show', conversation.id), {
                headers: {
                    Accept: 'application/json',
                },
            });

            const nextConversation = data.conversation ?? conversation;
            setActiveThread(nextConversation);
            setActiveThreadMessages(data.messages ?? []);
            setThreadDraft('');
            setRecentThreads((current) => [
                nextConversation,
                ...current.filter((item) => item.id !== nextConversation.id),
            ]);
        } catch {
            setActiveThread(conversation);
            setActiveThreadMessages([]);
        } finally {
            setLoadingThreadId(null);
        }
    };

    const closeThread = () => {
        setActiveThread(null);
        setActiveThreadMessages([]);
        setThreadDraft('');
        setThreadSending(false);
    };

    const sendThreadMessage = async (event) => {
        event.preventDefault();

        const body = threadDraft.trim();

        if (!activeThread || !body || threadSending) {
            return;
        }

        const temporaryId = `temp-${Date.now()}`;
        const optimisticMessage = {
            id: temporaryId,
            body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            attachment: null,
            sender: {
                id: auth.user.id,
                name: auth.user.name,
                username: auth.user.username,
            },
        };
        const previousMessages = activeThreadMessages;

        setThreadDraft('');
        setThreadSending(true);
        setActiveThreadMessages((current) => [...current, optimisticMessage]);

        try {
            const { data } = await window.axios.post(
                route('messages.messages.store', activeThread.id),
                { body },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            setActiveThreadMessages((current) =>
                current.map((message) => (message.id === temporaryId ? data.message : message)),
            );
            const nextConversation = data.conversation ?? activeThread;
            setActiveThread(nextConversation);
            setRecentThreads((current) => [
                nextConversation,
                ...current.filter((item) => item.id !== nextConversation.id),
            ]);
        } catch {
            setActiveThreadMessages(previousMessages);
            setThreadDraft(body);
        } finally {
            setThreadSending(false);
        }
    };

    const handleThreadDraftChange = (event) => {
        setThreadDraft(event.target.value);
    };

    const sidebar = (
        <div className="flex flex-col space-y-3 min-[1246px]:min-h-[calc(100vh-3rem)] min-[1246px]:justify-center 2xl:space-y-4">
            {!isDiscover && (
                <div className="app-panel rounded-[24px] p-4 2xl:rounded-[28px] 2xl:p-5">
                    <div className="flex items-center gap-2 text-[13px] font-semibold 2xl:text-sm">
                        <TrendingUp className="h-4 w-4" strokeWidth={1.9} />
                        Trending now
                    </div>
                    <div className="mt-3 space-y-3 2xl:mt-4 2xl:space-y-4">
                        {trends.map((trend) => (
                            <div key={trend.label}>
                                <div className="text-[13px] 2xl:text-sm">#{trend.label}</div>
                                <div className="app-text-soft text-[11px] 2xl:text-xs">
                                    {trend.posts}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isDiscover && (
                <div className="app-panel rounded-[24px] p-4 2xl:rounded-[28px] 2xl:p-5">
                    <div className="flex items-center gap-2 text-[13px] font-semibold 2xl:text-sm">
                        <UserRoundPlus className="h-4 w-4" strokeWidth={1.9} />
                        Add people
                    </div>
                    <div className="mt-3 space-y-3 2xl:mt-4 2xl:space-y-4">
                        {visibleSuggestions.length === 0 ? (
                            <div className="app-text-soft text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
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
                                        className={`app-card-inset rounded-[18px] p-2.5 transition-all duration-500 2xl:rounded-2xl 2xl:p-3 ${
                                            isExiting
                                                ? 'translate-y-2 scale-[0.98] opacity-0'
                                                : 'translate-y-0 scale-100 opacity-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={route('users.show', person.username)}
                                                className="flex min-w-0 flex-1 items-start gap-3 rounded-[18px] transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                            >
                                                {person.avatar_url ? (
                                                    <img
                                                        src={person.avatar_url}
                                                        alt={person.name}
                                                        className="h-10 w-10 rounded-[18px] object-cover 2xl:h-12 2xl:w-12 2xl:rounded-2xl"
                                                        style={{
                                                            objectPosition: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                            transform: `scale(${person.avatar_zoom})`,
                                                            transformOrigin: `${person.avatar_position_x}% ${person.avatar_position_y}%`,
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="app-avatar-fallback flex h-10 w-10 items-center justify-center rounded-[18px] text-[11px] font-semibold 2xl:h-12 2xl:w-12 2xl:rounded-2xl 2xl:text-xs">
                                                        {initialsFor(person.name)}
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-[13px] font-medium leading-5 2xl:text-sm 2xl:leading-6">
                                                        {person.name}
                                                    </div>
                                                    <div className="app-text-muted mt-0.5 truncate text-[11px] 2xl:text-xs">
                                                        @{person.username}
                                                    </div>
                                                </div>
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => addSuggestion(person)}
                                                disabled={isProcessing || isConfirmed}
                                                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 2xl:h-10 2xl:w-10 ${
                                                    isConfirmed
                                                        ? 'app-panel-inset text-emerald-200'
                                                        : 'app-button-primary'
                                                } disabled:opacity-100`}
                                                aria-label={
                                                    person.is_private
                                                        ? `Add ${person.name}`
                                                        : `Follow ${person.name}`
                                                }
                                            >
                                                {isConfirmed ? (
                                                    <Check className="h-4 w-4" strokeWidth={2.2} />
                                                ) : (
                                                    <UserRoundPlus
                                                        className="h-4 w-4"
                                                        strokeWidth={2}
                                                    />
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

            {!isDiscover && (
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setMessagesOpen((current) => !current)}
                        className="app-panel flex w-full items-center justify-between rounded-[22px] px-3.5 py-2.5 text-[12px] font-semibold transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 2xl:rounded-[24px] 2xl:px-4 2xl:py-3 2xl:text-[13px]"
                        aria-haspopup="true"
                        aria-expanded={messagesOpen}
                    >
                        <span className="flex items-center gap-2">
                            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.9} />
                            Messages
                        </span>
                        {page.props?.topbar?.unread_messages_count > 0 ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[rgba(244,91,105,0.96)] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(244,91,105,0.32)] 2xl:text-[11px]">
                                {page.props?.topbar?.unread_messages_count}
                            </span>
                        ) : (
                            <span className="app-text-soft text-[10px] font-medium 2xl:text-[11px]">
                                Open
                            </span>
                        )}
                    </button>

                    {messagesOpen ? (
                        <div className="app-panel absolute bottom-full left-0 right-0 z-20 mb-3 rounded-[20px] bg-[var(--vynce-bg-strong)] p-2.5 2xl:rounded-[22px] 2xl:p-3">
                            {activeThread ? (
                                <div className="flex max-h-[20rem] flex-col">
                                    <div className="flex items-center gap-2 px-1 pb-2 text-[11px] font-semibold 2xl:text-[12px]">
                                        <button
                                            type="button"
                                            onClick={closeThread}
                                            className="app-text-soft transition hover:text-white/90"
                                        >
                                            Back
                                        </button>
                                        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                                            {activeThread.participant?.avatar_url ? (
                                                <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full 2xl:h-6 2xl:w-6">
                                                    <img
                                                        src={activeThread.participant.avatar_url}
                                                        alt={activeThread.participant?.name}
                                                        className="h-full w-full object-cover"
                                                        style={{
                                                            objectPosition: `${activeThread.participant.avatar_position_x}% ${activeThread.participant.avatar_position_y}%`,
                                                            transform: `scale(${activeThread.participant.avatar_zoom})`,
                                                            transformOrigin: `${activeThread.participant.avatar_position_x}% ${activeThread.participant.avatar_position_y}%`,
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="app-avatar-fallback flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold 2xl:h-6 2xl:w-6 2xl:text-[9px]">
                                                    {initialsFor(activeThread.participant?.name)}
                                                </div>
                                            )}
                                            <div className="truncate text-[11px] font-semibold 2xl:text-[12px]">
                                                {activeThread.participant?.name ?? 'Conversation'}
                                            </div>
                                        </div>
                                        <Link
                                            href={route('messages.index')}
                                            className="app-text-soft text-[10px] font-medium transition hover:text-white/90 2xl:text-[11px]"
                                        >
                                            View all
                                        </Link>
                                    </div>

                                    <div className="app-panel-inset app-scrollbar-hidden min-h-0 flex-1 overflow-y-auto rounded-[18px] px-2.5 pb-2.5 pt-3 2xl:rounded-[20px] 2xl:px-3 2xl:pb-3 2xl:pt-4">
                                        {loadingThreadId === activeThread.id ? (
                                            <div className="app-text-soft text-[11px] 2xl:text-[12px]">
                                                Loading thread...
                                            </div>
                                        ) : activeThreadMessages.length === 0 ? (
                                            <div className="app-text-soft text-[11px] 2xl:text-[12px]">
                                                No messages in this conversation yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {activeThreadMessages.map((message) => {
                                                    const isOwn =
                                                        message.sender?.id === auth?.user?.id;

                                                    return (
                                                        <div
                                                            key={message.id}
                                                            className={`flex pt-1 first:pt-0 ${
                                                                isOwn
                                                                    ? 'justify-end'
                                                                    : 'justify-start'
                                                            }`}
                                                        >
                                                            <div
                                                                className={`max-w-[84%] rounded-[16px] px-2.5 py-1.5 text-[11px] leading-4 2xl:text-[12px] 2xl:leading-5 ${
                                                                    isOwn
                                                                        ? 'bg-[rgba(120,88,166,0.72)] text-white'
                                                                        : 'bg-[rgba(193,172,230,0.28)] text-[rgba(255,255,255,0.95)]'
                                                                }`}
                                                            >
                                                                {message.body}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <form onSubmit={sendThreadMessage} className="relative mt-2">
                                        <textarea
                                            ref={threadComposerRef}
                                            value={threadDraft}
                                            onChange={handleThreadDraftChange}
                                            rows={1}
                                            className="field app-scrollbar-hidden min-h-9 w-full resize-none overflow-y-auto pb-2.5 pr-10 pt-2 text-[11px] leading-4 2xl:pr-12 2xl:text-[12px] 2xl:leading-5"
                                            placeholder={`Message ${activeThread.participant?.name ?? 'conversation'}...`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={threadSending || !threadDraft.trim()}
                                            className="absolute right-2 top-[43%] inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-none bg-transparent p-0 text-[var(--vynce-text-muted)] shadow-none transition hover:text-white disabled:opacity-60 2xl:right-1 2xl:h-8 2xl:w-8"
                                            aria-label="Send message"
                                        >
                                            <SendHorizonal
                                                className="h-3.5 w-3.5"
                                                strokeWidth={1.9}
                                            />
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between gap-2 px-1 pb-2 text-[11px] font-semibold 2xl:text-[12px]">
                                        <span>Recent chats</span>
                                        <Link
                                            href={route('messages.index')}
                                            className="app-text-soft text-[10px] font-medium transition hover:text-white/90 2xl:text-[11px]"
                                        >
                                            View all
                                        </Link>
                                    </div>
                                    <div className="max-h-[11rem] space-y-2 overflow-y-auto pr-1 app-scrollbar-hidden">
                                        {recentThreads.length === 0 ? (
                                            <div className="app-text-soft px-1 text-[11px] leading-4 2xl:text-[12px] 2xl:leading-5">
                                                No conversations yet. Start one from a profile to
                                                see it here.
                                            </div>
                                        ) : (
                                            recentThreads.map((conversation) => {
                                                const isLoading =
                                                    loadingThreadId === conversation.id;

                                                return (
                                                    <button
                                                        key={conversation.id}
                                                        type="button"
                                                        onClick={() => openThread(conversation)}
                                                        className="app-card-inset block w-full rounded-[16px] p-2 text-left transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 2xl:rounded-[18px] 2xl:p-2.5"
                                                        title={
                                                            conversation.participant?.name ??
                                                            'Unknown user'
                                                        }
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="relative h-8 w-8 shrink-0 2xl:h-9 2xl:w-9">
                                                                {conversation.participant
                                                                    ?.avatar_url ? (
                                                                    <div className="h-8 w-8 overflow-hidden rounded-[14px] 2xl:h-9 2xl:w-9 2xl:rounded-[16px]">
                                                                        <img
                                                                            src={
                                                                                conversation
                                                                                    .participant
                                                                                    .avatar_url
                                                                            }
                                                                            alt={
                                                                                conversation
                                                                                    .participant
                                                                                    ?.name
                                                                            }
                                                                            className="h-full w-full object-cover"
                                                                            style={{
                                                                                objectPosition: `${conversation.participant.avatar_position_x}% ${conversation.participant.avatar_position_y}%`,
                                                                                transform: `scale(${conversation.participant.avatar_zoom})`,
                                                                                transformOrigin: `${conversation.participant.avatar_position_x}% ${conversation.participant.avatar_position_y}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="app-avatar-fallback flex h-8 w-8 items-center justify-center rounded-[14px] text-[10px] font-semibold 2xl:h-9 2xl:w-9 2xl:rounded-[16px] 2xl:text-[11px]">
                                                                        {initialsFor(
                                                                            conversation.participant
                                                                                ?.name,
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {conversation.unread_messages_count >
                                                                0 ? (
                                                                    <div className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-[rgba(244,91,105,0.96)] px-1 py-0.5 text-[9px] font-semibold text-white shadow-[0_8px_18px_rgba(244,91,105,0.32)]">
                                                                        {
                                                                            conversation.unread_messages_count
                                                                        }
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="truncate text-[11px] font-semibold 2xl:text-[12px]">
                                                                    {conversation.participant
                                                                        ?.name ?? 'Unknown user'}
                                                                </div>
                                                                <div className="app-text-soft mt-0.5 truncate text-[10px] 2xl:text-[11px]">
                                                                    {conversation.latest_message
                                                                        ?.sender?.id ===
                                                                    auth?.user?.id
                                                                        ? 'You: '
                                                                        : ''}
                                                                    {conversation.latest_message
                                                                        ?.body ?? 'No messages yet'}
                                                                </div>
                                                            </div>
                                                            {isLoading ? (
                                                                <div className="app-text-soft text-[9px] font-medium">
                                                                    Opening...
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );

    return (
        <AuthenticatedLayout title="Feed" sidebar={isDiscover ? null : sidebar}>
            <section className="space-y-5 2xl:space-y-6">
                {isDiscover ? (
                    <DiscoverExperience
                        posts={feed.data}
                        newPostId={newPostId}
                        targetPostId={targetPostId}
                        targetCommentsOpen={targetCommentsOpen}
                    />
                ) : (
                    <>
                        <PostComposer compact />

                        <div className="space-y-3 2xl:space-y-4">
                            {feed.data.length === 0 ? (
                                <div className="app-dashed-panel app-text-muted rounded-[24px] p-6 text-[13px] 2xl:rounded-[28px] 2xl:p-8 2xl:text-sm">
                                    Nothing has landed here yet. Follow a few people, post an
                                    update, or switch to Discover to find voices worth bringing into
                                    your feed.
                                </div>
                            ) : (
                                feed.data.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        highlighted={
                                            Number(newPostId) === post.id ||
                                            targetPostId === post.id
                                        }
                                        openCommentsByDefault={
                                            targetCommentsOpen && targetPostId === post.id
                                        }
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
                            className="app-button-secondary inline-flex rounded-full px-4 py-2.5 text-[13px] 2xl:px-5 2xl:py-3 2xl:text-sm"
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

function DiscoverExperience({ posts, newPostId, targetPostId, targetCommentsOpen }) {
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
        <div className="space-y-4 2xl:space-y-6">
            <section className="app-panel rounded-[24px] p-4 2xl:rounded-[32px] 2xl:p-6">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between 2xl:gap-4">
                    <div className="flex items-center gap-2 text-[15px] font-semibold 2xl:text-lg">
                        <Flame className="h-4 w-4 2xl:h-5 2xl:w-5" strokeWidth={1.9} />
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
                                className={`rounded-full px-3 py-1.5 text-[12px] 2xl:px-4 2xl:py-2 2xl:text-sm ${
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
                <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4 2xl:mt-5 2xl:gap-3">
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
                <section className="space-y-3 2xl:space-y-4">
                    <div className="flex items-center gap-2 text-[15px] font-semibold 2xl:text-lg">
                        <TrendingUp className="h-4 w-4 2xl:h-5 2xl:w-5" strokeWidth={1.9} />
                        Trending posts
                    </div>
                    {filteredPosts.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[24px] p-6 text-[13px] 2xl:rounded-[28px] 2xl:p-8 2xl:text-sm">
                            No public posts match the current discovery filters.
                        </div>
                    ) : (
                        <div className="space-y-3 2xl:space-y-4">
                            {filteredPosts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    highlighted={
                                        Number(newPostId) === post.id || targetPostId === post.id
                                    }
                                    openCommentsByDefault={
                                        targetCommentsOpen && targetPostId === post.id
                                    }
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
        <label className="space-y-1.5 2xl:space-y-2">
            <div className="app-text-soft text-[10px] font-medium uppercase tracking-[0.18em] 2xl:text-xs">
                {label}
            </div>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="app-select-field w-full rounded-full px-3 py-2 text-[12px] 2xl:px-4 2xl:py-3 2xl:text-sm"
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
