<?php

namespace App\Actions\Users;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UpdateProfileImageAction
{
    public function replace(User $user, string $type, UploadedFile $file, array $transform = []): User
    {
        $config = $this->config($type);

        if ($user->{$config['path']} && Storage::disk('public')->exists($user->{$config['path']})) {
            Storage::disk('public')->delete($user->{$config['path']});
        }

        $user->forceFill([
            $config['path'] => $file->store($config['directory'], 'public'),
            $config['zoom'] => $transform['zoom'] ?? 1,
            $config['x'] => $transform['position_x'] ?? 50,
            $config['y'] => $transform['position_y'] ?? 50,
        ])->save();

        return $user->refresh();
    }

    public function updateTransform(User $user, string $type, array $data): User
    {
        $config = $this->config($type);

        $user->forceFill([
            $config['zoom'] => $data['zoom'],
            $config['x'] => $data['position_x'],
            $config['y'] => $data['position_y'],
        ])->save();

        return $user->refresh();
    }

    public function remove(User $user, string $type): User
    {
        $config = $this->config($type);

        if ($user->{$config['path']} && Storage::disk('public')->exists($user->{$config['path']})) {
            Storage::disk('public')->delete($user->{$config['path']});
        }

        $user->forceFill([
            $config['path'] => null,
            $config['zoom'] => 1,
            $config['x'] => 50,
            $config['y'] => 50,
        ])->save();

        return $user->refresh();
    }

    /**
     * @return array{path:string, zoom:string, x:string, y:string, directory:string}
     */
    private function config(string $type): array
    {
        return match ($type) {
            'avatar' => [
                'path' => 'avatar_path',
                'zoom' => 'avatar_zoom',
                'x' => 'avatar_position_x',
                'y' => 'avatar_position_y',
                'directory' => 'avatars',
            ],
            'cover' => [
                'path' => 'cover_path',
                'zoom' => 'cover_zoom',
                'x' => 'cover_position_x',
                'y' => 'cover_position_y',
                'directory' => 'covers',
            ],
            default => throw new \InvalidArgumentException('Unsupported profile image type.'),
        };
    }
}
