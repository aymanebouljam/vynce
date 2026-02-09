import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Copy,
    Ellipsis,
    Eraser,
    File,
    Image as ImageIcon,
    Paperclip,
    Pencil,
    PenSquare,
    SendHorizonal,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ conversations, activeConversation, contacts = [], messages }) {
    const { auth } = usePage().props;
    const [activeConversationId, setActiveConversationId] = useState(
        activeConversation?.id ?? null,
    );
    const [pickerOpen, setPickerOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [conversationToDelete, setConversationToDelete] = useState(null);
    const [conversationToClear, setConversationToClear] = useState(null);
    const [draft, setDraft] = useState('');
    const [draftAttachment, setDraftAttachment] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editDraft, setEditDraft] = useState('');
    const [deletingMessageIds, setDeletingMessageIds] = useState([]);
    const [openMenuMessageId, setOpenMenuMessageId] = useState(null);
    const [openConversationMenuId, setOpenConversationMenuId] = useState(null);
    const [clearingConversationIds, setClearingConversationIds] = useState([]);
    const [deletingConversationIds, setDeletingConversationIds] = useState([]);
    const [localConversations, setLocalConversations] = useState(conversations);
    const [localMessages, setLocalMessages] = useState(messages);
    const messagesViewportRef = useRef(null);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const messageMenuRef = useRef(null);
    const conversationMenuRef = useRef(null);
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
    const sortedConversations = useMemo(
        () =>
            [...localConversations].sort((left, right) => {
                const leftTime = left.latest_message_at
                    ? new Date(left.latest_message_at).getTime()
                    : 0;
                const rightTime = right.latest_message_at
                    ? new Date(right.latest_message_at).getTime()
                    : 0;

                return rightTime - leftTime;
            }),
        [localConversations],
    );
    const displayedConversation = useMemo(
        () =>
            localConversations.find((conversation) => conversation.id === activeConversationId) ??
            null,
        [activeConversationId, localConversations],
    );

    useEffect(() => {
        setActiveConversationId(activeConversation?.id ?? null);
    }, [activeConversation?.id]);

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

            if (!conversationMenuRef.current?.contains(event.target)) {
                setOpenConversationMenuId(null);
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

        if (!displayedConversation || (!body && !draftAttachment) || isSending) {
            return;
        }

        const temporaryId = `temp-${++optimisticMessageIdRef.current}`;
        const formData = new FormData();
        const attachmentPreviewUrl = draftAttachment?.previewUrl ?? null;
        const optimisticMessage = {
            id: temporaryId,
            body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            attachment: draftAttachment
                ? {
                      url: draftAttachment.previewUrl,
                      name: draftAttachment.name,
                      mime_type: draftAttachment.mimeType,
                      size: draftAttachment.size,
                      is_image: draftAttachment.isImage,
                  }
                : null,
            sender: {
                id: auth.user.id,
                name: auth.user.name,
                username: auth.user.username,
            },
        };
        const previousMessages = localMessages;
        const previousConversations = localConversations;
        const previousDraftAttachment = draftAttachment;

        formData.append('body', body);

        if (draftAttachment?.file) {
            formData.append('attachment', draftAttachment.file);
        }

        setDraft('');
        setDraftAttachment(null);
        setIsSending(true);
        setLocalMessages((current) => [...current, optimisticMessage]);
        setLocalConversations((current) =>
            current.map((conversation) =>
                conversation.id === displayedConversation.id
                    ? {
                          ...conversation,
                          latest_message: optimisticMessage,
                          latest_message_at: optimisticMessage.created_at,
                      }
                    : conversation,
            ),
        );

        window.axios
            .post(route('messages.messages.store', displayedConversation.id), formData, {
                headers: {
                    Accept: 'application/json',
                },
            })
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

                if (attachmentPreviewUrl) {
                    URL.revokeObjectURL(attachmentPreviewUrl);
                }
            })
            .catch(() => {
                setLocalMessages(previousMessages);
                setLocalConversations(previousConversations);
                setDraft(body);
                setDraftAttachment(previousDraftAttachment);
            })
            .finally(() => {
                setIsSending(false);
            });
    };

    const selectDraftAttachment = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (draftAttachment?.previewUrl) {
            URL.revokeObjectURL(draftAttachment.previewUrl);
        }

        setDraftAttachment({
            file,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            isImage: file.type.startsWith('image/'),
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        });

        event.target.value = '';
    };

    const clearDraftAttachment = () => {
        if (draftAttachment?.previewUrl) {
            URL.revokeObjectURL(draftAttachment.previewUrl);
        }

        setDraftAttachment(null);

        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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

    const openClearConversationModal = (conversation) => {
        setConversationToClear(conversation);
        setOpenConversationMenuId(null);
    };

    const closeClearConversationModal = () => {
        if (conversationToClear && clearingConversationIds.includes(conversationToClear.id)) {
            return;
        }

        setConversationToClear(null);
    };

    const openDeleteConversationModal = (conversation) => {
        setConversationToDelete(conversation);
        setOpenConversationMenuId(null);
    };

    const closeDeleteConversationModal = () => {
        if (conversationToDelete && deletingConversationIds.includes(conversationToDelete.id)) {
            return;
        }

        setConversationToDelete(null);
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

    const confirmClearConversation = () => {
        const conversationId = conversationToClear?.id;

        if (!conversationId || clearingConversationIds.includes(conversationId)) {
            return;
        }

        const previousMessages = localMessages;
        const previousConversations = localConversations;

        setClearingConversationIds((current) => [...current, conversationId]);
        setConversationToClear(null);
        setLocalConversations((current) =>
            current.map((conversation) =>
                conversation.id === conversationId
                    ? {
                          ...conversation,
                          latest_message: null,
                          latest_message_at: null,
                      }
                    : conversation,
            ),
        );

        if (displayedConversation?.id === conversationId) {
            setLocalMessages([]);
        }

        window.axios
            .delete(route('messages.clear', conversationId), {
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
                setClearingConversationIds((current) =>
                    current.filter((id) => id !== conversationId),
                );
            });
    };

    const confirmDeleteConversation = () => {
        const conversationId = conversationToDelete?.id;

        if (!conversationId || deletingConversationIds.includes(conversationId)) {
            return;
        }

        const previousConversations = localConversations;
        const previousMessages = localMessages;
        const previousActiveConversationId = activeConversationId;
        const wasActive = displayedConversation?.id === conversationId;
        const remainingConversations = localConversations.filter(
            (conversation) => conversation.id !== conversationId,
        );

        setDeletingConversationIds((current) => [...current, conversationId]);
        setConversationToDelete(null);
        setLocalConversations(remainingConversations);

        if (wasActive) {
            setActiveConversationId(null);
            setLocalMessages([]);
        }

        window.axios
            .delete(route('messages.destroy', conversationId), {
                headers: {
                    Accept: 'application/json',
                },
            })
            .then(() => {
                if (wasActive) {
                    const nextConversation = remainingConversations[0] ?? null;

                    router.visit(
                        nextConversation
                            ? route('messages.show', nextConversation.id)
                            : route('messages.index'),
                        { preserveScroll: true },
                    );
                }
            })
            .catch(() => {
                setLocalConversations(previousConversations);
                setLocalMessages(previousMessages);
                setActiveConversationId(previousActiveConversationId);
            })
            .finally(() => {
                setDeletingConversationIds((current) =>
                    current.filter((id) => id !== conversationId),
                );
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
        setOpenConversationMenuId(null);
    }, [displayedConversation?.id]);

    return (
        <AuthenticatedLayout title="Messages">
            <div className="grid gap-5 xl:grid-cols-[290px,1fr] 2xl:grid-cols-[320px,1fr] 2xl:gap-6">
                <section className="app-panel rounded-[28px] p-4 2xl:rounded-[32px] 2xl:p-5">
                    <div className="mb-3 flex items-start justify-between gap-3 2xl:mb-4">
                        <button
                            type="button"
                            onClick={goBack}
                            className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] 2xl:px-4 2xl:text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={() => setPickerOpen(true)}
                            className="app-button-primary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold 2xl:px-4 2xl:text-sm"
                        >
                            <PenSquare className="h-4 w-4" strokeWidth={1.9} />
                            New
                        </button>
                    </div>

                    <div className="mb-3 2xl:mb-4">
                        <h1 className="text-lg font-semibold 2xl:text-xl">Messages</h1>
                    </div>

                    {localConversations.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[24px] p-4 text-[13px] leading-5 2xl:rounded-[28px] 2xl:p-5 2xl:text-sm 2xl:leading-6">
                            No conversations yet. Visit a profile and tap Message to open a direct
                            chat.
                        </div>
                    ) : (
                        <div className="space-y-2.5 2xl:space-y-3">
                            {sortedConversations.map((conversation) => {
                                const isConversationBusy =
                                    clearingConversationIds.includes(conversation.id) ||
                                    deletingConversationIds.includes(conversation.id);

                                return (
                                    <div key={conversation.id} className="relative">
                                        <Link
                                            href={route('messages.show', conversation.id)}
                                            className={`block rounded-[20px] p-3.5 pr-12 transition 2xl:rounded-[24px] 2xl:p-4 2xl:pr-14 ${
                                                displayedConversation?.id === conversation.id
                                                    ? 'border border-[rgba(196,177,232,0.9)] bg-[rgba(120,88,166,0.22)] shadow-[0_0_0_1px_rgba(214,198,242,0.45),0_0_24px_rgba(144,114,204,0.18)]'
                                                    : 'app-card-inset border border-white/5 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)]'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="app-avatar-fallback flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] text-[13px] font-semibold 2xl:h-11 2xl:w-11 2xl:rounded-2xl 2xl:text-sm">
                                                    {initialsFor(conversation.participant?.name)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-[13px] font-semibold 2xl:text-sm">
                                                        {conversation.participant?.name ??
                                                            'Unknown user'}
                                                    </div>
                                                    <div className="app-text-soft mt-1.5 truncate text-[13px] 2xl:mt-2 2xl:text-sm">
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
                                        <div
                                            className="absolute right-3 top-3"
                                            ref={
                                                openConversationMenuId === conversation.id
                                                    ? conversationMenuRef
                                                    : null
                                            }
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenConversationMenuId((current) =>
                                                        current === conversation.id
                                                            ? null
                                                            : conversation.id,
                                                    )
                                                }
                                                disabled={isConversationBusy}
                                                className="text-current/75 inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-current disabled:opacity-60 2xl:h-8 2xl:w-8"
                                                aria-label="Conversation options"
                                            >
                                                <Ellipsis className="h-4 w-4" strokeWidth={1.9} />
                                            </button>
                                            {openConversationMenuId === conversation.id && (
                                                <div className="app-panel-inset absolute right-0 top-full z-20 mt-2 w-44 rounded-[18px] p-2 shadow-[var(--vynce-shadow-md)] 2xl:w-48 2xl:rounded-2xl">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openClearConversationModal(conversation)
                                                        }
                                                        className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] 2xl:text-sm"
                                                    >
                                                        <Eraser
                                                            className="h-4 w-4"
                                                            strokeWidth={1.9}
                                                        />
                                                        Clear conversation
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDeleteConversationModal(
                                                                conversation,
                                                            )
                                                        }
                                                        className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-rose-200 2xl:text-sm"
                                                    >
                                                        <Trash2
                                                            className="h-4 w-4"
                                                            strokeWidth={1.9}
                                                        />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="app-panel flex min-h-[420px] flex-col rounded-[28px] p-4 xl:h-[calc(100vh-3rem)] 2xl:rounded-[32px] 2xl:p-5">
                    {!displayedConversation ? (
                        <div className="app-dashed-panel app-text-muted flex min-h-[420px] flex-1 items-center justify-center rounded-[24px] p-6 text-center text-[13px] leading-6 2xl:rounded-[28px] 2xl:p-8 2xl:text-sm 2xl:leading-7">
                            Pick a conversation from the left, or start one from a user profile.
                        </div>
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="app-panel-inset mb-4 flex items-center gap-3 rounded-[20px] px-3.5 py-3 2xl:mb-5 2xl:rounded-[24px] 2xl:px-4 2xl:py-4">
                                <div className="app-avatar-fallback flex h-10 w-10 items-center justify-center rounded-[18px] text-[13px] font-semibold 2xl:h-12 2xl:w-12 2xl:rounded-2xl 2xl:text-sm">
                                    {initialsFor(displayedConversation.participant?.name)}
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-[13px] font-semibold 2xl:text-base">
                                        {displayedConversation.participant?.name}
                                    </div>
                                    <div className="app-text-soft truncate text-[13px] 2xl:text-sm">
                                        @{displayedConversation.participant?.username}
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    <Link
                                        href={route(
                                            'users.show',
                                            displayedConversation.participant?.username,
                                        )}
                                        className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] 2xl:px-4 2xl:text-sm"
                                    >
                                        <User className="h-4 w-4" strokeWidth={1.9} />
                                        View profile
                                    </Link>
                                </div>
                            </div>

                            <div className="relative min-h-0 flex-1">
                                <div className="pointer-events-none sticky top-0 z-10 flex justify-center pb-2.5 2xl:pb-3">
                                    <div className="app-panel-inset rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-[rgba(241,235,251,0.82)] shadow-[var(--vynce-shadow-sm)] 2xl:text-xs">
                                        {localMessages.length}{' '}
                                        {localMessages.length === 1 ? 'message' : 'messages'}
                                    </div>
                                </div>

                                <div
                                    ref={messagesViewportRef}
                                    className="app-scrollbar-hidden h-full space-y-2.5 overflow-y-auto pr-1 pt-1 2xl:space-y-3"
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
                                                    className={`relative max-w-[78%] rounded-[20px] px-3 py-2 text-[13px] leading-6 2xl:rounded-[24px] 2xl:px-3 2xl:py-2.5 2xl:text-sm 2xl:leading-7 ${
                                                        own
                                                            ? 'app-button-primary'
                                                            : 'app-panel-inset'
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
                                                                    setOpenMenuMessageId(
                                                                        (current) =>
                                                                            current === message.id
                                                                                ? null
                                                                                : message.id,
                                                                    )
                                                                }
                                                                className="text-current/75 inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-current 2xl:h-8 2xl:w-8"
                                                                aria-label="Message options"
                                                            >
                                                                <Ellipsis
                                                                    className="h-4 w-4"
                                                                    strokeWidth={1.9}
                                                                />
                                                            </button>
                                                            {openMenuMessageId === message.id && (
                                                                <div className="app-panel-inset absolute right-0 top-full z-20 mt-2 w-32 rounded-[18px] p-2 shadow-[var(--vynce-shadow-md)] 2xl:w-36 2xl:rounded-2xl">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            copyMessage(
                                                                                message.body,
                                                                            )
                                                                        }
                                                                        className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] 2xl:text-sm"
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
                                                                                    beginEdit(
                                                                                        message,
                                                                                    );
                                                                                    setOpenMenuMessageId(
                                                                                        null,
                                                                                    );
                                                                                }}
                                                                                className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] 2xl:text-sm"
                                                                            >
                                                                                <Pencil
                                                                                    className="h-4 w-4"
                                                                                    strokeWidth={
                                                                                        1.9
                                                                                    }
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
                                                                                disabled={
                                                                                    isDeleting
                                                                                }
                                                                                className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-rose-200 disabled:opacity-60 2xl:text-sm"
                                                                            >
                                                                                <Trash2
                                                                                    className="h-4 w-4"
                                                                                    strokeWidth={
                                                                                        1.9
                                                                                    }
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
                                                                className="app-scrollbar-hidden min-h-20 w-full resize-none overflow-y-auto border-0 bg-transparent pb-11 pl-9 pr-14 text-[13px] focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 2xl:pb-12 2xl:pl-10 2xl:pr-16 2xl:text-sm"
                                                                style={{
                                                                    outline: 'none',
                                                                    boxShadow: 'none',
                                                                }}
                                                            />
                                                            <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        saveEdit(message.id)
                                                                    }
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
                                                        <div className="space-y-2.5 2xl:space-y-3">
                                                            {message.attachment && (
                                                                <div>
                                                                    {message.attachment.is_image ? (
                                                                        message.attachment.url ? (
                                                                            <a
                                                                                href={
                                                                                    message
                                                                                        .attachment
                                                                                        .url
                                                                                }
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="block overflow-hidden rounded-[20px]"
                                                                            >
                                                                                <img
                                                                                    src={
                                                                                        message
                                                                                            .attachment
                                                                                            .url
                                                                                    }
                                                                                    alt={
                                                                                        message
                                                                                            .attachment
                                                                                            .name ??
                                                                                        'Attachment'
                                                                                    }
                                                                                    className="max-h-72 w-full object-cover"
                                                                                />
                                                                            </a>
                                                                        ) : null
                                                                    ) : message.attachment.url ? (
                                                                        <a
                                                                            href={
                                                                                message.attachment
                                                                                    .url
                                                                            }
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="app-panel-inset flex items-center gap-3 rounded-[18px] px-3 py-2.5 2xl:py-3"
                                                                        >
                                                                            <div className="app-avatar-fallback flex h-9 w-9 items-center justify-center rounded-[18px] text-[13px] font-semibold 2xl:h-10 2xl:w-10 2xl:rounded-2xl 2xl:text-sm">
                                                                                <File
                                                                                    className="h-4 w-4"
                                                                                    strokeWidth={
                                                                                        1.9
                                                                                    }
                                                                                />
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="truncate text-[13px] font-semibold 2xl:text-sm">
                                                                                    {
                                                                                        message
                                                                                            .attachment
                                                                                            .name
                                                                                    }
                                                                                </div>
                                                                                <div className="app-text-soft text-[11px] 2xl:text-xs">
                                                                                    {formatFileSize(
                                                                                        message
                                                                                            .attachment
                                                                                            .size,
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    ) : (
                                                                        <div className="app-panel-inset flex items-center gap-3 rounded-[18px] px-3 py-2.5 2xl:py-3">
                                                                            <div className="app-avatar-fallback flex h-9 w-9 items-center justify-center rounded-[18px] text-[13px] font-semibold 2xl:h-10 2xl:w-10 2xl:rounded-2xl 2xl:text-sm">
                                                                                <File
                                                                                    className="h-4 w-4"
                                                                                    strokeWidth={
                                                                                        1.9
                                                                                    }
                                                                                />
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="truncate text-[13px] font-semibold 2xl:text-sm">
                                                                                    {
                                                                                        message
                                                                                            .attachment
                                                                                            .name
                                                                                    }
                                                                                </div>
                                                                                <div className="app-text-soft text-[11px] 2xl:text-xs">
                                                                                    {formatFileSize(
                                                                                        message
                                                                                            .attachment
                                                                                            .size,
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {message.body && (
                                                                <div className="whitespace-pre-wrap break-all pr-10">
                                                                    {message.body}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!isEditing && (
                                                        <div className="app-text-soft mt-2 flex items-center gap-2 text-[11px] 2xl:text-xs">
                                                            {isEdited && (
                                                                <span className="bg-white/8 text-current/75 rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.16em]">
                                                                    Edited
                                                                </span>
                                                            )}
                                                            <span>
                                                                {new Date(
                                                                    timestamp,
                                                                ).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <form onSubmit={submit} className="relative mt-4 2xl:mt-5">
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={selectDraftAttachment}
                                />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={selectDraftAttachment}
                                />
                                <textarea
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    className="field app-scrollbar-hidden min-h-24 w-full resize-none overflow-y-auto pb-12 pr-14 text-[13px] 2xl:pb-14 2xl:pr-16 2xl:text-sm"
                                    placeholder={`Message ${displayedConversation.participant?.name}...`}
                                />
                                {draftAttachment && (
                                    <div className="absolute left-3 right-16 top-3">
                                        {draftAttachment.isImage ? (
                                            <div className="relative inline-flex overflow-hidden rounded-[18px]">
                                                <img
                                                    src={draftAttachment.previewUrl}
                                                    alt={draftAttachment.name}
                                                    className="h-20 w-20 object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={clearDraftAttachment}
                                                    className="app-button-secondary absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full p-0"
                                                    aria-label="Remove attachment"
                                                >
                                                    <X className="h-3.5 w-3.5" strokeWidth={1.9} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="app-panel-inset flex items-center gap-3 rounded-[18px] px-3 py-2">
                                                <div className="app-avatar-fallback flex h-8 w-8 items-center justify-center rounded-[18px] text-[13px] font-semibold 2xl:h-9 2xl:w-9 2xl:rounded-2xl 2xl:text-sm">
                                                    <File className="h-4 w-4" strokeWidth={1.9} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-[13px] font-semibold 2xl:text-sm">
                                                        {draftAttachment.name}
                                                    </div>
                                                    <div className="app-text-soft text-[11px] 2xl:text-xs">
                                                        {formatFileSize(draftAttachment.size)}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={clearDraftAttachment}
                                                    className="app-button-secondary inline-flex h-8 w-8 items-center justify-center rounded-full p-0"
                                                    aria-label="Remove attachment"
                                                >
                                                    <X className="h-3.5 w-3.5" strokeWidth={1.9} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        className="app-button-secondary inline-flex h-8 w-8 items-center justify-center rounded-full p-0 2xl:h-9 2xl:w-9"
                                        aria-label="Attach image"
                                    >
                                        <ImageIcon className="h-4 w-4" strokeWidth={1.9} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="app-button-secondary inline-flex h-8 w-8 items-center justify-center rounded-full p-0 2xl:h-9 2xl:w-9"
                                        aria-label="Attach file"
                                    >
                                        <Paperclip className="h-4 w-4" strokeWidth={1.9} />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSending || (!draft.trim() && !draftAttachment)}
                                    className="app-button-primary absolute bottom-3.5 right-3 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full disabled:opacity-60 2xl:bottom-4 2xl:h-10 2xl:w-10"
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
                <div className="space-y-4 p-5 2xl:space-y-5 2xl:p-6">
                    <div>
                        <div className="text-base font-semibold 2xl:text-lg">
                            Start a new conversation
                        </div>
                        <p className="app-text-soft mt-2 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                            Pick one of your contacts to open a direct chat.
                        </p>
                    </div>

                    {availableContacts.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[20px] p-4 text-[13px] 2xl:rounded-[24px] 2xl:p-5 2xl:text-sm">
                            You’ve already started conversations with all available contacts.
                        </div>
                    ) : (
                        <div className="max-h-[24rem] space-y-2.5 overflow-y-auto pr-1 2xl:space-y-3">
                            {availableContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    type="button"
                                    onClick={() => startConversation(contact.id)}
                                    className="app-card-inset flex w-full items-center gap-3 rounded-[20px] p-3.5 text-left transition hover:bg-[var(--vynce-surface-muted)] 2xl:rounded-[24px] 2xl:p-4"
                                >
                                    {contact.avatar_url ? (
                                        <img
                                            src={contact.avatar_url}
                                            alt={contact.name}
                                            className="h-10 w-10 rounded-[18px] object-cover 2xl:h-11 2xl:w-11 2xl:rounded-2xl"
                                            style={{
                                                objectPosition: `${contact.avatar_position_x}% ${contact.avatar_position_y}%`,
                                                transform: `scale(${contact.avatar_zoom})`,
                                                transformOrigin: `${contact.avatar_position_x}% ${contact.avatar_position_y}%`,
                                            }}
                                        />
                                    ) : (
                                        <div className="app-avatar-fallback flex h-10 w-10 items-center justify-center rounded-[18px] text-[13px] font-semibold 2xl:h-11 2xl:w-11 2xl:rounded-2xl 2xl:text-sm">
                                            {initialsFor(contact.name)}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[13px] font-semibold 2xl:text-sm">
                                            {contact.name}
                                        </div>
                                        <div className="app-text-soft truncate text-[11px] 2xl:text-xs">
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
                <div className="space-y-4 p-5 2xl:space-y-5 2xl:p-6">
                    <div>
                        <div className="text-base font-semibold 2xl:text-lg">Delete message?</div>
                        <p className="app-text-soft mt-2 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
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
                            className="app-button-secondary rounded-full px-3.5 py-1.5 text-[13px] disabled:opacity-60 2xl:px-4 2xl:py-2 2xl:text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteMessage}
                            disabled={Boolean(
                                messageToDelete && deletingMessageIds.includes(messageToDelete.id),
                            )}
                            className="app-button-primary rounded-full px-3.5 py-1.5 text-[13px] disabled:opacity-60 2xl:px-4 2xl:py-2 2xl:text-sm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                show={Boolean(conversationToClear)}
                onClose={closeClearConversationModal}
                maxWidth="md"
            >
                <div className="space-y-4 p-5 2xl:space-y-5 2xl:p-6">
                    <div>
                        <div className="text-base font-semibold 2xl:text-lg">
                            Clear conversation?
                        </div>
                        <p className="app-text-soft mt-2 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                            This will remove every message from this thread and keep the
                            conversation itself in your inbox.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeClearConversationModal}
                            disabled={Boolean(
                                conversationToClear &&
                                    clearingConversationIds.includes(conversationToClear.id),
                            )}
                            className="app-button-secondary rounded-full px-3.5 py-1.5 text-[13px] disabled:opacity-60 2xl:px-4 2xl:py-2 2xl:text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmClearConversation}
                            disabled={Boolean(
                                conversationToClear &&
                                    clearingConversationIds.includes(conversationToClear.id),
                            )}
                            className="app-button-primary rounded-full px-3.5 py-1.5 text-[13px] disabled:opacity-60 2xl:px-4 2xl:py-2 2xl:text-sm"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                show={Boolean(conversationToDelete)}
                onClose={closeDeleteConversationModal}
                maxWidth="md"
            >
                <div className="space-y-4 p-5 2xl:space-y-5 2xl:p-6">
                    <div>
                        <div className="text-base font-semibold 2xl:text-lg">
                            Delete conversation?
                        </div>
                        <p className="app-text-soft mt-2 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                            This will remove the thread from your inbox.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeDeleteConversationModal}
                            disabled={Boolean(
                                conversationToDelete &&
                                    deletingConversationIds.includes(conversationToDelete.id),
                            )}
                            className="app-button-secondary rounded-full px-3.5 py-1.5 text-[13px] disabled:opacity-60 2xl:px-4 2xl:py-2 2xl:text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteConversation}
                            disabled={Boolean(
                                conversationToDelete &&
                                    deletingConversationIds.includes(conversationToDelete.id),
                            )}
                            className="app-button-primary rounded-full px-3.5 py-1.5 text-[13px] disabled:opacity-60 2xl:px-4 2xl:py-2 2xl:text-sm"
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

function formatFileSize(size) {
    if (!size) {
        return 'File';
    }

    if (size < 1024 * 1024) {
        return `${Math.max(1, Math.round(size / 1024))} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
