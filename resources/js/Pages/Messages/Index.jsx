import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Copy,
    Ellipsis,
    Pencil,
    PenSquare,
    SendHorizonal,
    Trash2,
    User,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function Index({ conversations, activeConversation, contacts = [], messages }) {
    const { auth } = usePage().props;
    const [pickerOpen, setPickerOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [draft, setDraft] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editDraft, setEditDraft] = useState('');
    const [deletingMessageIds, setDeletingMessageIds] = useState([]);
    const [openMenuMessageId, setOpenMenuMessageId] = useState(null);
    const [localConversations, setLocalConversations] = useState(conversations);
    const [localMessages, setLocalMessages] = useState(messages);
    const messagesViewportRef = useRef(null);
    const messageMenuRef = useRef(null);
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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!messageMenuRef.current?.contains(event.target)) {
                setOpenMenuMessageId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    const beginEdit = (message) => {
        setEditingMessageId(message.id);
        setEditDraft(message.body);
    };

    const cancelEdit = () => {
        setEditingMessageId(null);
        setEditDraft('');
    };

    const copyMessage = async (body) => {
        if (!body || !navigator?.clipboard) {
            return;
        }

        try {
            await navigator.clipboard.writeText(body);
        } catch {
            // Swallow clipboard errors so the rest of the UI stays responsive.
        } finally {
            setOpenMenuMessageId(null);
        }
    };

    const saveEdit = (messageId) => {
        const body = editDraft.trim();

        if (!body || !displayedConversation) {
            return;
        }

        const previousMessages = localMessages;
        const previousConversations = localConversations;
        const editedAt = new Date().toISOString();

        setLocalMessages((current) =>
            current.map((message) =>
                message.id === messageId ? { ...message, body, updated_at: editedAt } : message,
            ),
        );
        setLocalConversations((current) =>
            current.map((conversation) =>
                conversation.id === displayedConversation.id &&
                conversation.latest_message?.id === messageId
                    ? {
                          ...conversation,
                          latest_message: {
                              ...conversation.latest_message,
                              body,
                              updated_at: editedAt,
                          },
                      }
                    : conversation,
            ),
        );
        setEditingMessageId(null);
        setEditDraft('');

        window.axios
            .patch(
                route('messages.messages.update', [displayedConversation.id, messageId]),
                { body },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            )
            .then(({ data }) => {
                setLocalMessages((current) =>
                    current.map((message) => (message.id === messageId ? data.message : message)),
                );
                setLocalConversations((current) =>
                    current.map((conversation) =>
                        conversation.id === data.conversation.id ? data.conversation : conversation,
                    ),
                );
            })
            .catch(() => {
                setLocalMessages(previousMessages);
                setLocalConversations(previousConversations);
                setEditingMessageId(messageId);
                setEditDraft(body);
            });
    };

    const openDeleteModal = (message) => {
        setMessageToDelete(message);
        setOpenMenuMessageId(null);
    };

    const closeDeleteModal = () => {
        if (messageToDelete && deletingMessageIds.includes(messageToDelete.id)) {
            return;
        }

        setMessageToDelete(null);
    };

    const confirmDeleteMessage = () => {
        const messageId = messageToDelete?.id;

        if (!messageId) {
            return;
        }

        if (!displayedConversation || deletingMessageIds.includes(messageId)) {
            return;
        }

        const previousMessages = localMessages;
        const previousConversations = localConversations;
        const nextMessages = localMessages.filter((message) => message.id !== messageId);
        const latestRemainingMessage = [...nextMessages].at(-1) ?? null;

        setDeletingMessageIds((current) => [...current, messageId]);
        setLocalMessages(nextMessages);
        setLocalConversations((current) =>
            current.map((conversation) =>
                conversation.id === displayedConversation.id
                    ? {
                          ...conversation,
                          latest_message: latestRemainingMessage,
                          latest_message_at: latestRemainingMessage?.created_at ?? null,
                      }
                    : conversation,
            ),
        );

        if (editingMessageId === messageId) {
            cancelEdit();
        }

        setOpenMenuMessageId(null);
        setMessageToDelete(null);

        window.axios
            .delete(route('messages.messages.destroy', [displayedConversation.id, messageId]), {
                headers: {
                    Accept: 'application/json',
                },
            })
            .then(({ data }) => {
                setLocalConversations((current) =>
                    current.map((conversation) =>
                        conversation.id === data.conversation.id ? data.conversation : conversation,
                    ),
                );
            })
            .catch(() => {
                setLocalMessages(previousMessages);
                setLocalConversations(previousConversations);
            })
            .finally(() => {
                setDeletingMessageIds((current) => current.filter((id) => id !== messageId));
            });
    };

    useEffect(() => {
        if (!messagesViewportRef.current) {
            return;
        }

        messagesViewportRef.current.scrollTop = messagesViewportRef.current.scrollHeight;
    }, [displayedConversation?.id, localMessages]);

    useEffect(() => {
        setOpenMenuMessageId(null);
    }, [displayedConversation?.id]);

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
                                        className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                                    >
                                        <User className="h-4 w-4" strokeWidth={1.9} />
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
                                    const isEditing = editingMessageId === message.id;
                                    const isDeleting = deletingMessageIds.includes(message.id);
                                    const timestamp = message.updated_at ?? message.created_at;
                                    const isEdited = Boolean(
                                        message.updated_at &&
                                        message.created_at &&
                                        message.updated_at !== message.created_at,
                                    );

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${own ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`relative max-w-[78%] rounded-[24px] px-3 py-2.5 text-sm leading-7 ${
                                                    own ? 'app-button-primary' : 'app-panel-inset'
                                                }`}
                                            >
                                                {!isEditing && (
                                                    <div
                                                        className="absolute right-3 top-3"
                                                        ref={
                                                            openMenuMessageId === message.id
                                                                ? messageMenuRef
                                                                : null
                                                        }
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setOpenMenuMessageId((current) =>
                                                                    current === message.id
                                                                        ? null
                                                                        : message.id,
                                                                )
                                                            }
                                                            className="text-current/75 inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-current"
                                                            aria-label="Message options"
                                                        >
                                                            <Ellipsis
                                                                className="h-4 w-4"
                                                                strokeWidth={1.9}
                                                            />
                                                        </button>
                                                        {openMenuMessageId === message.id && (
                                                            <div className="app-panel-inset absolute right-0 top-full z-20 mt-2 w-36 rounded-2xl p-2 shadow-[var(--vynce-shadow-md)]">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        copyMessage(message.body)
                                                                    }
                                                                    className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm"
                                                                >
                                                                    <Copy
                                                                        className="h-4 w-4"
                                                                        strokeWidth={1.9}
                                                                    />
                                                                    Copy
                                                                </button>
                                                                {own && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                beginEdit(message);
                                                                                setOpenMenuMessageId(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                            className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm"
                                                                        >
                                                                            <Pencil
                                                                                className="h-4 w-4"
                                                                                strokeWidth={1.9}
                                                                            />
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openDeleteModal(
                                                                                    message,
                                                                                )
                                                                            }
                                                                            disabled={isDeleting}
                                                                            className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-200 disabled:opacity-60"
                                                                        >
                                                                            <Trash2
                                                                                className="h-4 w-4"
                                                                                strokeWidth={1.9}
                                                                            />
                                                                            Delete
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {isEditing ? (
                                                    <div className="relative -mx-1.5 -my-1">
                                                        <button
                                                            type="button"
                                                            onClick={cancelEdit}
                                                            className="text-current/80 absolute left-0 top-0 inline-flex h-7 w-7 items-center justify-center transition hover:text-current"
                                                            aria-label="Cancel edit"
                                                        >
                                                            <ArrowLeft
                                                                className="h-4 w-4"
                                                                strokeWidth={1.9}
                                                            />
                                                        </button>
                                                        <textarea
                                                            value={editDraft}
                                                            onChange={(event) =>
                                                                setEditDraft(event.target.value)
                                                            }
                                                            className="app-scrollbar-hidden min-h-20 w-full resize-none overflow-y-auto border-0 bg-transparent pb-12 pl-10 pr-16 text-sm focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0"
                                                            style={{
                                                                outline: 'none',
                                                                boxShadow: 'none',
                                                            }}
                                                        />
                                                        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs">
                                                            <button
                                                                type="button"
                                                                onClick={() => saveEdit(message.id)}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/15"
                                                                aria-label="Save edit"
                                                            >
                                                                <Check
                                                                    className="h-4 w-4"
                                                                    strokeWidth={1.9}
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="whitespace-pre-wrap break-all pr-10">
                                                        {message.body}
                                                    </div>
                                                )}
                                                {!isEditing && (
                                                    <div className="app-text-soft mt-2 flex items-center gap-2 text-xs">
                                                        {isEdited && (
                                                            <span className="bg-white/8 text-current/75 rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.16em]">
                                                                Edited
                                                            </span>
                                                        )}
                                                        <span>
                                                            {new Date(timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
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

            <Modal show={Boolean(messageToDelete)} onClose={closeDeleteModal} maxWidth="md">
                <div className="space-y-5 p-6">
                    <div>
                        <div className="text-lg font-semibold">Delete message?</div>
                        <p className="app-text-soft mt-2 text-sm leading-6">
                            This message will be removed from the conversation for everyone.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeDeleteModal}
                            disabled={Boolean(
                                messageToDelete && deletingMessageIds.includes(messageToDelete.id),
                            )}
                            className="app-button-secondary rounded-full px-4 py-2 text-sm disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteMessage}
                            disabled={Boolean(
                                messageToDelete && deletingMessageIds.includes(messageToDelete.id),
                            )}
                            className="app-button-primary rounded-full px-4 py-2 text-sm disabled:opacity-60"
                        >
                            Delete
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
            .toUpperCase() ?? 'DM'
    );
}
