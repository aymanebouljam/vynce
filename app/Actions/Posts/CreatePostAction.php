<?php

namespace App\Actions\Posts;

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class CreatePostAction
{
    public function execute(User $user, array $data): Post
    {
        return DB::transaction(function () use ($user, $data) {
            $body = (string) ($data['body'] ?? '');

            $post = $user->posts()->create([
                'body' => $body,
                'visibility' => $data['visibility'],
                'hashtags' => $this->extractHashtags($body),
                'mentions' => $this->extractMentions($body),
                'published_at' => now(),
            ]);

            $mediaTransforms = $data['media_transform'] ?? [];

            foreach ($data['media'] ?? [] as $position => $file) {
                if (! $file instanceof UploadedFile) {
                    continue;
                }

                $transform = $mediaTransforms[$position] ?? [];

                $post->media()->create([
                    'disk' => 'public',
                    'path' => $file->store('posts', 'public'),
                    'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                    'size' => $file->getSize(),
                    'zoom' => $transform['zoom'] ?? 1,
                    'position_x' => $transform['position_x'] ?? 50,
                    'position_y' => $transform['position_y'] ?? 50,
                    'position' => $position,
                ]);
            }

            return $post->load('media', 'user');
        });
    }

    private function extractHashtags(string $body): array
    {
        preg_match_all('/#([\pL\pN_]+)/u', $body, $matches);

        return array_values(array_unique(array_map('mb_strtolower', $matches[1] ?? [])));
    }

    private function extractMentions(string $body): array
    {
        preg_match_all('/@([a-z0-9_.]+)/i', $body, $matches);

        return array_values(array_unique(array_map('strtolower', $matches[1] ?? [])));
    }
}
