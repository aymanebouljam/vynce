import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function Index({ conversations, activeConversation, messages }) {
    const { auth } = usePage().props;
    const form = useForm({
        body: '',
    });
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

    return (
        <AuthenticatedLayout title="Messages">
            <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
                <section className="app-panel rounded-[32px] p-5">
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={goBack}
                            className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
                            Back
                        </button>
                        <h1 className="mt-4 text-xl font-semibold">Messages</h1>
                        <p className="app-text-soft mt-2 text-sm leading-6">
                            Start from someone’s profile, then keep the conversation going here.
                        </p>
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
                                            : 'app-card-inset hover:bg-[var(--vynce-surface-muted)]'
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
                                            <div className="app-text-soft truncate text-xs">
                                                @{conversation.participant?.username ?? 'unknown'}
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
                                    className="app-button-primary self-end rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    )}
                </section>
            </div>
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
