<?php

namespace App\Http\Middleware;

use App\Http\Controllers\NotificationController;
use App\Http\Resources\UserResource;
use App\Models\Message;
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
        $notificationLimit = 4;
        $notifications = $user
            ? NotificationController::queryForCategory(
                $user->notifications()->latest(),
                'bell',
            )->limit($notificationLimit)->get()
            : collect();
        $pendingRequests = $user
            ? $user->pendingFriendRequests()->with('requester')->latest()->limit($notificationLimit)->get()
            : collect();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? UserResource::make($user)->resolve() : null,
            ],
            'topbar' => $user ? [
                'pending_requests' => UserResource::collection(
                    $pendingRequests->pluck('requester'),
                )->resolve(),
                'pending_requests_count' => $user->pendingFriendRequests()->count(),
                'pending_requests_has_more' => $user->pendingFriendRequests()->count() > $notificationLimit,
                'unread_messages_count' => Message::query()
                    ->join('conversations', 'messages.conversation_id', '=', 'conversations.id')
                    ->join('conversation_participants', 'conversations.id', '=', 'conversation_participants.conversation_id')
                    ->where('conversation_participants.user_id', $user->id)
                    ->where('messages.user_id', '!=', $user->id)
                    ->where(function ($query) {
                        $query->whereNull('conversation_participants.last_read_at')
                            ->orWhereColumn('messages.created_at', '>', 'conversation_participants.last_read_at');
                    })
                    ->count(),
                'unread_messages_href' => ($conversationId = Message::query()
                    ->join('conversations', 'messages.conversation_id', '=', 'conversations.id')
                    ->join('conversation_participants', 'conversations.id', '=', 'conversation_participants.conversation_id')
                    ->where('conversation_participants.user_id', $user->id)
                    ->where('messages.user_id', '!=', $user->id)
                    ->where(function ($query) {
                        $query->whereNull('conversation_participants.last_read_at')
                            ->orWhereColumn('messages.created_at', '>', 'conversation_participants.last_read_at');
                    })
                    ->orderByDesc('messages.created_at')
                    ->value('conversations.id'))
                    ? route('messages.show', $conversationId)
                    : null,
                'notifications' => NotificationController::serializeNotifications($notifications),
                'notifications_page' => 1,
                'notifications_has_more' => NotificationController::queryForCategory(
                    $user->notifications(),
                    'bell',
                )->count() > $notificationLimit,
                'notifications_count' => NotificationController::queryForCategory(
                    $user->unreadNotifications(),
                    'bell',
                )->count(),
            ] : null,
            'flash' => [
                'new_post_id' => fn () => $request->session()->get('new_post_id'),
            ],
        ];
    }
}
