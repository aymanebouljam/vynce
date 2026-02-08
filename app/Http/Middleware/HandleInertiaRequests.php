<?php

namespace App\Http\Middleware;

use App\Http\Resources\UserResource;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? UserResource::make($user)->resolve() : null,
            ],
            'topbar' => $user ? [
                'pending_requests' => UserResource::collection(
                    $user->pendingFriendRequests()->with('requester')->latest()->limit(6)->get()
                        ->pluck('requester'),
                )->resolve(),
                'pending_requests_count' => $user->pendingFriendRequests()->count(),
                'unread_messages_count' => Conversation::query()
                    ->join('conversation_participants', 'conversations.id', '=', 'conversation_participants.conversation_id')
                    ->where('conversation_participants.user_id', $user->id)
                    ->whereNotNull('conversations.latest_message_at')
                    ->where(function ($query) {
                        $query->whereNull('conversation_participants.last_read_at')
                            ->orWhereColumn('conversations.latest_message_at', '>', 'conversation_participants.last_read_at');
                    })
                    ->count(),
                'notifications' => $user->notifications()
                    ->latest()
                    ->limit(8)
                    ->get()
                    ->map(fn ($notification) => [
                        'id' => $notification->id,
                        'type' => $notification->data['type'] ?? 'activity',
                        'title' => $notification->data['title'] ?? 'Activity',
                        'body' => $notification->data['body'] ?? '',
                        'href' => $notification->data['href'] ?? route('feed.home'),
                        'actor' => $notification->data['actor'] ?? null,
                        'created_at' => $notification->created_at?->toISOString(),
                        'created_at_human' => $notification->created_at?->diffForHumans(),
                        'read_at' => $notification->read_at?->toISOString(),
                    ])
                    ->values(),
                'notifications_count' => $user->unreadNotifications()->count(),
            ] : null,
            'flash' => [
                'new_post_id' => fn () => $request->session()->get('new_post_id'),
            ],
        ];
    }
}
