import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { Bell, Heart, Image, MessageCircle, Repeat2, SendHorizontal } from 'lucide-react';
import linaAvatar from '@/../assets/lina.jpg';
import nightViewImage from '@/../assets/night-view.jpg';
import otherCommentAvatar from '@/../assets/other-comment.jpg';
import otherCommentAvatarTwo from '@/../assets/other-comment2.jpg';
import userAvatar from '@/../assets/user.jpg';

const quickSignals = [
    { icon: Bell, label: '12 new mentions', className: 'auth-signal-card auth-signal-card--top' },
    {
        icon: Heart,
        label: '326 reactions in the last hour',
        className: 'auth-signal-card auth-signal-card--middle',
    },
    {
        icon: MessageCircle,
        label: 'Conversation picked up again',
        className: 'auth-signal-card auth-signal-card--bottom',
    },
];

export default function GuestLayout({ children }) {
    return (
        <div className="app-page-shell app-page-shell--guest min-h-screen overflow-x-hidden">
            <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
                <div className="relative hidden overflow-hidden lg:flex">
                    <div className="auth-ambient auth-ambient--one" />
                    <div className="auth-ambient auth-ambient--two" />
                    <div className="auth-grid-pattern" />

                    <div className="relative z-10 flex min-h-screen w-full flex-col px-8 pb-5 pt-4 xl:px-16 xl:pb-8 xl:pt-5">
                        <Link
                            href="/"
                            className="auth-brand-lockup inline-flex items-center gap-0 self-start"
                        >
                            <ApplicationLogo className="auth-wordmark-icon h-11 w-11 fill-current xl:h-12 xl:w-12" />
                            <div>
                                <div className="auth-wordmark text-[1.8rem] font-semibold xl:text-3xl">
                                    ynce
                                </div>
                            </div>
                        </Link>

                        <div className="relative mt-4 flex-1 xl:mt-5">
                            <div className="auth-app-stage">
                                <div className="auth-app-window">
                                    <div className="auth-app-window__topbar">
                                        <div className="auth-window-dots">
                                            <span />
                                            <span />
                                            <span />
                                        </div>
                                        <div className="auth-window-title">Home</div>
                                        <div className="auth-window-status">Live now</div>
                                    </div>

                                    <div className="auth-app-window__body">
                                        <div className="auth-composer-card">
                                            <img
                                                src={userAvatar}
                                                alt="Current user"
                                                className="auth-avatar-image auth-avatar-image--composer"
                                            />
                                            <div className="auth-composer-body">
                                                <div className="auth-composer-pill">
                                                    <span
                                                        className="auth-composer-typing"
                                                        data-text="Sharing a new photo set from tonight's meetup..."
                                                        aria-label="Sharing a new photo set from tonight's meetup..."
                                                    />
                                                </div>
                                                <div className="auth-composer-actions">
                                                    <div className="auth-composer-action">
                                                        <Image className="h-4 w-4" />
                                                        Media
                                                    </div>
                                                    <div className="auth-composer-action">
                                                        <MessageCircle className="h-4 w-4" />
                                                        Thread
                                                    </div>
                                                    <div className="auth-composer-send">
                                                        <SendHorizontal className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="auth-post-card">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={linaAvatar}
                                                    alt="Lina Mercer"
                                                    className="auth-avatar-image"
                                                />
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold">
                                                        Lina Mercer
                                                    </div>
                                                    <div className="app-text-muted text-xs">
                                                        @lina.mercer · 2m
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="mt-4 text-sm leading-7 text-[rgba(241,235,251,0.9)]">
                                                Tonight&apos;s view from the overlook was unreal.
                                                Everyone just stopped to take in the whole city at
                                                once.
                                            </p>

                                            <div className="auth-post-media">
                                                <img
                                                    src={nightViewImage}
                                                    alt="Night city view"
                                                    className="auth-post-media__image"
                                                />
                                                <div className="auth-post-media__badge">
                                                    24 photos
                                                </div>
                                                <div className="auth-post-media__shine" />
                                            </div>

                                            <div className="auth-post-stats">
                                                <div className="auth-post-stat auth-post-stat--liked">
                                                    <Heart className="h-4 w-4 fill-current" />
                                                    1.8k
                                                </div>
                                                <div className="auth-post-stat">
                                                    <Repeat2 className="h-4 w-4" />
                                                    214
                                                </div>
                                                <div className="auth-post-stat">
                                                    <MessageCircle className="h-4 w-4" />
                                                    89
                                                </div>
                                            </div>
                                        </div>

                                        <div className="auth-thread-card">
                                            <div className="auth-thread-card__header">
                                                <div className="text-sm font-semibold">
                                                    Active thread
                                                </div>
                                                <div className="auth-thread-live">
                                                    <span className="auth-thread-live__dot" />3
                                                    typing
                                                </div>
                                            </div>

                                            <div className="auth-chat-list">
                                                <div className="auth-chat-row auth-chat-row--left">
                                                    <img
                                                        src={otherCommentAvatar}
                                                        alt="Noa Olsen"
                                                        className="auth-avatar-image auth-avatar-image--commenter-one auth-avatar-image--small"
                                                    />
                                                    <div className="auth-chat-bubble">
                                                        That skyline looks unreal from up there.
                                                    </div>
                                                </div>
                                                <div className="auth-chat-row auth-chat-row--right">
                                                    <div className="auth-chat-bubble auth-chat-bubble--accent">
                                                        We stayed up there for twenty minutes just
                                                        watching the lights shift.
                                                    </div>
                                                </div>
                                                <div className="auth-chat-row auth-chat-row--left auth-chat-row--typing">
                                                    <img
                                                        src={otherCommentAvatarTwo}
                                                        alt="Kara Ali"
                                                        className="auth-avatar-image auth-avatar-image--commenter-two auth-avatar-image--small"
                                                    />
                                                    <div className="auth-typing-bubble">
                                                        <span />
                                                        <span />
                                                        <span />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {quickSignals.map(({ icon: Icon, label, className }) => (
                                <div key={label} className={className}>
                                    <div className="auth-signal-icon">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="auth-form-panel flex min-h-screen items-start justify-center px-4 pb-8 pt-8 sm:px-6 lg:rounded-none lg:px-8 lg:pt-12 xl:px-14 xl:pt-[4.5rem] 2xl:pt-32">
                    <div className="auth-form-floating app-scrollbar-hidden max-w-xl">
                        <div className="mb-6 lg:hidden">
                            <Link
                                href="/"
                                className="auth-brand-lockup auth-brand-lockup--mobile inline-flex items-center gap-0"
                            >
                                <ApplicationLogo className="auth-wordmark-icon auth-wordmark-icon--mobile h-9 w-9 fill-current sm:h-10 sm:w-10" />
                                <div>
                                    <div className="auth-wordmark auth-wordmark--mobile text-[1.7rem] font-semibold sm:text-2xl">
                                        ynce
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
