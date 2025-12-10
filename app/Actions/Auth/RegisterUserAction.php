<?php

namespace App\Actions\Auth;

use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RegisterUserAction
{
    public function execute(RegisterRequest $request): User
    {
        return User::create([
            'name' => $request->string('name')->value(),
            'username' => $request->string('username')->lower()->value(),
            'email' => $request->string('email')->lower()->value(),
            'password' => Hash::make($request->string('password')->value()),
        ]);
    }
}
