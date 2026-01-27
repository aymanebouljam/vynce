<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            'delivery' => $this->deliveryState($request),
            'attachment' => $this->attachment_path
                ? [
                    'url' => route('media.public', ['path' => $this->attachment_path]),
                    'name' => $this->attachment_name,
                    'mime_type' => $this->attachment_mime_type,
                    'size' => $this->attachment_size,
                    'is_image' => str_starts_with($this->attachment_mime_type ?? '', 'image/'),
                ]
                : null,
            'sender' => $this->relationLoaded('sender') && $this->sender
                ? UserResource::make($this->sender)->resolve($request)
                : null,
        ];
    }

    private function deliveryState(Request $request): ?array
    {
        $viewer = $request->user();

        if (! $viewer || $this->user_id !== $viewer->id || ! $this->relationLoaded('conversation')) {
            return null;
        }

        $conversation = $this->conversation;

        if (! $conversation || ! $conversation->relationLoaded('participants')) {
            return null;
        }

        $recipients = $conversation->participants->reject(
            fn ($participant) => $participant->is($viewer),
        );

        if ($recipients->isEmpty()) {
            return null;
        }

        $messageCreatedAt = $this->created_at;

        $allSeen = $recipients->every(
            fn ($participant) => $this->timestampIsAfterOrEqual(
                $participant->pivot->last_read_at ?? null,
                $messageCreatedAt,
            ),
        );

        $allReceived = $recipients->every(
            fn ($participant) => $this->timestampIsAfterOrEqual(
                $participant->pivot->last_received_at ?? null,
                $messageCreatedAt,
            ),
        );

        return [
            'status' => $allSeen ? 'seen' : ($allReceived ? 'received' : 'unread'),
            'received_at' => $allReceived
                ? $this->latestTimestampIso(
                    $recipients->map(fn ($participant) => $participant->pivot->last_received_at ?? null),
                )
                : null,
            'seen_at' => $allSeen
                ? $this->latestTimestampIso(
                    $recipients->map(fn ($participant) => $participant->pivot->last_read_at ?? null),
                )
                : null,
        ];
    }

    private function timestampIsAfterOrEqual(mixed $value, ?CarbonInterface $target): bool
    {
        $timestamp = $this->normalizeTimestamp($value);

        if (! $timestamp || ! $target) {
            return false;
        }

        return $timestamp->greaterThanOrEqualTo($target);
    }

    private function latestTimestampIso($values): ?string
    {
        $latest = $values
            ->map(fn ($value) => $this->normalizeTimestamp($value))
            ->filter()
            ->sortBy(fn (CarbonInterface $timestamp) => $timestamp->getTimestamp())
            ->last();

        return $latest?->toIso8601String();
    }

    private function normalizeTimestamp(mixed $value): ?CarbonInterface
    {
        if ($value instanceof CarbonInterface) {
            return $value;
        }

        if (is_string($value) && $value !== '') {
            return Carbon::parse($value);
        }

        return null;
    }
}
