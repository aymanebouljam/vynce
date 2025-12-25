<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Requests\Messaging\StoreMessageRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\User;
use App\Services\Messaging\ConversationService;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    public function index(ConversationService $conversationService): Response
    {
        $user = request()->user();
        $conversations = $conversationService->inbox($user);
        $activeConversation = $conversations->first();

        if ($activeConversation) {
            $activeConversation = $conversationService->threadFor($user, $activeConversation);
        }

        return Inertia::render('Messages/Index', $this->payload($conversations, $activeConversation));
    }

    public function show(Conversation $conversation, ConversationService $conversationService): Response
    {
        $this->authorize('view', $conversation);

        $user = request()->user();
        $conversations = $conversationService->inbox($user);
        $activeConversation = $conversationService->threadFor($user, $conversation);

        return Inertia::render('Messages/Index', $this->payload($conversations, $activeConversation));
    }

    public function start(User $user, ConversationService $conversationService)
    {
        $this->authorize('message', $user);

        $conversation = $conversationService->startDirect(request()->user(), $user);

        return redirect()->route('messages.show', $conversation);
    }

    public function storeMessage(
        StoreMessageRequest $request,
        Conversation $conversation,
        ConversationService $conversationService,
    ) {
        $this->authorize('view', $conversation);

        $conversationService->sendMessage(
            $request->user(),
            $conversation,
            $request->string('body')->trim()->value(),
        );

        return redirect()->route('messages.show', $conversation);
    }

    private function payload($conversations, ?Conversation $activeConversation): array
    {
        return [
            'conversations' => ConversationResource::collection($conversations)->resolve(),
            'activeConversation' => $activeConversation
                ? ConversationResource::make($activeConversation)->resolve()
                : null,
            'messages' => $activeConversation
                ? MessageResource::collection($activeConversation->messages)->resolve()
                : [],
        ];
    }
}
