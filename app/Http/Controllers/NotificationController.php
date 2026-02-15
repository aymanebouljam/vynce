<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    private const PER_PAGE = 8;

    private const REQUEST_TYPES = ['friend_request'];

    private const MESSAGE_TYPES = ['message'];

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->integer('page', 1));
        $query = self::queryForCategory(
            $request->user()->notifications()->latest(),
            (string) $request->query('category', 'bell'),
        );
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
        self::queryForCategory(
            $request->user()->unreadNotifications(),
            (string) $request->input('category', $request->query('category', 'bell')),
        )->get()->markAsRead();

        return response()->json([
            'status' => 'ok',
        ]);
    }

    public function destroy(Request $request, string $notification): JsonResponse
    {
        self::queryForCategory(
            $request->user()->notifications()->whereKey($notification),
            (string) $request->input('category', $request->query('category', 'bell')),
        )->delete();

        return response()->json([
            'status' => 'ok',
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        self::queryForCategory(
            $request->user()->notifications(),
            (string) $request->input('category', $request->query('category', 'bell')),
        )->delete();

        return response()->json([
            'status' => 'ok',
        ]);
    }

    public static function queryForCategory(MorphMany $query, string $category): MorphMany
    {
        return match ($category) {
            'requests' => $query->where('data->type', self::REQUEST_TYPES[0]),
            'messages' => $query->where('data->type', self::MESSAGE_TYPES[0]),
            default => $query
                ->where('data->type', '!=', self::REQUEST_TYPES[0])
                ->where('data->type', '!=', self::MESSAGE_TYPES[0]),
        };
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
