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

    return (
        <AuthenticatedLayout title={`${profile.name}`}>
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/60">
                <div
                    className="h-44 bg-cover bg-center"
                    style={{
                        backgroundImage: profile.cover_url
                            ? `url(${profile.cover_url})`
                            : 'linear-gradient(135deg, rgba(255,106,61,0.8), rgba(255,209,102,0.5))',
                    }}
                />
                <div className="p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="-mt-16 mb-4 flex h-24 w-24 items-center justify-center rounded-[28px] border-4 border-slate-950 bg-slate-900 text-2xl font-bold">
                                {profile.name?.charAt(0)}
                            </div>
                            <h1 className="text-3xl font-semibold">{profile.name}</h1>
                            <div className="mt-1 text-sm text-slate-400">
                                @{profile.username}
                            </div>
                            <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                                {profile.is_private ? 'Private profile' : 'Public profile'}
                            </div>
                            {profile.bio && (
                                <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-slate-200">
                                    {profile.bio}
                                </p>
                            )}
                            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                                {profile.location && <span>{profile.location}</span>}
                                {profile.website_url && (
                                    <a href={profile.website_url} className="text-sky-300">
                                        {profile.website_url}
                                    </a>
                                )}
                                <span>{profile.followers_count ?? 0} followers</span>
                                <span>{profile.following_count ?? 0} following</span>
                                <span>{profile.posts_count ?? 0} posts</span>
                            </div>
                            <div className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                                A profile on Vynce is part timeline, part identity card. The strongest accounts make it easy to understand what they share and why people follow them.
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {isOwnProfile ? (
                                <Link
                                    href={route('profile.edit')}
                                    className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-200"
                                >
                                    Edit profile
                                </Link>
                            ) : relationship.can_follow ? (
                                <button
                                    type="button"
                                    onClick={submitFollow}
                                    className="rounded-full bg-[#ff6a3d] px-5 py-3 text-sm font-semibold text-slate-950"
                                >
                                    {relationship.is_following
                                        ? 'Unfollow'
                                        : relationship.has_pending_request
                                          ? 'Cancel request'
                                          : 'Follow'}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-6 space-y-4">
                {feed.data.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-950/40 p-8 text-sm text-slate-400">
                        No posts yet. This space will fill with updates, threads, and media as soon as the first post goes live.
                    </div>
                ) : (
                    feed.data.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            canManage={isOwnProfile}
                        />
                    ))
                )}
            </section>
        </AuthenticatedLayout>
    );
}
