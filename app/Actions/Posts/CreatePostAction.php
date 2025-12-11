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
            $post = $user->posts()->create([
                'body' => $data['body'],
                'visibility' => $data['visibility'],
                'hashtags' => $this->extractHashtags($data['body']),
                'mentions' => $this->extractMentions($data['body']),
                'published_at' => now(),
            ]);

            foreach ($data['media'] ?? [] as $position => $file) {
                if (! $file instanceof UploadedFile) {
                    continue;
                }

                $post->media()->create([
                    'disk' => 'public',
                    'path' => $file->store('posts', 'public'),
                    'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                    'size' => $file->getSize(),
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
