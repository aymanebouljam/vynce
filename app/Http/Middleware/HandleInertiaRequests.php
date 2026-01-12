<?php

namespace App\Http\Middleware;

use App\Http\Resources\UserResource;
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
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? UserResource::make($request->user())->resolve() : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'new_post_id' => fn () => $request->session()->get('new_post_id'),
            ],
        ];
    }
}
