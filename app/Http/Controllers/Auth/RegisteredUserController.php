<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\RegisterUserAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     */
    public function store(
        RegisterRequest $request,
        RegisterUserAction $registerUserAction,
    ): RedirectResponse
    {
        $user = $registerUserAction->execute($request);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('onboarding.show', absolute: false));
    }
}
