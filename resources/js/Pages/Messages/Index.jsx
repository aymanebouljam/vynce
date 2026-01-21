import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, PenSquare } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function Index({ conversations, activeConversation, contacts = [], messages }) {
    const { auth } = usePage().props;
    const form = useForm({
        body: '',
    });
    const [pickerOpen, setPickerOpen] = useState(false);
    const conversationParticipantIds = useMemo(
        () => conversations.map((conversation) => conversation.participant?.id).filter(Boolean),
        [conversations],
    );
    const availableContacts = useMemo(
        () => contacts.filter((contact) => !conversationParticipantIds.includes(contact.id)),
        [contacts, conversationParticipantIds],
    );

    const goBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        router.visit(route('feed.home'));
    };

    const submit = (event) => {
        event.preventDefault();

        if (!activeConversation || !form.data.body.trim()) {
            return;
        }

        form.post(route('messages.messages.store', activeConversation.id), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const startConversation = (contactId) => {
        router.post(route('messages.start', contactId), {}, { preserveScroll: true });
        setPickerOpen(false);
    };

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

                    {conversations.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[28px] p-5 text-sm leading-6">
                            No conversations yet. Visit a profile and tap Message to open a direct
                            chat.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {conversations.map((conversation) => (
                                <Link
                                    key={conversation.id}
                                    href={route('messages.show', conversation.id)}
                                    className={`block rounded-[24px] p-4 transition ${
                                        activeConversation?.id === conversation.id
                                            ? 'app-nav-link-active'
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

                <section className="app-panel rounded-[32px] p-5">
                    {!activeConversation ? (
                        <div className="app-dashed-panel app-text-muted flex min-h-[420px] items-center justify-center rounded-[28px] p-8 text-center text-sm leading-7">
                            Pick a conversation from the left, or start one from a user profile.
                        </div>
                    ) : (
                        <div className="flex min-h-[420px] flex-col">
                            <div className="app-panel-inset mb-5 flex items-center gap-3 rounded-[24px] px-4 py-4">
                                <div className="app-avatar-fallback flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold">
                                    {initialsFor(activeConversation.participant?.name)}
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate font-semibold">
                                        {activeConversation.participant?.name}
                                    </div>
                                    <div className="app-text-soft truncate text-sm">
                                        @{activeConversation.participant?.username}
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    <Link
                                        href={route(
                                            'users.show',
                                            activeConversation.participant?.username,
                                        )}
                                        className="app-button-secondary rounded-full px-4 py-2 text-sm"
                                    >
                                        View profile
                                    </Link>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3">
                                {messages.map((message) => {
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

                            <form
                                onSubmit={submit}
                                className="mt-5 flex flex-col gap-3 md:flex-row"
                            >
                                <textarea
                                    value={form.data.body}
                                    onChange={(event) => form.setData('body', event.target.value)}
                                    className="field app-scrollbar-hidden min-h-24 flex-1 resize-none overflow-y-auto text-sm"
                                    placeholder={`Message ${activeConversation.participant?.name}...`}
                                />
                                <button
                                    type="submit"
                                    disabled={form.processing || !form.data.body.trim()}
                                    className="app-button-primary self-end rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
                                >
                                    Send
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
