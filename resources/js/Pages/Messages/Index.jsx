import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, PenSquare, SendHorizonal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function Index({ conversations, activeConversation, contacts = [], messages }) {
    const { auth } = usePage().props;
    const [pickerOpen, setPickerOpen] = useState(false);
    const [draft, setDraft] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [localConversations, setLocalConversations] = useState(conversations);
    const [localMessages, setLocalMessages] = useState(messages);
    const messagesViewportRef = useRef(null);
    const optimisticMessageIdRef = useRef(0);
    const conversationParticipantIds = useMemo(
        () =>
            localConversations.map((conversation) => conversation.participant?.id).filter(Boolean),
        [localConversations],
    );
    const availableContacts = useMemo(
        () => contacts.filter((contact) => !conversationParticipantIds.includes(contact.id)),
        [contacts, conversationParticipantIds],
    );
    const displayedConversation = useMemo(
        () =>
            localConversations.find((conversation) => conversation.id === activeConversation?.id) ??
            activeConversation,
        [activeConversation, localConversations],
    );

    useEffect(() => {
        setLocalConversations(conversations);
    }, [conversations]);

    useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    const goBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        router.visit(route('feed.home'));
    };

    const submit = (event) => {
        event.preventDefault();
        const body = draft.trim();

        if (!activeConversation || !body || isSending) {
            return;
        }

        const temporaryId = `temp-${++optimisticMessageIdRef.current}`;
        const optimisticMessage = {
            id: temporaryId,
            body,
            created_at: new Date().toISOString(),
            sender: {
                id: auth.user.id,
                name: auth.user.name,
                username: auth.user.username,
            },
        };
        const previousMessages = localMessages;
        const previousConversations = localConversations;

        setDraft('');
        setIsSending(true);
        setLocalMessages((current) => [...current, optimisticMessage]);
        setLocalConversations((current) =>
            current.map((conversation) =>
                conversation.id === activeConversation.id
                    ? {
                          ...conversation,
                          latest_message: optimisticMessage,
                          latest_message_at: optimisticMessage.created_at,
                      }
                    : conversation,
            ),
        );

        window.axios
            .post(
                route('messages.messages.store', activeConversation.id),
                { body },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            )
            .then(({ data }) => {
                setLocalMessages((current) =>
                    current.map((message) => (message.id === temporaryId ? data.message : message)),
                );
                setLocalConversations((current) => {
                    const updated = current.map((conversation) =>
                        conversation.id === data.conversation.id ? data.conversation : conversation,
                    );
                    const active = updated.find(
                        (conversation) => conversation.id === data.conversation.id,
                    );

                    return active
                        ? [
                              active,
                              ...updated.filter((conversation) => conversation.id !== active.id),
                          ]
                        : updated;
                });
            })
            .catch(() => {
                setLocalMessages(previousMessages);
                setLocalConversations(previousConversations);
                setDraft(body);
            })
            .finally(() => {
                setIsSending(false);
            });
    };

    const startConversation = (contactId) => {
        router.post(route('messages.start', contactId), {}, { preserveScroll: true });
        setPickerOpen(false);
    };

    useEffect(() => {
        if (!messagesViewportRef.current) {
            return;
        }

        messagesViewportRef.current.scrollTop = messagesViewportRef.current.scrollHeight;
    }, [displayedConversation?.id, localMessages]);

    return (
        <AuthenticatedLayout title="Messages">
            <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
                <section className="app-panel rounded-[32px] p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <button
                            type="button"
                            onClick={goBack}
                            className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={() => setPickerOpen(true)}
                            className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                        >
                            <PenSquare className="h-4 w-4" strokeWidth={1.9} />
                            New
                        </button>
                    </div>

                    <div className="mb-4">
                        <h1 className="text-xl font-semibold">Messages</h1>
                    </div>

                    {localConversations.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[28px] p-5 text-sm leading-6">
                            No conversations yet. Visit a profile and tap Message to open a direct
                            chat.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {localConversations.map((conversation) => (
                                <Link
                                    key={conversation.id}
                                    href={route('messages.show', conversation.id)}
                                    className={`block rounded-[24px] p-4 transition ${
                                        displayedConversation?.id === conversation.id
                                            ? 'border border-[rgba(196,177,232,0.9)] bg-[rgba(120,88,166,0.22)] shadow-[0_0_0_1px_rgba(214,198,242,0.45),0_0_24px_rgba(144,114,204,0.18)]'
                                            : 'app-card-inset border border-white/5 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)]'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="app-avatar-fallback flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold">
                                            {initialsFor(conversation.participant?.name)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-semibold">
                                                {conversation.participant?.name ?? 'Unknown user'}
                                            </div>
                                            <div className="app-text-soft mt-2 truncate text-sm">
                                                {conversation.latest_message?.sender?.id ===
                                                auth.user.id
                                                    ? 'You: '
                                                    : ''}
                                                {conversation.latest_message?.body ??
                                                    'No messages yet'}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                <section className="app-panel flex min-h-[420px] flex-col rounded-[32px] p-5 xl:h-[calc(100vh-3rem)]">
                    {!displayedConversation ? (
                        <div className="app-dashed-panel app-text-muted flex min-h-[420px] flex-1 items-center justify-center rounded-[28px] p-8 text-center text-sm leading-7">
                            Pick a conversation from the left, or start one from a user profile.
                        </div>
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="app-panel-inset mb-5 flex items-center gap-3 rounded-[24px] px-4 py-4">
                                <div className="app-avatar-fallback flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold">
                                    {initialsFor(displayedConversation.participant?.name)}
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate font-semibold">
                                        {displayedConversation.participant?.name}
                                    </div>
                                    <div className="app-text-soft truncate text-sm">
                                        @{displayedConversation.participant?.username}
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    <Link
                                        href={route(
                                            'users.show',
                                            displayedConversation.participant?.username,
                                        )}
                                        className="app-button-secondary rounded-full px-4 py-2 text-sm"
                                    >
                                        View profile
                                    </Link>
                                </div>
                            </div>

                            <div
                                ref={messagesViewportRef}
                                className="app-scrollbar-hidden flex-1 space-y-3 overflow-y-auto pr-1"
                            >
                                {localMessages.map((message) => {
                                    const own = message.sender?.id === auth.user.id;

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${own ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[78%] rounded-[24px] px-4 py-3 text-sm leading-7 ${
                                                    own ? 'app-button-primary' : 'app-panel-inset'
                                                }`}
                                            >
                                                <div className="whitespace-pre-wrap break-all">
                                                    {message.body}
                                                </div>
                                                <div className="app-text-soft mt-2 text-xs">
                                                    {new Date(message.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <form onSubmit={submit} className="relative mt-5">
                                <textarea
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    className="field app-scrollbar-hidden min-h-24 w-full resize-none overflow-y-auto pr-16 text-sm"
                                    placeholder={`Message ${displayedConversation.participant?.name}...`}
                                />
                                <button
                                    type="submit"
                                    disabled={isSending || !draft.trim()}
                                    className="app-button-primary absolute bottom-4 right-3 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full disabled:opacity-60"
                                    aria-label="Send message"
                                >
                                    <SendHorizonal className="h-4 w-4" strokeWidth={1.9} />
                                </button>
                            </form>
                        </div>
                    )}
                </section>
            </div>

            <Modal show={pickerOpen} onClose={() => setPickerOpen(false)} maxWidth="md">
                <div className="space-y-5 p-6">
                    <div>
                        <div className="text-lg font-semibold">Start a new conversation</div>
                        <p className="app-text-soft mt-2 text-sm leading-6">
                            Pick one of your contacts to open a direct chat.
                        </p>
                    </div>

                    {availableContacts.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[24px] p-5 text-sm">
                            You’ve already started conversations with all available contacts.
                        </div>
                    ) : (
                        <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1">
                            {availableContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    type="button"
                                    onClick={() => startConversation(contact.id)}
                                    className="app-card-inset flex w-full items-center gap-3 rounded-[24px] p-4 text-left transition hover:bg-[var(--vynce-surface-muted)]"
                                >
                                    {contact.avatar_url ? (
                                        <img
                                            src={contact.avatar_url}
                                            alt={contact.name}
                                            className="h-11 w-11 rounded-2xl object-cover"
                                        />
                                    ) : (
                                        <div className="app-avatar-fallback flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold">
                                            {initialsFor(contact.name)}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold">
                                            {contact.name}
                                        </div>
                                        <div className="app-text-soft truncate text-xs">
                                            @{contact.username}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
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
            .toUpperCase() ?? 'DM'
    );
}
