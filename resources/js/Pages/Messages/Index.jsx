import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    CheckCheck,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Copy,
    Eraser,
    File,
    Image as ImageIcon,
    MessageCircle,
    MoreHorizontal,
    PanelLeftClose,
    PanelLeftOpen,
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
    const [activeImageIndex, setActiveImageIndex] = useState(null);
    const [conversationRailCollapsed, setConversationRailCollapsed] = useState(false);
    const messagesViewportRef = useRef(null);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const messageMenuRef = useRef(null);
    const conversationMenuRef = useRef(null);
    const optimisticMessageIdRef = useRef(0);
    const previousConversationIdRef = useRef(activeConversation?.id ?? null);
    const shouldAutoScrollRef = useRef(true);
    const autoOpenedUnreadConversationRef = useRef(false);
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
                    : left.updated_at
                      ? new Date(left.updated_at).getTime()
                      : 0;
                const rightTime = right.latest_message_at
                    ? new Date(right.latest_message_at).getTime()
                    : right.updated_at
                      ? new Date(right.updated_at).getTime()
                      : 0;

                return rightTime - leftTime;
            }),
        [localConversations],
    );
    const newestUnreadConversation = useMemo(
        () =>
            sortedConversations.find(
                (conversation) => (conversation.unread_messages_count ?? 0) > 0,
            ) ?? null,
        [sortedConversations],
    );
    const displayedConversation = useMemo(
        () =>
            localConversations.find((conversation) => conversation.id === activeConversationId) ??
            (activeConversation?.id === activeConversationId ? activeConversation : null) ??
            null,
        [activeConversation, activeConversationId, localConversations],
    );
    const groupedMessages = useMemo(() => {
        const groups = [];

        localMessages.forEach((message) => {
            const timestamp = message.created_at ?? message.updated_at;
            const dateKey = timestamp ? new Date(timestamp).toDateString() : 'unknown';
            const lastGroup = groups.at(-1);

            if (!lastGroup || lastGroup.dateKey !== dateKey) {
                groups.push({
                    dateKey,
                    label: timestamp ? formatMessageDateBadge(timestamp) : 'Unknown date',
                    messages: [message],
                });
                return;
            }

            lastGroup.messages.push(message);
        });

        return groups;
    }, [localMessages]);
    const imageMessages = useMemo(
        () =>
            localMessages.filter(
                (message) => message.attachment?.is_image && message.attachment?.url,
            ),
        [localMessages],
    );
    const activeImage =
        activeImageIndex === null ? null : (imageMessages[activeImageIndex] ?? null);

    useEffect(() => {
        setActiveConversationId(activeConversation?.id ?? null);
        if (activeConversation) {
            setLocalConversations((current) => {
                const exists = current.some(
                    (conversation) => conversation.id === activeConversation.id,
                );

                return exists
                    ? [
                          activeConversation,
                          ...current.filter(
                              (conversation) => conversation.id !== activeConversation.id,
                          ),
                      ]
                    : [activeConversation, ...current];
            });
        }
        autoOpenedUnreadConversationRef.current = Boolean(activeConversation?.id);
    }, [activeConversation]);

    useEffect(() => {
        setLocalConversations(conversations);
    }, [conversations]);

    useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    useEffect(() => {
        if (
            activeConversation?.id ||
            activeConversationId ||
            autoOpenedUnreadConversationRef.current
        ) {
            return;
        }

        if (!newestUnreadConversation) {
            return;
        }

        autoOpenedUnreadConversationRef.current = true;
        router.visit(route('messages.show', newestUnreadConversation.id), {
            preserveScroll: true,
        });
    }, [activeConversation?.id, activeConversationId, newestUnreadConversation?.id]);

    useEffect(() => {
        router.reload({
            only: ['conversations', 'activeConversation', 'contacts', 'messages', 'topbar'],
            preserveScroll: true,
            preserveState: true,
        });
    }, []);

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

    useEffect(() => {
        const reloadMessages = () => {
            if (document.visibilityState !== 'visible' || isSending) {
                return;
            }

            router.reload({
                only: ['conversations', 'activeConversation', 'contacts', 'messages', 'topbar'],
                preserveScroll: true,
                preserveState: true,
            });
        };

        const intervalId = window.setInterval(reloadMessages, 5000);
        window.addEventListener('focus', reloadMessages);
        document.addEventListener('visibilitychange', reloadMessages);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', reloadMessages);
            document.removeEventListener('visibilitychange', reloadMessages);
        };
    }, [isSending]);

    const goBack = () => {
        router.visit(route('feed.home'));
    };

    const closeConversation = () => {
        setActiveConversationId(null);
        setLocalMessages([]);
        autoOpenedUnreadConversationRef.current = true;
        router.visit(route('messages.index'), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const openImageCarousel = (messageId) => {
        const imageIndex = imageMessages.findIndex((message) => message.id === messageId);

        if (imageIndex !== -1) {
            setActiveImageIndex(imageIndex);
        }
    };

    const closeImageCarousel = () => {
        setActiveImageIndex(null);
    };

    const showPreviousImage = () => {
        if (!imageMessages.length) {
            return;
        }

        setActiveImageIndex((current) =>
            current === null ? 0 : (current - 1 + imageMessages.length) % imageMessages.length,
        );
    };

    const showNextImage = () => {
        if (!imageMessages.length) {
            return;
        }

        setActiveImageIndex((current) =>
            current === null ? 0 : (current + 1) % imageMessages.length,
        );
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
        shouldAutoScrollRef.current = true;
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
        const viewport = messagesViewportRef.current;

        if (!viewport) {
            return;
        }

        const conversationChanged = previousConversationIdRef.current !== displayedConversation?.id;

        if (conversationChanged || shouldAutoScrollRef.current) {
            viewport.scrollTop = viewport.scrollHeight;
            shouldAutoScrollRef.current = true;
        }

        previousConversationIdRef.current = displayedConversation?.id ?? null;
    }, [displayedConversation?.id, localMessages.length]);

    useEffect(() => {
        setOpenMenuMessageId(null);
        setOpenConversationMenuId(null);
    }, [displayedConversation?.id]);

    const handleMessagesScroll = () => {
        const viewport = messagesViewportRef.current;

        if (!viewport) {
            return;
        }

        const distanceFromBottom =
            viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;

        shouldAutoScrollRef.current = distanceFromBottom < 80;
    };

    return (
        <AuthenticatedLayout title="Messages">
            <div
                className={`grid gap-5 2xl:gap-6 ${
                    conversationRailCollapsed
                        ? 'xl:grid-cols-[92px,1fr] 2xl:grid-cols-[104px,1fr]'
                        : 'xl:grid-cols-[290px,1fr] 2xl:grid-cols-[320px,1fr]'
                }`}
            >
                <section className="app-panel flex min-h-[420px] flex-col rounded-[28px] p-4 xl:h-[calc(100vh-3rem)] 2xl:rounded-[32px] 2xl:p-5">
                    <div className="mb-3 flex items-start justify-between gap-3 2xl:mb-4">
                        {conversationRailCollapsed ? (
                            <div className="flex w-full justify-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConversationRailCollapsed((current) => !current)
                                    }
                                    className="app-nav-link inline-flex h-10 w-10 items-center justify-center rounded-full p-0 2xl:h-11 2xl:w-11"
                                    aria-label="Expand conversations panel"
                                >
                                    <PanelLeftOpen className="h-4 w-4" strokeWidth={1.9} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] 2xl:px-4 2xl:text-sm"
                                    aria-label="Back"
                                >
                                    <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
                                    Back
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setConversationRailCollapsed((current) => !current)
                                        }
                                        className="app-nav-link inline-flex h-10 w-10 items-center justify-center rounded-full p-0 2xl:h-11 2xl:w-11"
                                        aria-label="Collapse conversations panel"
                                    >
                                        <PanelLeftClose className="h-4 w-4" strokeWidth={1.9} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {!conversationRailCollapsed ? (
                        <div className="mb-5 flex items-center justify-between gap-3 2xl:mb-6">
                            <h1 className="text-lg font-semibold 2xl:text-xl">Messages</h1>
                            <button
                                type="button"
                                onClick={() => setPickerOpen(true)}
                                className="app-button-primary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold 2xl:px-4 2xl:text-sm"
                                aria-label="New conversation"
                            >
                                <PenSquare className="h-4 w-4" strokeWidth={1.9} />
                                New
                            </button>
                        </div>
                    ) : null}

                    <div className="app-scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-1">
                        <div className="app-scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-1">
                            {localConversations.length === 0 ? (
                                conversationRailCollapsed ? (
                                    <div className="app-dashed-panel app-text-muted flex min-h-24 items-center justify-center rounded-[24px] p-3 text-center text-[11px] leading-4 2xl:rounded-[28px] 2xl:p-4 2xl:text-xs">
                                        Empty
                                    </div>
                                ) : (
                                    <div className="app-dashed-panel app-text-muted rounded-[24px] p-4 text-[13px] leading-5 2xl:rounded-[28px] 2xl:p-5 2xl:text-sm 2xl:leading-6">
                                        No conversations yet. Visit a profile and tap Message to
                                        open a direct chat.
                                    </div>
                                )
                            ) : (
                                <div
                                    className={
                                        conversationRailCollapsed
                                            ? 'space-y-2'
                                            : 'space-y-2.5 2xl:space-y-3'
                                    }
                                >
                                    {sortedConversations.map((conversation) => {
                                        const isConversationBusy =
                                            clearingConversationIds.includes(conversation.id) ||
                                            deletingConversationIds.includes(conversation.id);

                                        return (
                                            <div key={conversation.id} className="relative">
                                                <Link
                                                    href={route('messages.show', conversation.id)}
                                                    className={`block transition ${
                                                        conversationRailCollapsed
                                                            ? displayedConversation?.id ===
                                                              conversation.id
                                                                ? 'rounded-[22px] border border-[rgba(196,177,232,0.9)] bg-[rgba(120,88,166,0.22)] p-2 shadow-[0_0_0_1px_rgba(214,198,242,0.45),0_0_24px_rgba(144,114,204,0.18)] 2xl:rounded-[24px]'
                                                                : 'app-card-inset rounded-[22px] border border-white/5 bg-[rgba(255,255,255,0.04)] p-2 hover:bg-[rgba(255,255,255,0.07)] 2xl:rounded-[24px]'
                                                            : displayedConversation?.id ===
                                                                conversation.id
                                                              ? 'rounded-[20px] border border-[rgba(196,177,232,0.9)] bg-[rgba(120,88,166,0.22)] p-3.5 pr-12 shadow-[0_0_0_1px_rgba(214,198,242,0.45),0_0_24px_rgba(144,114,204,0.18)] 2xl:rounded-[24px] 2xl:p-4 2xl:pr-14'
                                                              : 'app-card-inset rounded-[20px] border border-white/5 bg-[rgba(255,255,255,0.04)] p-3.5 pr-12 hover:bg-[rgba(255,255,255,0.07)] 2xl:rounded-[24px] 2xl:p-4 2xl:pr-14'
                                                    }`}
                                                    title={
                                                        conversation.participant?.name ??
                                                        'Unknown user'
                                                    }
                                                >
                                                    <div
                                                        className={`flex ${
                                                            conversationRailCollapsed
                                                                ? 'justify-center'
                                                                : 'items-start gap-3'
                                                        }`}
                                                    >
                                                        {conversation.participant?.avatar_url ? (
                                                            <div className="relative h-10 w-10 shrink-0 2xl:h-11 2xl:w-11">
                                                                <div className="h-10 w-10 overflow-hidden rounded-[18px] 2xl:h-11 2xl:w-11 2xl:rounded-2xl">
                                                                    <img
                                                                        src={
                                                                            conversation.participant
                                                                                .avatar_url
                                                                        }
                                                                        alt={
                                                                            conversation.participant
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
                                                                {conversation.unread_messages_count >
                                                                0 ? (
                                                                    <div className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[rgba(244,91,105,0.96)] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(244,91,105,0.32)]">
                                                                        {
                                                                            conversation.unread_messages_count
                                                                        }
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        ) : (
                                                            <div className="relative h-10 w-10 shrink-0 2xl:h-11 2xl:w-11">
                                                                <div className="app-avatar-fallback flex h-10 w-10 items-center justify-center rounded-[18px] text-[13px] font-semibold 2xl:h-11 2xl:w-11 2xl:rounded-2xl 2xl:text-sm">
                                                                    {initialsFor(
                                                                        conversation.participant
                                                                            ?.name,
                                                                    )}
                                                                </div>
                                                                {conversation.unread_messages_count >
                                                                0 ? (
                                                                    <div className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[rgba(244,91,105,0.96)] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(244,91,105,0.32)]">
                                                                        {
                                                                            conversation.unread_messages_count
                                                                        }
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        )}
                                                        {!conversationRailCollapsed ? (
                                                            <div className="min-w-0 flex-1">
                                                                <div className="truncate text-[13px] font-semibold 2xl:text-sm">
                                                                    {conversation.participant
                                                                        ?.name ?? 'Unknown user'}
                                                                </div>
                                                                <div className="app-text-soft mt-1.5 truncate text-[13px] 2xl:mt-2 2xl:text-sm">
                                                                    {conversation.latest_message
                                                                        ?.sender?.id ===
                                                                    auth.user.id
                                                                        ? 'You: '
                                                                        : ''}
                                                                    {conversation.latest_message
                                                                        ?.body ?? 'No messages yet'}
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </Link>
                                                {!conversationRailCollapsed ? (
                                                    <div className="absolute right-3 top-3">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDeleteConversationModal(
                                                                    conversation,
                                                                )
                                                            }
                                                            disabled={isConversationBusy}
                                                            className="text-current/75 inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[rgba(244,91,105,0.14)] hover:text-rose-300 disabled:opacity-60 2xl:h-8 2xl:w-8"
                                                            aria-label="Delete conversation"
                                                        >
                                                            <Trash2
                                                                className="h-4 w-4"
                                                                strokeWidth={1.9}
                                                            />
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="app-panel flex min-h-[420px] flex-col rounded-[28px] p-4 xl:h-[calc(100vh-3rem)] 2xl:rounded-[32px] 2xl:p-5">
                    {!displayedConversation ? (
                        <div className="app-dashed-panel flex min-h-[420px] flex-1 items-center justify-center rounded-[24px] p-6 2xl:rounded-[28px] 2xl:p-8">
                            <div className="mx-auto max-w-md text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[radial-gradient(circle_at_top,rgba(245,242,255,0.22),rgba(132,86,255,0.04)_68%)] shadow-[0_18px_50px_rgba(7,11,18,0.22)] 2xl:h-20 2xl:w-20 2xl:rounded-[26px]">
                                    <MessageCircle
                                        className="h-7 w-7 2xl:h-8 2xl:w-8"
                                        strokeWidth={1.9}
                                    />
                                </div>
                                <div className="mt-5 text-xl font-semibold tracking-[-0.02em] 2xl:mt-6 2xl:text-2xl">
                                    Your inbox is ready
                                </div>
                                <p className="app-text-soft mt-3 text-[13px] leading-6 2xl:mt-4 2xl:text-sm 2xl:leading-7">
                                    Open any conversation from the left rail, or start a new thread
                                    from a profile when you want to reach out.
                                </p>
                                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 2xl:mt-6">
                                    <div className="app-panel-inset inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] 2xl:text-[13px]">
                                        <MessageCircle className="h-4 w-4" strokeWidth={1.9} />
                                        Select a thread
                                    </div>
                                    <div className="app-panel-inset inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] 2xl:text-[13px]">
                                        <PenSquare className="h-4 w-4" strokeWidth={1.9} />
                                        Start from a profile
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="app-panel-inset mb-4 flex items-center gap-3 rounded-[20px] px-3.5 py-3 2xl:mb-5 2xl:rounded-[24px] 2xl:px-4 2xl:py-4">
                                {displayedConversation.participant?.avatar_url ? (
                                    <div className="h-10 w-10 overflow-hidden rounded-[18px] 2xl:h-12 2xl:w-12 2xl:rounded-2xl">
                                        <img
                                            src={displayedConversation.participant.avatar_url}
                                            alt={displayedConversation.participant?.name}
                                            className="h-full w-full object-cover"
                                            style={{
                                                objectPosition: `${displayedConversation.participant.avatar_position_x}% ${displayedConversation.participant.avatar_position_y}%`,
                                                transform: `scale(${displayedConversation.participant.avatar_zoom})`,
                                                transformOrigin: `${displayedConversation.participant.avatar_position_x}% ${displayedConversation.participant.avatar_position_y}%`,
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="app-avatar-fallback flex h-10 w-10 items-center justify-center rounded-[18px] text-[13px] font-semibold 2xl:h-12 2xl:w-12 2xl:rounded-2xl 2xl:text-sm">
                                        {initialsFor(displayedConversation.participant?.name)}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="truncate text-[13px] font-semibold 2xl:text-base">
                                        {displayedConversation.participant?.name}
                                    </div>
                                    <div className="app-text-soft truncate text-[13px] 2xl:text-sm">
                                        @{displayedConversation.participant?.username}
                                    </div>
                                </div>
                                <div
                                    className="ml-auto relative"
                                    ref={
                                        openConversationMenuId === displayedConversation.id
                                            ? conversationMenuRef
                                            : null
                                    }
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenConversationMenuId((current) =>
                                                current === displayedConversation.id
                                                    ? null
                                                    : displayedConversation.id,
                                            )
                                        }
                                        className="app-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full p-0 2xl:h-11 2xl:w-11"
                                        aria-label="Conversation actions"
                                        aria-expanded={
                                            openConversationMenuId === displayedConversation.id
                                        }
                                    >
                                        <MoreHorizontal className="h-4 w-4" strokeWidth={1.9} />
                                    </button>
                                    {openConversationMenuId === displayedConversation.id && (
                                        <div className="app-panel-inset absolute right-0 top-full z-20 mt-2 w-52 rounded-[18px] p-2 shadow-[var(--vynce-shadow-md)] 2xl:w-56 2xl:rounded-2xl">
                                            <Link
                                                href={route(
                                                    'users.show',
                                                    displayedConversation.participant?.username,
                                                )}
                                                className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] 2xl:text-sm"
                                            >
                                                <User className="h-4 w-4" strokeWidth={1.9} />
                                                Profile
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openClearConversationModal(
                                                        displayedConversation,
                                                    )
                                                }
                                                className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] 2xl:text-sm"
                                            >
                                                <Eraser className="h-4 w-4" strokeWidth={1.9} />
                                                Clear conversation
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOpenConversationMenuId(null);
                                                    closeConversation();
                                                }}
                                                className="app-nav-link flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-rose-200 2xl:text-sm"
                                            >
                                                <X className="h-4 w-4" strokeWidth={1.9} />
                                                Close
                                            </button>
                                        </div>
                                    )}
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
                                    onScroll={handleMessagesScroll}
                                    className="app-scrollbar-hidden h-full space-y-2.5 overflow-y-auto pr-1 pb-10 pt-1 2xl:space-y-3 2xl:pb-12"
                                >
                                    {groupedMessages.map((group) => (
                                        <div
                                            key={group.dateKey}
                                            className="space-y-2.5 2xl:space-y-3"
                                        >
                                            <div className="flex justify-center py-1">
                                                <div className="app-panel-inset rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-[rgba(241,235,251,0.82)] shadow-[var(--vynce-shadow-sm)] 2xl:text-xs">
                                                    {group.label}
                                                </div>
                                            </div>
                                            {group.messages.map((message) => {
                                                const own = message.sender?.id === auth.user.id;
                                                const isEditing = editingMessageId === message.id;
                                                const isDeleting = deletingMessageIds.includes(
                                                    message.id,
                                                );
                                                const timestamp =
                                                    message.updated_at ?? message.created_at;
                                                const deliveryStatus =
                                                    message.delivery?.status ?? null;
                                                const isEdited = Boolean(
                                                    message.updated_at &&
                                                        message.created_at &&
                                                        message.updated_at !== message.created_at,
                                                );
                                                const avatar = message.sender?.avatar_url ? (
                                                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-[16px] 2xl:h-9 2xl:w-9 2xl:rounded-[18px]">
                                                        <img
                                                            src={message.sender.avatar_url}
                                                            alt={message.sender?.name}
                                                            className="h-full w-full object-cover"
                                                            style={{
                                                                objectPosition: `${message.sender.avatar_position_x}% ${message.sender.avatar_position_y}%`,
                                                                transform: `scale(${message.sender.avatar_zoom})`,
                                                                transformOrigin: `${message.sender.avatar_position_x}% ${message.sender.avatar_position_y}%`,
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="app-avatar-fallback flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] text-[11px] font-semibold 2xl:h-9 2xl:w-9 2xl:rounded-[18px] 2xl:text-xs">
                                                        {initialsFor(message.sender?.name)}
                                                    </div>
                                                );

                                                return (
                                                    <div
                                                        key={message.id}
                                                        className={`flex items-start gap-2.5 ${
                                                            own ? 'justify-end' : 'justify-start'
                                                        }`}
                                                    >
                                                        {!own ? avatar : null}
                                                        <div
                                                            className={`relative min-w-[11rem] max-w-[78%] rounded-[20px] px-3 py-2 text-[13px] leading-6 2xl:min-w-[12rem] 2xl:rounded-[24px] 2xl:px-3 2xl:py-2.5 2xl:text-sm 2xl:leading-7 ${
                                                                own
                                                                    ? 'app-button-primary'
                                                                    : 'app-panel-inset'
                                                            }`}
                                                        >
                                                            {!isEditing && (
                                                                <div
                                                                    className="absolute right-2 top-2 2xl:right-2.5 2xl:top-2.5"
                                                                    ref={
                                                                        openMenuMessageId ===
                                                                        message.id
                                                                            ? messageMenuRef
                                                                            : null
                                                                    }
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setOpenMenuMessageId(
                                                                                (current) =>
                                                                                    current ===
                                                                                    message.id
                                                                                        ? null
                                                                                        : message.id,
                                                                            )
                                                                        }
                                                                        className="text-current/75 inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-current 2xl:h-8 2xl:w-8"
                                                                        aria-label="Message options"
                                                                        aria-expanded={
                                                                            openMenuMessageId ===
                                                                            message.id
                                                                        }
                                                                    >
                                                                        <ChevronDown
                                                                            className={`h-4 w-4 transition-transform ${
                                                                                openMenuMessageId ===
                                                                                message.id
                                                                                    ? 'rotate-180'
                                                                                    : ''
                                                                            }`}
                                                                            strokeWidth={1.9}
                                                                        />
                                                                    </button>
                                                                    {openMenuMessageId ===
                                                                        message.id && (
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
                                                                                    strokeWidth={
                                                                                        1.9
                                                                                    }
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
                                                                            setEditDraft(
                                                                                event.target.value,
                                                                            )
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
                                                                <div className="space-y-2.5 pr-10 2xl:space-y-3 2xl:pr-11">
                                                                    {message.attachment && (
                                                                        <div>
                                                                            {message.attachment
                                                                                .is_image ? (
                                                                                message.attachment
                                                                                    .url ? (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            openImageCarousel(
                                                                                                message.id,
                                                                                            )
                                                                                        }
                                                                                        className="block overflow-hidden rounded-[20px]"
                                                                                        aria-label="Open image carousel"
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
                                                                                    </button>
                                                                                ) : null
                                                                            ) : message.attachment
                                                                                  .url ? (
                                                                                <a
                                                                                    href={
                                                                                        message
                                                                                            .attachment
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
                                                                        <div className="min-w-0">
                                                                            <div className="min-w-0">
                                                                                <span className="whitespace-pre-wrap break-all leading-6 2xl:leading-7">
                                                                                    {message.body}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {!isEditing && (
                                                                <div
                                                                    dir="ltr"
                                                                    className="app-text-soft mt-2 grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-[11px] 2xl:text-xs"
                                                                >
                                                                    <div className="min-w-0 justify-self-start">
                                                                        <span>
                                                                            {formatMessageTime(
                                                                                timestamp,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex w-full items-center justify-end gap-2 text-right">
                                                                        {isEdited && (
                                                                            <span className="bg-white/8 text-current/75 rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.16em]">
                                                                                Edited
                                                                            </span>
                                                                        )}
                                                                        {deliveryStatus && (
                                                                            <span
                                                                                className={`inline-flex items-center gap-1 ${
                                                                                    deliveryStatus ===
                                                                                    'seen'
                                                                                        ? 'text-sky-300'
                                                                                        : 'text-current/85'
                                                                                }`}
                                                                            >
                                                                                {deliveryStatus ===
                                                                                'unread' ? (
                                                                                    <Clock3
                                                                                        className="h-3.5 w-3.5"
                                                                                        strokeWidth={
                                                                                            1.9
                                                                                        }
                                                                                    />
                                                                                ) : (
                                                                                    <CheckCheck
                                                                                        className="h-3.5 w-3.5"
                                                                                        strokeWidth={
                                                                                            1.9
                                                                                        }
                                                                                    />
                                                                                )}
                                                                                <span>
                                                                                    {formatDeliveryStatus(
                                                                                        deliveryStatus,
                                                                                    )}
                                                                                </span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {own ? avatar : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={submit} className="relative mt-1.5 2xl:mt-2">
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
                                    className="field app-scrollbar-hidden min-h-24 w-full resize-none overflow-y-auto pb-5 pr-14 text-[13px] 2xl:pb-18 2xl:pr-16 2xl:text-sm"
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
                                <div className="absolute bottom-4 left-3 flex items-center gap-2">
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
                                    className="app-button-primary absolute bottom-5 right-3 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full disabled:opacity-60 2xl:bottom-6 2xl:h-10 2xl:w-10"
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

            <Modal show={Boolean(activeImage)} onClose={closeImageCarousel} maxWidth="3xl" centered>
                {activeImage && (
                    <div className="space-y-4 rounded-[28px] bg-[rgba(8,12,20,0.94)] p-5 2xl:space-y-5 2xl:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div className="app-text-soft text-sm">
                                {activeImageIndex + 1} / {imageMessages.length}
                            </div>
                            <button
                                type="button"
                                onClick={closeImageCarousel}
                                className="app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full p-0"
                                aria-label="Close image carousel"
                            >
                                <X className="h-4 w-4" strokeWidth={1.9} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            {imageMessages.length > 1 ? (
                                <button
                                    type="button"
                                    onClick={showPreviousImage}
                                    className="app-button-secondary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-0"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="h-5 w-5" strokeWidth={1.9} />
                                </button>
                            ) : (
                                <div className="h-10 w-10 shrink-0" aria-hidden="true" />
                            )}
                            <div className="min-w-0 flex-1 overflow-hidden rounded-[24px]">
                                <img
                                    src={activeImage.attachment.url}
                                    alt={activeImage.attachment.name ?? 'Conversation image'}
                                    className="mx-auto max-h-[68vh] w-auto max-w-full object-contain"
                                />
                            </div>
                            {imageMessages.length > 1 ? (
                                <button
                                    type="button"
                                    onClick={showNextImage}
                                    className="app-button-secondary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-0"
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="h-5 w-5" strokeWidth={1.9} />
                                </button>
                            ) : (
                                <div className="h-10 w-10 shrink-0" aria-hidden="true" />
                            )}
                        </div>
                    </div>
                )}
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

function formatMessageTime(value) {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function formatDeliveryStatus(status) {
    return (
        {
            unread: 'Unread',
            received: 'Received',
            seen: 'Seen',
        }[status] ?? ''
    );
}

function formatMessageDateBadge(value) {
    if (!value) {
        return 'Unknown date';
    }

    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }

    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
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
