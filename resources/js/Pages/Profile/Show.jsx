import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import PostComposer from '@/Components/App/PostComposer';
import PostCard from '@/Components/App/PostCard';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Camera,
    Check,
    Eye,
    ImagePlus,
    Move,
    Pencil,
    SlidersHorizontal,
    Trash2,
    TrendingUp,
    UserPlus,
} from 'lucide-react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const trends = [
    { label: 'Design systems', posts: '1,284 posts today' },
    { label: 'Launch notes', posts: '842 posts today' },
    { label: 'Creator workflow', posts: '511 posts today' },
];

export default function Show({
    profile,
    relationship,
    feed,
    pendingRequests = [],
    suggestions = [],
}) {
    const { auth, errors, flash } = usePage().props;
    const followForm = useForm({});
    const isOwnProfile = auth.user.id === profile.id;
    const newPostId = flash?.new_post_id;
    const [composerOpen, setComposerOpen] = useState(false);
    const [avatarManagerOpen, setAvatarManagerOpen] = useState(false);
    const [coverManagerOpen, setCoverManagerOpen] = useState(false);
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

    const submitFollow = () => {
        if (relationship.is_following || relationship.has_pending_request) {
            followForm.delete(route('users.unfollow', profile.id));
            return;
        }

        followForm.post(route('users.follow', profile.id));
    };

    const submitFriendRequest = () => {
        if (relationship.is_friend || relationship.has_pending_friend_request) {
            followForm.delete(route('users.friend-requests.destroy', profile.id));
            return;
        }

        if (relationship.has_incoming_friend_request) {
            followForm.post(route('users.friend-requests.accept', profile.id));
            return;
        }

        followForm.post(route('users.friend-requests.store', profile.id));
    };

    const relationshipLabel = profile.is_private
        ? relationship.is_following
            ? 'Friends'
            : relationship.has_pending_request
              ? 'Cancel invite'
              : 'Add'
        : relationship.is_following
          ? 'Unfollow'
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

    return (
        <AuthenticatedLayout title={`${profile.name}`}>
            <section className="app-panel overflow-hidden rounded-[28px] 2xl:rounded-[32px]">
                <div className="relative h-40 overflow-hidden 2xl:h-44">
                    {profile.cover_url ? (
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
                        <div>
                            <div className="relative -mt-14 mb-3 w-fit 2xl:-mt-16 2xl:mb-4">
                                {profile.avatar_url ? (
                                    <div className="h-20 w-20 overflow-hidden rounded-[24px] border-4 border-[var(--vynce-bg)] 2xl:h-24 2xl:w-24 2xl:rounded-[28px]">
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
                                    </div>
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
                            <div
                                className="app-pill mt-3 inline-flex rounded-full px-3 py-1 text-[11px] 2xl:text-xs"
                                style={{ background: 'var(--vynce-surface-inset-muted)' }}
                            >
                                {profile.is_private ? 'Private profile' : 'Public profile'}
                            </div>
                            {profile.bio && (
                                <p className="app-text-high mt-3 max-w-2xl whitespace-pre-wrap text-[13px] leading-6 2xl:mt-4 2xl:text-sm 2xl:leading-7">
                                    {profile.bio}
                                </p>
                            )}
                            <div className="app-text-muted mt-3 flex flex-wrap gap-3 text-[13px] 2xl:mt-4 2xl:gap-4 2xl:text-sm">
                                {profile.location && <span>{profile.location}</span>}
                                {profile.website_url && (
                                    <a href={profile.website_url} className="app-link">
                                        {profile.website_url}
                                    </a>
                                )}
                                <Link
                                    href={route('users.friends', profile.username)}
                                    className="app-link"
                                >
                                    {profile.friends_count ?? 0} friends
                                </Link>
                                <Link
                                    href={route('users.followers', profile.username)}
                                    className="app-link"
                                >
                                    {profile.followers_count ?? 0} followers
                                </Link>
                                <Link
                                    href={route('users.following', profile.username)}
                                    className="app-link"
                                >
                                    {profile.following_count ?? 0} following
                                </Link>
                                <span>{profile.posts_count ?? 0} posts</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {isOwnProfile ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setComposerOpen(true)}
                                        className="app-button-primary rounded-full px-4 py-2.5 text-[13px] font-semibold 2xl:px-5 2xl:py-3 2xl:text-sm"
                                    >
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
                            ) : (
                                <>
                                    {relationship.can_follow && (
                                        <button
                                            type="button"
                                            onClick={submitFollow}
                                            className="app-button-primary rounded-full px-4 py-2.5 text-[13px] font-semibold 2xl:px-5 2xl:py-3 2xl:text-sm"
                                        >
                                            {relationshipLabel}
                                        </button>
                                    )}
                                    {relationship.can_friend && (
                                        <button
                                            type="button"
                                            onClick={submitFriendRequest}
                                            className="app-button-secondary rounded-full px-4 py-2.5 text-[13px] font-semibold 2xl:px-5 2xl:py-3 2xl:text-sm"
                                        >
                                            {friendshipLabel}
                                        </button>
                                    )}
                                    {relationship.can_message && (
                                        <Link
                                            href={route('messages.start', profile.id)}
                                            method="post"
                                            as="button"
                                            className="app-button-secondary rounded-full px-4 py-2.5 text-[13px] 2xl:px-5 2xl:py-3 2xl:text-sm"
                                        >
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

            <section className="mt-5 grid gap-5 min-[1246px]:grid-cols-[minmax(0,1fr)_20rem] 2xl:min-[1246px]:grid-cols-[minmax(0,1fr)_22rem] 2xl:mt-6 2xl:gap-6">
                <div className="space-y-3 2xl:space-y-4">
                    {feed.data.length === 0 ? (
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
                                highlighted={Number(newPostId) === post.id}
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

                    {pendingRequests.length > 0 && (
                        <div className="app-panel rounded-[24px] p-4 2xl:rounded-[28px] 2xl:p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-[13px] font-semibold 2xl:text-sm">
                                    Invitations
                                </div>
                                <div className="app-text-soft text-[11px] 2xl:text-xs">
                                    {pendingRequests.length} pending
                                </div>
                            </div>
                            <div className="mt-3 space-y-2.5 2xl:mt-4 2xl:space-y-3">
                                {pendingRequests.map((person) => (
                                    <div
                                        key={person.id}
                                        className="app-card-inset rounded-[18px] p-2.5 2xl:rounded-2xl 2xl:p-3"
                                    >
                                        <div className="text-[13px] font-medium 2xl:text-sm">
                                            {person.name}
                                        </div>
                                        <div className="app-text-muted text-[11px] 2xl:text-xs">
                                            @{person.username}
                                        </div>
                                        <div className="mt-2.5 flex gap-2 2xl:mt-3">
                                            <Link
                                                href={route(
                                                    'users.friend-requests.accept',
                                                    person.id,
                                                )}
                                                method="post"
                                                as="button"
                                                className="app-button-primary rounded-full px-3 py-1.5 text-[11px] font-semibold 2xl:py-2 2xl:text-xs"
                                            >
                                                Accept
                                            </Link>
                                            <Link
                                                href={route(
                                                    'users.friend-requests.reject',
                                                    person.id,
                                                )}
                                                method="delete"
                                                as="button"
                                                className="app-button-secondary rounded-full px-3 py-1.5 text-[11px] 2xl:py-2 2xl:text-xs"
                                            >
                                                Refuse
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="app-panel rounded-[24px] p-4 2xl:rounded-[28px] 2xl:p-5">
                        <div className="flex items-center gap-2 text-[13px] font-semibold 2xl:text-sm">
                            <UserPlus className="h-4 w-4" strokeWidth={1.9} />
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
                                                    aria-label={
                                                        person.is_private
                                                            ? `Add ${person.name}`
                                                            : `Follow ${person.name}`
                                                    }
                                                >
                                                    {isConfirmed ? (
                                                        <Check
                                                            className="h-4 w-4"
                                                            strokeWidth={2.2}
                                                        />
                                                    ) : (
                                                        <UserPlus
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
    const deleteForm = useForm({});
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!show) {
            return;
        }

        setPendingFile(null);
        setPreviewUrl(imageUrl);
        transformForm.setData({
            zoom,
            position_x: positionX,
            position_y: positionY,
        });
        setConfirmingDelete(false);
    }, [show, imageUrl, zoom, positionX, positionY, transformForm]);

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
        transformForm.setData({
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
                    zoom: transformForm.data.zoom,
                    position_x: transformForm.data.position_x,
                    position_y: transformForm.data.position_y,
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
        x: transformForm.data.position_x,
        y: transformForm.data.position_y,
        zoom: transformForm.data.zoom,
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
                                value={transformForm.data.zoom}
                                min={1}
                                max={3}
                                step={0.05}
                                displayValue={`${Number(transformForm.data.zoom).toFixed(2)}x`}
                                onChange={(value) => transformForm.setData('zoom', value)}
                            />
                            <RangeField
                                icon={Move}
                                label="Horizontal"
                                value={transformForm.data.position_x}
                                min={0}
                                max={100}
                                step={1}
                                displayValue={`${transformForm.data.position_x}%`}
                                onChange={(value) => transformForm.setData('position_x', value)}
                            />
                            <RangeField
                                icon={Move}
                                label="Vertical"
                                value={transformForm.data.position_y}
                                min={0}
                                max={100}
                                step={1}
                                displayValue={`${transformForm.data.position_y}%`}
                                onChange={(value) => transformForm.setData('position_y', value)}
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
