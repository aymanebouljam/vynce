<?php

namespace App\Http\Requests\SocialGraph;

use Illuminate\Foundation\Http\FormRequest;

class FollowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
}
