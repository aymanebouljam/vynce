<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    private const PER_PAGE = 8;

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->integer('page', 1));
        $query = $request->user()->notifications()->latest();
        $total = (clone $query)->count();
        $notifications = $query
            ->forPage($page, self::PER_PAGE)
            ->get();

        return response()->json([
            'notifications' => $this->serializeNotifications($notifications),
            'page' => $page,
            'has_more' => $total > ($page * self::PER_PAGE),
        ]);
    }

    public function markRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'status' => 'ok',
        ]);
    }

    public function destroy(Request $request, string $notification): JsonResponse
    {
        $request->user()->notifications()->whereKey($notification)->delete();

        return response()->json([
            'status' => 'ok',
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $request->user()->notifications()->delete();

        return response()->json([
            'status' => 'ok',
        ]);
    }

    public static function serializeNotifications(Collection $notifications): array
    {
        return $notifications
            ->map(fn (DatabaseNotification $notification) => [
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
            ->values()
            ->all();
    }
}
