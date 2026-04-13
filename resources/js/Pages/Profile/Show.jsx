import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    BadgeX,
    Camera,
    Check,
    ChevronDown,
    Eye,
    Handshake,
    ImagePlus,
    Lock as LockIcon,
    MessageCircle,
    Move,
    Pencil,
    Rss,
    SlidersHorizontal,
    SquarePen,
    Trash2,
    TrendingUp,
    UserRoundCheck,
    UserRoundPlus,
    UserRoundX,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PostCard from '@/Components/App/PostCard';
import PostComposer from '@/Components/App/PostComposer';
import DangerButton from '@/Components/DangerButton';
import Dropdown from '@/Components/Dropdown';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import useLiveInertiaReload from '@/hooks/useLiveInertiaReload';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { clearProfileDraft, readProfileDraft } from '@/utils/profileDraft';

export default function Show({
    profile: initialProfile,
    relationship: initialRelationship,
    feed,
    suggestions = [],
    trends = [],
}) {
    const page = usePage();
    const { auth, errors, flash } = page.props;
    const pageUrl = page.url;
    const isOwnProfile = auth.user.id === initialProfile.id;
    const draftProfile =
        typeof window !== 'undefined' && isOwnProfile ? readProfileDraft(initialProfile.id) : null;
    const profile = draftProfile ? { ...initialProfile, ...draftProfile } : initialProfile;
    const [relationship, setRelationship] = useState(initialRelationship);
    const [relationshipActionPending, setRelationshipActionPending] = useState(false);
    const [profileCounts, setProfileCounts] = useState({
        followers: initialProfile.followers_count ?? 0,
        following: initialProfile.following_count ?? 0,
        friends: initialProfile.friends_count ?? 0,
    });
    const newPostId = flash?.new_post_id;
    const [targetPostId, setTargetPostId] = useState(null);
    const [targetCommentsOpen, setTargetCommentsOpen] = useState(false);
    const [targetCommentId, setTargetCommentId] = useState(null);
    const [composerOpen, setComposerOpen] = useState(false);
    const [avatarManagerOpen, setAvatarManagerOpen] = useState(false);
    const [coverManagerOpen, setCoverManagerOpen] = useState(false);
    const [visibleSuggestions, setVisibleSuggestions] = useState(suggestions);
    const [processingSuggestionIds, setProcessingSuggestionIds] = useState([]);
    const [confirmedSuggestionIds, setConfirmedSuggestionIds] = useState([]);
    const [exitingSuggestionIds, setExitingSuggestionIds] = useState([]);
    const [removedSuggestionIds, setRemovedSuggestionIds] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const canViewPosts = profile.can_view_posts ?? true;
    const isPrivateProfileLocked = profile.is_private && !isOwnProfile && !canViewPosts;
    const isPrivateProfileLockedForViewer = profile.is_private_for_viewer ?? isPrivateProfileLocked;
    const profileView = {
        ...profile,
        followers_count: profileCounts.followers,
        following_count: profileCounts.following,
        friends_count: profileCounts.friends,
    };

    useLiveInertiaReload(['feed', 'suggestions'], 5000);

    useEffect(() => {
        setRelationship(initialRelationship);
    }, [initialRelationship]);

    useEffect(() => {
        setProfileCounts({
            followers: initialProfile.followers_count ?? 0,
            following: initialProfile.following_count ?? 0,
            friends: initialProfile.friends_count ?? 0,
        });
    }, [
        initialProfile.followers_count,
        initialProfile.following_count,
        initialProfile.friends_count,
        initialProfile.id,
    ]);

    useEffect(() => {
        setVisibleSuggestions(
            suggestions.filter((person) => !removedSuggestionIds.includes(person.id)),
        );
    }, [suggestions, removedSuggestionIds]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const search = new URLSearchParams(window.location.search);
        const requestedPostId = Number(search.get('post'));
        const requestedCommentId = Number(search.get('comment_id'));

        setTargetPostId(
            Number.isFinite(requestedPostId) && requestedPostId > 0 ? requestedPostId : null,
        );
        setTargetCommentId(
            Number.isFinite(requestedCommentId) && requestedCommentId > 0
                ? requestedCommentId
                : null,
        );
        setTargetCommentsOpen(search.get('comments') === '1' || Boolean(requestedCommentId));
    }, [pageUrl]);

    useEffect(() => {
        if (!isOwnProfile || !draftProfile) {
            return;
        }

        router.replaceProp('auth.user', profile);
        router.replaceProp('profile', profile);

        if (draftProfile.username && draftProfile.username !== initialProfile.username) {
            const nextUrl = new URL(window.location.href);
            nextUrl.pathname = new URL(
                route('users.show', profile.username),
                window.location.origin,
            ).pathname;
            window.history.replaceState(window.history.state, '', nextUrl.toString());
        }

        clearProfileDraft(initialProfile.id);
    }, [draftProfile, initialProfile.id, initialProfile.username, isOwnProfile, profile]);

    const runRelationshipMutation = async ({ nextRelationship, nextProfileCounts, request }) => {
        if (relationshipActionPending) {
            return;
        }

        const previousRelationship = relationship;
        const previousProfileCounts = profileCounts;

        setRelationship(nextRelationship);
        if (nextProfileCounts) {
            setProfileCounts(nextProfileCounts);
        }
        setRelationshipActionPending(true);

        try {
            await request();
        } catch {
            setRelationship(previousRelationship);
            setProfileCounts(previousProfileCounts);
        } finally {
            setRelationshipActionPending(false);
        }
    };

    const submitFollow = async () => {
        if (relationship.is_following || relationship.has_pending_request) {
            await runRelationshipMutation({
                nextRelationship: {
                    ...relationship,
                    is_following: false,
                    has_pending_request: false,
                },
                nextProfileCounts: relationship.is_following
                    ? {
                          ...profileCounts,
                          followers: Math.max(0, profileCounts.followers - 1),
                      }
                    : null,
                request: () =>
                    window.axios.delete(route('users.unfollow', profile.id), {
                        headers: {
                            Accept: 'application/json',
                        },
                    }),
            });
            return;
        }

        await runRelationshipMutation({
            nextRelationship: {
                ...relationship,
                is_following: true,
                has_pending_request: false,
            },
            nextProfileCounts: profile.is_private
                ? null
                : {
                      ...profileCounts,
                      followers: profileCounts.followers + 1,
                  },
            request: () =>
                window.axios.post(route('users.follow', profile.id), null, {
                    headers: {
                        Accept: 'application/json',
                    },
                }),
        });
    };

    const submitFriendRequest = async () => {
        if (relationship.is_friend || relationship.has_pending_friend_request) {
            await runRelationshipMutation({
                nextRelationship: {
                    ...relationship,
                    is_friend: false,
                    has_pending_friend_request: false,
                    has_incoming_friend_request: false,
                },
                nextProfileCounts: relationship.is_friend
                    ? {
                          ...profileCounts,
                          friends: Math.max(0, profileCounts.friends - 1),
                      }
                    : null,
                request: () =>
                    window.axios.delete(route('users.friend-requests.destroy', profile.id), {
                        headers: {
                            Accept: 'application/json',
                        },
                    }),
            });
            return;
        }

        if (relationship.has_incoming_friend_request) {
            await runRelationshipMutation({
                nextRelationship: {
                    ...relationship,
                    is_friend: true,
                    has_pending_friend_request: false,
                    has_incoming_friend_request: false,
                },
                nextProfileCounts: {
                    ...profileCounts,
                    friends: profileCounts.friends + 1,
                },
                request: () =>
                    window.axios.post(route('users.friend-requests.accept', profile.id), null, {
                        headers: {
                            Accept: 'application/json',
                        },
                    }),
            });
            return;
        }

        await runRelationshipMutation({
            nextRelationship: {
                ...relationship,
                has_pending_friend_request: true,
                has_incoming_friend_request: false,
            },
            nextProfileCounts: null,
            request: () =>
                window.axios.post(route('users.friend-requests.store', profile.id), null, {
                    headers: {
                        Accept: 'application/json',
                    },
                }),
        });
    };

    const openPreview = (kind) => {
        if (isPrivateProfileLockedForViewer) {
            return;
        }

        if (kind === 'avatar' && !profile.avatar_url) {
            return;
        }

        if (kind === 'cover' && !profile.cover_url) {
            return;
        }

        setPreviewImage({
            kind,
            title: kind === 'avatar' ? 'Profile photo' : 'Cover image',
            src: kind === 'avatar' ? profile.avatar_url : profile.cover_url,
            alt: kind === 'avatar' ? `${profile.name} profile photo` : `${profile.name} cover`,
            style:
                kind === 'avatar'
                    ? imageTransformStyle({
                          x: profile.avatar_position_x,
                          y: profile.avatar_position_y,
                          zoom: profile.avatar_zoom,
                      })
                    : imageTransformStyle({
                          x: profile.cover_position_x,
                          y: profile.cover_position_y,
                          zoom: profile.cover_zoom,
                      }),
        });
    };

    const relationshipLabel = isPrivateProfileLockedForViewer
        ? relationship.has_pending_friend_request
            ? 'Request sent'
            : relationship.has_incoming_friend_request
              ? 'Accept friendship'
              : 'Send friendship request'
        : relationship.is_following
          ? 'Following'
          : 'Follow';
    const friendshipLabel = relationship.is_friend
        ? 'Friends'
        : relationship.has_incoming_friend_request
          ? 'Accept friend'
          : relationship.has_pending_friend_request
            ? 'Cancel request'
            : 'Add friend';

    const addSuggestion = async (person) => {
        if (processingSuggestionIds.includes(person.id)) {
            return;
        }

        setProcessingSuggestionIds((current) => [...current, person.id]);

        try {
            await window.axios.post(route('users.friend-requests.store', person.id), null, {
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

    return (
        <AuthenticatedLayout title={`${profile.name}`}>
            <section className="app-panel rounded-[28px] 2xl:rounded-[32px]">
                <div className="relative h-40 overflow-hidden rounded-t-[28px] 2xl:h-44 2xl:rounded-t-[32px]">
                    {profile.cover_url ? (
                        <button
                            type="button"
                            onClick={() => openPreview('cover')}
                            onContextMenu={(event) => event.preventDefault()}
                            className={`absolute inset-0 ${
                                isPrivateProfileLockedForViewer
                                    ? 'cursor-default'
                                    : 'cursor-zoom-in'
                            }`}
                            aria-label="Preview cover image"
                            disabled={isPrivateProfileLockedForViewer}
                        >
                            {isPrivateProfileLocked ? (
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${profile.cover_url})`,
                                        ...imageTransformStyle({
                                            x: profile.cover_position_x,
                                            y: profile.cover_position_y,
                                            zoom: profile.cover_zoom,
                                        }),
                                    }}
                                />
                            ) : (
                                <img
                                    src={profile.cover_url}
                                    alt={`${profile.name} cover`}
                                    className="absolute inset-0 h-full w-full object-cover"
                                    style={imageTransformStyle({
                                        x: profile.cover_position_x,
                                        y: profile.cover_position_y,
                                        zoom: profile.cover_zoom,
                                    })}
                                />
                            )}
                        </button>
                    ) : (
                        <div
                            className="absolute inset-0"
                            style={{ background: 'var(--vynce-cover-gradient)' }}
                        />
                    )}

                    {isOwnProfile && (
                        <button
                            type="button"
                            onClick={() => setCoverManagerOpen(true)}
                            className="app-button-secondary absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full backdrop-blur 2xl:right-4 2xl:top-4 2xl:h-11 2xl:w-11"
                            aria-label="Manage cover image"
                        >
                            <Camera className="h-4 w-4" strokeWidth={1.9} />
                        </button>
                    )}
                </div>

                <div className="p-5 2xl:p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div className="min-w-0 md:flex-1">
                            <div className="relative -mt-14 mb-3 w-fit 2xl:-mt-16 2xl:mb-4">
                                {profile.avatar_url ? (
                                    <button
                                        type="button"
                                        onClick={() => openPreview('avatar')}
                                        onContextMenu={(event) => event.preventDefault()}
                                        className={`overflow-hidden border-4 border-[var(--vynce-bg)] ${
                                            isPrivateProfileLockedForViewer
                                                ? 'cursor-default'
                                                : 'cursor-zoom-in'
                                        } ${
                                            isPrivateProfileLocked
                                                ? 'h-16 w-16 rounded-[20px] 2xl:h-20 2xl:w-20 2xl:rounded-[24px]'
                                                : 'h-20 w-20 rounded-[24px] 2xl:h-24 2xl:w-24 2xl:rounded-[28px]'
                                        }`}
                                        aria-label="Preview profile photo"
                                        disabled={isPrivateProfileLockedForViewer}
                                    >
                                        {isPrivateProfileLocked ? (
                                            <div
                                                className="h-full w-full bg-cover bg-center"
                                                style={{
                                                    backgroundImage: `url(${profile.avatar_url})`,
                                                    ...imageTransformStyle({
                                                        x: profile.avatar_position_x,
                                                        y: profile.avatar_position_y,
                                                        zoom: profile.avatar_zoom,
                                                    }),
                                                }}
                                            />
                                        ) : (
                                            <img
                                                src={profile.avatar_url}
                                                alt={profile.name}
                                                className="h-full w-full object-cover"
                                                style={imageTransformStyle({
                                                    x: profile.avatar_position_x,
                                                    y: profile.avatar_position_y,
                                                    zoom: profile.avatar_zoom,
                                                })}
                                            />
                                        )}
                                    </button>
                                ) : (
                                    <div className="app-panel-inset flex h-20 w-20 items-center justify-center rounded-[24px] border-4 border-[var(--vynce-bg)] text-xl font-bold 2xl:h-24 2xl:w-24 2xl:rounded-[28px] 2xl:text-2xl">
                                        {profile.name?.charAt(0)}
                                    </div>
                                )}

                                {isOwnProfile && (
                                    <button
                                        type="button"
                                        onClick={() => setAvatarManagerOpen(true)}
                                        className="app-button-primary absolute -bottom-2 -right-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--vynce-bg)] 2xl:h-10 2xl:w-10"
                                        aria-label="Manage profile photo"
                                    >
                                        <Camera className="h-4 w-4" strokeWidth={1.9} />
                                    </button>
                                )}
                            </div>

                            {profile.is_private &&
                                (isOwnProfile || isPrivateProfileLockedForViewer) && (
                                    <div
                                        className={`app-panel-inset inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium 2xl:text-xs ${
                                            isOwnProfile ? 'mt-1 ml-1' : 'mt-3'
                                        }`}
                                    >
                                        <LockIcon className="h-3.5 w-3.5" strokeWidth={1.9} />
                                        Private profile
                                    </div>
                                )}

                            {(errors.avatar ||
                                errors.cover ||
                                errors.zoom ||
                                errors.position_x ||
                                errors.position_y) && (
                                <div className="mb-3 space-y-1">
                                    {errors.avatar && (
                                        <div className="text-[13px] text-rose-300 2xl:text-sm">
                                            {errors.avatar}
                                        </div>
                                    )}
                                    {errors.cover && (
                                        <div className="text-[13px] text-rose-300 2xl:text-sm">
                                            {errors.cover}
                                        </div>
                                    )}
                                    {errors.zoom && (
                                        <div className="text-[13px] text-rose-300 2xl:text-sm">
                                            {errors.zoom}
                                        </div>
                                    )}
                                    {errors.position_x && (
                                        <div className="text-[13px] text-rose-300 2xl:text-sm">
                                            {errors.position_x}
                                        </div>
                                    )}
                                    {errors.position_y && (
                                        <div className="text-[13px] text-rose-300 2xl:text-sm">
                                            {errors.position_y}
                                        </div>
                                    )}
                                </div>
                            )}

                            <h1 className="text-[1.8rem] font-semibold 2xl:text-3xl">
                                {profile.name}
                            </h1>
                            <div className="app-text-muted mt-1 text-[13px] 2xl:text-sm">
                                @{profile.username}
                            </div>
                            {profile.bio && (
                                <p className="app-text-high mt-3 max-w-2xl whitespace-pre-wrap text-[13px] leading-6 2xl:mt-4 2xl:text-sm 2xl:leading-7">
                                    {profile.bio}
                                </p>
                            )}
                            <div className="app-text-muted mt-3 flex flex-wrap gap-3 text-[13px] 2xl:mt-4 2xl:gap-4 2xl:text-sm">
                                {profile.location && <span>{profile.location}</span>}
                                {profile.website_url && (
                                    <a
                                        href={profile.website_url}
                                        className="app-link min-w-0 break-all"
                                    >
                                        {profile.website_url}
                                    </a>
                                )}
                                <Link
                                    href={route('users.friends', profile.username)}
                                    className="app-link"
                                >
                                    {profileView.friends_count ?? 0} friends
                                </Link>
                                <Link
                                    href={route('users.followers', profile.username)}
                                    className="app-link"
                                >
                                    {profileView.followers_count ?? 0} followers
                                </Link>
                                <Link
                                    href={route('users.following', profile.username)}
                                    className="app-link"
                                >
                                    {profileView.following_count ?? 0} following
                                </Link>
                                <span>{profile.posts_count ?? 0} posts</span>
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-3">
                            {isOwnProfile ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setComposerOpen(true)}
                                        className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold 2xl:px-5 2xl:py-3 2xl:text-sm"
                                    >
                                        <SquarePen className="h-4 w-4" strokeWidth={1.9} />
                                        Create post
                                    </button>
                                    <Link
                                        href={route('profile.edit')}
                                        className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] 2xl:px-5 2xl:py-3 2xl:text-sm"
                                    >
                                        <Pencil className="h-4 w-4" strokeWidth={1.9} />
                                        Edit profile
                                    </Link>
                                </>
                            ) : isPrivateProfileLocked ? (
                                <button
                                    type="button"
                                    onClick={submitFriendRequest}
                                    disabled={relationshipActionPending}
                                    className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold 2xl:px-5 2xl:py-3 2xl:text-sm"
                                    aria-label={relationshipLabel}
                                    title={relationshipLabel}
                                >
                                    <Handshake className="h-4 w-4" strokeWidth={1.9} />
                                    {relationshipLabel}
                                </button>
                            ) : (
                                <>
                                    {relationship.can_follow &&
                                        (relationship.is_following ? (
                                            <Dropdown>
                                                <Dropdown.Trigger>
                                                    <button
                                                        type="button"
                                                        disabled={relationshipActionPending}
                                                        className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold 2xl:px-5 2xl:py-3 2xl:text-sm"
                                                        aria-label={relationshipLabel}
                                                        title={relationshipLabel}
                                                    >
                                                        <UserRoundCheck
                                                            className="h-4 w-4 2xl:h-5 2xl:w-5"
                                                            strokeWidth={1.9}
                                                        />
                                                        {relationshipLabel}
                                                        <ChevronDown
                                                            className="h-4 w-4 2xl:h-5 2xl:w-5"
                                                            strokeWidth={1.9}
                                                        />
                                                    </button>
                                                </Dropdown.Trigger>
                                                <Dropdown.Content
                                                    align="left"
                                                    width="40"
                                                    contentClasses="app-panel-inset rounded-[18px] p-1.5 2xl:rounded-[20px]"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={submitFollow}
                                                        disabled={relationshipActionPending}
                                                        className="flex w-full items-center gap-2 rounded-[14px] bg-transparent px-4 py-2.5 text-[13px] text-white transition hover:bg-[var(--vynce-surface-muted)] focus:bg-[var(--vynce-surface-muted)] focus:outline-none disabled:opacity-60 2xl:text-sm"
                                                    >
                                                        <UserRoundX
                                                            className="h-4 w-4"
                                                            strokeWidth={1.9}
                                                        />
                                                        Unfollow
                                                    </button>
                                                </Dropdown.Content>
                                            </Dropdown>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={submitFollow}
                                                disabled={relationshipActionPending}
                                                className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold 2xl:px-5 2xl:py-3 2xl:text-sm"
                                                aria-label={relationshipLabel}
                                                title={relationshipLabel}
                                            >
                                                <Rss
                                                    className="h-4 w-4 2xl:h-5 2xl:w-5"
                                                    strokeWidth={1.9}
                                                />
                                                {relationshipLabel}
                                            </button>
                                        ))}
                                    {relationship.can_friend &&
                                        (relationship.is_friend ? (
                                            <Dropdown>
                                                <Dropdown.Trigger>
                                                    <button
                                                        type="button"
                                                        disabled={relationshipActionPending}
                                                        className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold 2xl:px-5 2xl:py-3 2xl:text-sm"
                                                        aria-label={friendshipLabel}
                                                        title={friendshipLabel}
                                                    >
                                                        <Handshake
                                                            className="h-4 w-4 2xl:h-5 2xl:w-5"
                                                            strokeWidth={1.9}
                                                        />
                                                        {friendshipLabel}
                                                        <ChevronDown
                                                            className="h-4 w-4 2xl:h-5 2xl:w-5"
                                                            strokeWidth={1.9}
                                                        />
                                                    </button>
                                                </Dropdown.Trigger>
                                                <Dropdown.Content
                                                    align="left"
                                                    width="40"
                                                    contentClasses="app-panel-inset rounded-[18px] p-1.5 2xl:rounded-[20px]"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={submitFriendRequest}
                                                        disabled={relationshipActionPending}
                                                        className="flex w-full items-center gap-2 rounded-[14px] bg-transparent px-4 py-2.5 text-[13px] text-white transition hover:bg-[var(--vynce-surface-muted)] focus:bg-[var(--vynce-surface-muted)] focus:outline-none disabled:opacity-60 2xl:text-sm"
                                                    >
                                                        <BadgeX
                                                            className="h-4 w-4"
                                                            strokeWidth={1.9}
                                                        />
                                                        Unfriend
                                                    </button>
                                                </Dropdown.Content>
                                            </Dropdown>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={submitFriendRequest}
                                                disabled={relationshipActionPending}
                                                className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold 2xl:px-5 2xl:py-3 2xl:text-sm"
                                                aria-label={friendshipLabel}
                                                title={friendshipLabel}
                                            >
                                                <UserRoundPlus
                                                    className="h-4 w-4 2xl:h-5 2xl:w-5"
                                                    strokeWidth={1.9}
                                                />
                                                {friendshipLabel}
                                            </button>
                                        ))}
                                    {relationship.can_message && (
                                        <Link
                                            href={route('messages.start', profile.id)}
                                            method="post"
                                            as="button"
                                            className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] 2xl:px-5 2xl:py-3 2xl:text-sm"
                                            aria-label="Message"
                                            title="Message"
                                        >
                                            <MessageCircle
                                                className="h-4 w-4 2xl:h-5 2xl:w-5"
                                                strokeWidth={1.9}
                                            />
                                            Message
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {isOwnProfile && (
                <>
                    <Modal
                        show={composerOpen}
                        onClose={() => setComposerOpen(false)}
                        maxWidth="3xl"
                        centered
                    >
                        <PostComposer onSuccess={() => setComposerOpen(false)} />
                    </Modal>
                    <ProfileImageManagerModal
                        kind="avatar"
                        title="Profile photo"
                        show={avatarManagerOpen}
                        onClose={() => setAvatarManagerOpen(false)}
                        imageUrl={profile.avatar_url}
                        zoom={profile.avatar_zoom}
                        positionX={profile.avatar_position_x}
                        positionY={profile.avatar_position_y}
                    />
                    <ProfileImageManagerModal
                        kind="cover"
                        title="Cover image"
                        show={coverManagerOpen}
                        onClose={() => setCoverManagerOpen(false)}
                        imageUrl={profile.cover_url}
                        zoom={profile.cover_zoom}
                        positionX={profile.cover_position_x}
                        positionY={profile.cover_position_y}
                    />
                </>
            )}

            <Modal
                show={Boolean(previewImage)}
                onClose={() => setPreviewImage(null)}
                maxWidth="7xl"
                centered
                panel={false}
            >
                {previewImage ? (
                    <div className="relative mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center">
                        <div className="app-panel w-full overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(8,12,20,0.96)] p-4 shadow-[var(--vynce-shadow-lg)] sm:p-5">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-base font-semibold 2xl:text-lg">
                                        {previewImage.title}
                                    </div>
                                    <div className="app-text-soft mt-1 text-[13px] 2xl:text-sm">
                                        Previewing {profile.name}&apos;s {previewImage.kind}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setPreviewImage(null)}
                                    className="app-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full"
                                    aria-label="Close preview"
                                >
                                    <X className="h-4 w-4" strokeWidth={1.9} />
                                </button>
                            </div>

                            <div
                                className={`overflow-hidden bg-[rgba(3,7,12,0.92)] ${
                                    previewImage.kind === 'avatar'
                                        ? 'mx-auto aspect-square max-w-[min(100%,28rem)] rounded-[28px]'
                                        : 'h-[min(72vh,36rem)] rounded-[28px]'
                                }`}
                            >
                                <img
                                    src={previewImage.src}
                                    alt={previewImage.alt}
                                    className="h-full w-full object-cover"
                                    style={previewImage.style}
                                />
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <section className="mt-5 grid gap-5 min-[1246px]:grid-cols-[minmax(0,1fr)_20rem] 2xl:min-[1246px]:grid-cols-[minmax(0,1fr)_22rem] 2xl:mt-6 2xl:gap-6">
                <div className="space-y-3 2xl:space-y-4">
                    {isPrivateProfileLocked ? (
                        <div className="app-panel-inset rounded-[24px] p-6 2xl:rounded-[28px] 2xl:p-8">
                            <div className="flex items-center gap-2 text-[13px] font-semibold 2xl:text-sm">
                                <LockIcon className="h-4 w-4" strokeWidth={1.9} />
                                Private account
                            </div>
                            <p className="app-text-soft mt-3 max-w-2xl text-[13px] leading-6 2xl:text-sm 2xl:leading-7">
                                Send a friendship request to view this account&apos;s posts and
                                updates.
                            </p>
                            <button
                                type="button"
                                onClick={submitFriendRequest}
                                className="app-button-primary mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold 2xl:px-5 2xl:py-3 2xl:text-sm"
                            >
                                <Handshake className="h-4 w-4" strokeWidth={1.9} />
                                {relationshipLabel}
                            </button>
                        </div>
                    ) : feed.data.length === 0 ? (
                        <div className="app-dashed-panel app-text-muted rounded-[24px] p-6 text-[13px] 2xl:rounded-[28px] 2xl:p-8 2xl:text-sm">
                            No posts yet. This space will fill with updates, threads, and media as
                            soon as the first post goes live.
                        </div>
                    ) : (
                        feed.data.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                profileUsername={profile.username}
                                showProfileRepostLabel
                                highlighted={
                                    Number(newPostId) === post.id || targetPostId === post.id
                                }
                                openCommentsByDefault={
                                    targetCommentsOpen && targetPostId === post.id
                                }
                                targetCommentId={targetPostId === post.id ? targetCommentId : null}
                                profileRepostLabel={
                                    isOwnProfile ? 'Reposted' : `Reposted by @${profile.username}`
                                }
                            />
                        ))
                    )}
                </div>

                <div className="space-y-3 min-[1246px]:sticky min-[1246px]:top-6 min-[1246px]:h-fit min-[1246px]:self-start 2xl:space-y-4">
                    <div className="app-panel rounded-[24px] p-4 2xl:rounded-[28px] 2xl:p-5">
                        <div className="flex items-center gap-2 text-[13px] font-semibold 2xl:text-sm">
                            <TrendingUp className="h-4 w-4" strokeWidth={1.9} />
                            Trending now
                        </div>
                        <div className="mt-3 space-y-2.5 2xl:mt-4 2xl:space-y-3">
                            {trends.length === 0 ? (
                                <div className="app-text-soft rounded-[18px] px-2 py-1 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                                    No trending tags yet.
                                </div>
                            ) : (
                                trends.map((trend) => (
                                    <Link
                                        key={trend.slug}
                                        href={route('feed.search', {
                                            q: trend.slug,
                                            filter: 'posts',
                                        })}
                                        className="block rounded-[18px] px-2 py-1 transition hover:bg-[rgba(255,255,255,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                    >
                                        <div className="text-[13px] 2xl:text-sm">
                                            #{trend.label}
                                        </div>
                                        <div className="app-text-soft text-[11px] 2xl:text-xs">
                                            {trend.posts}
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="app-panel rounded-[24px] p-4 2xl:rounded-[28px] 2xl:p-5">
                        <div className="flex items-center gap-2 text-[13px] font-semibold 2xl:text-sm">
                            <UserRoundPlus className="h-4 w-4" strokeWidth={1.9} />
                            Add people
                        </div>
                        <div className="mt-3 space-y-3 2xl:mt-4 2xl:space-y-4">
                            {visibleSuggestions.length === 0 ? (
                                <div className="app-text-soft text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                                    You’re caught up for now. As more people join your orbit,
                                    they’ll show up here.
                                </div>
                            ) : (
                                visibleSuggestions.map((person) => {
                                    const isProcessing = processingSuggestionIds.includes(
                                        person.id,
                                    );
                                    const isConfirmed = confirmedSuggestionIds.includes(person.id);
                                    const isExiting = exitingSuggestionIds.includes(person.id);
                                    const suggestionActionLabel = `Send friendship request to ${person.name}`;

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
                                                            {personInitials(person.name)}
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
                                                    aria-label={suggestionActionLabel}
                                                >
                                                    {isConfirmed ? (
                                                        <Check
                                                            className="h-4 w-4"
                                                            strokeWidth={2.2}
                                                        />
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
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

function personInitials(name) {
    return (
        name
            ?.split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() ?? 'U'
    );
}

function ProfileImageManagerModal({
    kind,
    title,
    show,
    onClose,
    imageUrl,
    zoom,
    positionX,
    positionY,
}) {
    const [pendingFile, setPendingFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(imageUrl);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const uploadKey = kind;
    const uploadRoute =
        kind === 'avatar' ? route('profile.avatar.update') : route('profile.cover.update');
    const transformRoute =
        kind === 'avatar'
            ? route('profile.avatar.transform.update')
            : route('profile.cover.transform.update');
    const deleteRoute =
        kind === 'avatar' ? route('profile.avatar.destroy') : route('profile.cover.destroy');

    const transformForm = useForm({
        zoom,
        position_x: positionX,
        position_y: positionY,
    });
    const { data, setData } = transformForm;
    const deleteForm = useForm({});
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!show) {
            return;
        }

        setPendingFile(null);
        setPreviewUrl(imageUrl);
        setData({
            zoom,
            position_x: positionX,
            position_y: positionY,
        });
        setConfirmingDelete(false);
    }, [show, imageUrl, zoom, positionX, positionY, setData]);

    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileSelected = (file) => {
        if (!file) {
            return;
        }

        if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }

        setPendingFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setData({
            zoom: 1,
            position_x: 50,
            position_y: 50,
        });
        setConfirmingDelete(false);
    };

    const saveAdjustments = (event) => {
        event.preventDefault();

        if (pendingFile) {
            router.post(
                uploadRoute,
                {
                    [uploadKey]: pendingFile,
                    zoom: data.zoom,
                    position_x: data.position_x,
                    position_y: data.position_y,
                },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: () => onClose(),
                },
            );

            return;
        }

        transformForm.patch(transformRoute, {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const destroyImage = () => {
        deleteForm.delete(deleteRoute, {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const previewStyle = imageTransformStyle({
        x: data.position_x,
        y: data.position_y,
        zoom: data.zoom,
    });

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="space-y-5 p-5 2xl:space-y-6 2xl:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-base font-semibold 2xl:text-lg">
                            <Eye className="h-4 w-4 2xl:h-5 2xl:w-5" strokeWidth={1.9} />
                            {title}
                        </div>
                        <p className="app-text-soft mt-2 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                            Upload a new image, preview it at full size, fine-tune the framing, or
                            remove it completely.
                        </p>
                    </div>
                </div>

                <div
                    className={`app-panel-inset relative overflow-hidden ${
                        kind === 'avatar'
                            ? 'mx-auto h-64 w-64 rounded-[30px] 2xl:h-72 2xl:w-72 2xl:rounded-[36px]'
                            : 'h-56 rounded-[24px] 2xl:h-64 2xl:rounded-[28px]'
                    }`}
                >
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={title}
                            className="h-full w-full object-cover"
                            style={previewStyle}
                        />
                    ) : (
                        <div className="app-text-soft flex h-full items-center justify-center px-6 text-center text-[13px] leading-6 2xl:text-sm 2xl:leading-7">
                            No {kind === 'avatar' ? 'profile photo' : 'cover image'} yet. Add one
                            here and it will appear right away on your profile.
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                            handleFileSelected(event.target.files?.[0] ?? null);
                            event.target.value = '';
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="app-button-primary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold 2xl:px-4 2xl:text-sm"
                        disabled={transformForm.processing || deleteForm.processing}
                    >
                        <ImagePlus className="h-4 w-4" strokeWidth={1.9} />
                        {previewUrl ? 'Replace image' : 'Add image'}
                    </button>

                    {imageUrl && !pendingFile && (
                        <DangerButton
                            type="button"
                            onClick={() => setConfirmingDelete(true)}
                            className="rounded-full px-3.5 py-2 text-[13px] normal-case tracking-normal 2xl:px-4 2xl:text-sm"
                            disabled={deleteForm.processing}
                        >
                            <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.9} />
                            Delete image
                        </DangerButton>
                    )}
                </div>

                {confirmingDelete && imageUrl && !pendingFile && (
                    <div className="app-panel-inset space-y-4 rounded-[20px] p-4 2xl:rounded-2xl">
                        <div>
                            <div className="text-[13px] font-semibold 2xl:text-sm">
                                Delete this image?
                            </div>
                            <p className="app-text-soft mt-1 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                                This will remove the current{' '}
                                {kind === 'avatar' ? 'profile photo' : 'cover image'} from your
                                profile.
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-end gap-3">
                            <SecondaryButton
                                type="button"
                                onClick={() => setConfirmingDelete(false)}
                                className="rounded-full px-3.5 py-2 text-[13px] normal-case tracking-normal 2xl:px-4 2xl:text-sm"
                            >
                                Cancel
                            </SecondaryButton>
                            <DangerButton
                                type="button"
                                onClick={destroyImage}
                                className="rounded-full px-3.5 py-2 text-[13px] normal-case tracking-normal 2xl:px-4 2xl:text-sm"
                                disabled={deleteForm.processing}
                            >
                                Confirm delete
                            </DangerButton>
                        </div>
                    </div>
                )}

                {previewUrl && (
                    <form onSubmit={saveAdjustments} className="space-y-4 2xl:space-y-5">
                        <div className="grid gap-3 md:grid-cols-3 2xl:gap-4">
                            <RangeField
                                icon={SlidersHorizontal}
                                label="Zoom"
                                value={data.zoom}
                                min={1}
                                max={3}
                                step={0.05}
                                displayValue={`${Number(data.zoom).toFixed(2)}x`}
                                onChange={(value) => setData('zoom', value)}
                            />
                            <RangeField
                                icon={Move}
                                label="Horizontal"
                                value={data.position_x}
                                min={0}
                                max={100}
                                step={1}
                                displayValue={`${data.position_x}%`}
                                onChange={(value) => setData('position_x', value)}
                            />
                            <RangeField
                                icon={Move}
                                label="Vertical"
                                value={data.position_y}
                                min={0}
                                max={100}
                                step={1}
                                displayValue={`${data.position_y}%`}
                                onChange={(value) => setData('position_y', value)}
                            />
                        </div>

                        <div className="flex flex-wrap justify-end gap-3">
                            <SecondaryButton
                                type="button"
                                onClick={onClose}
                                className="rounded-full px-3.5 py-2 text-[13px] normal-case tracking-normal 2xl:px-4 2xl:text-sm"
                            >
                                Cancel
                            </SecondaryButton>
                            <button
                                type="submit"
                                className="app-button-primary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold 2xl:px-4 2xl:text-sm"
                                disabled={transformForm.processing}
                            >
                                <Camera className="h-4 w-4" strokeWidth={1.9} />
                                {pendingFile ? 'Save image' : 'Save framing'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}

function RangeField({ icon: Icon, label, value, min, max, step, displayValue, onChange }) {
    return (
        <div className="app-panel-inset rounded-[20px] p-3.5 2xl:rounded-2xl 2xl:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[13px] font-medium 2xl:text-sm">
                    <Icon className="h-4 w-4" strokeWidth={1.9} />
                    {label}
                </div>
                <div className="app-text-soft text-[11px] 2xl:text-xs">{displayValue}</div>
            </div>

            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="w-full accent-[var(--vynce-accent)]"
            />
        </div>
    );
}

function imageTransformStyle({ x, y, zoom }) {
    return {
        objectPosition: `${x}% ${y}%`,
        transform: `scale(${zoom})`,
        transformOrigin: `${x}% ${y}%`,
    };
}
