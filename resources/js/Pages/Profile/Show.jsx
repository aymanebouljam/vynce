import PostCard from '@/Components/App/PostCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function Show({ profile, relationship, feed }) {
    const { auth } = usePage().props;
    const followForm = useForm({});
    const isOwnProfile = auth.user.id === profile.id;

    const submitFollow = () => {
        if (relationship.is_following || relationship.has_pending_request) {
            followForm.delete(route('users.unfollow', profile.id));
            return;
        }

        followForm.post(route('users.follow', profile.id));
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

    return (
        <AuthenticatedLayout title={`${profile.name}`}>
            <section className="app-panel overflow-hidden rounded-[32px]">
                <div
                    className="h-44 bg-cover bg-center"
                    style={{
                        backgroundImage: profile.cover_url
                            ? `url(${profile.cover_url})`
                            : 'var(--vynce-cover-gradient)',
                    }}
                />
                <div className="p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="app-panel-inset -mt-16 mb-4 flex h-24 w-24 items-center justify-center rounded-[28px] border-4 border-[var(--vynce-bg)] text-2xl font-bold">
                                {profile.name?.charAt(0)}
                            </div>
                            <h1 className="text-3xl font-semibold">{profile.name}</h1>
                            <div className="app-text-muted mt-1 text-sm">@{profile.username}</div>
                            <div
                                className="app-pill mt-3 inline-flex rounded-full px-3 py-1 text-xs"
                                style={{ background: 'var(--vynce-surface-inset-muted)' }}
                            >
                                {profile.is_private ? 'Private profile' : 'Public profile'}
                            </div>
                            {profile.bio && (
                                <p className="app-text-high mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-7">
                                    {profile.bio}
                                </p>
                            )}
                            <div className="app-text-muted mt-4 flex flex-wrap gap-4 text-sm">
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
                            <div className="app-text-soft mt-4 max-w-2xl text-sm leading-7">
                                A profile on Vynce is part timeline, part identity card. The
                                strongest accounts make it easy to understand what they share and
                                why people follow them.
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {isOwnProfile ? (
                                <Link
                                    href={route('profile.edit')}
                                    className="app-button-secondary rounded-full px-5 py-3 text-sm"
                                >
                                    Edit profile
                                </Link>
                            ) : (
                                <>
                                    {relationship.can_follow && (
                                        <button
                                            type="button"
                                            onClick={submitFollow}
                                            className="app-button-primary rounded-full px-5 py-3 text-sm font-semibold"
                                        >
                                            {relationshipLabel}
                                        </button>
                                    )}
                                    {relationship.can_message && (
                                        <Link
                                            href={route('messages.start', profile.id)}
                                            method="post"
                                            as="button"
                                            className="app-button-secondary rounded-full px-5 py-3 text-sm"
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

            <section className="mt-6 space-y-4">
                {feed.data.length === 0 ? (
                    <div className="app-dashed-panel app-text-muted rounded-[28px] p-8 text-sm">
                        No posts yet. This space will fill with updates, threads, and media as soon
                        as the first post goes live.
                    </div>
                ) : (
                    feed.data.map((post) => (
                        <PostCard key={post.id} post={post} canManage={isOwnProfile} />
                    ))
                )}
            </section>
        </AuthenticatedLayout>
    );
}
