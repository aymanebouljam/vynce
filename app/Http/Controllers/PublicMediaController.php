<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class PublicMediaController extends Controller
{
    public function __invoke(Request $request, string $path): Response
    {
        abort_if(str_contains($path, '..'), 404);

        $disk = Storage::disk('public');

        abort_unless($disk->exists($path), 404);

        return $disk->response($path);
    }
}
