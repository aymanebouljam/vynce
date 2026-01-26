<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Requests\Messaging\StoreMessageRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\Messaging\ConversationService;
use App\Services\SocialGraph\SocialGraphService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    public function index(
        ConversationService $conversationService,
        SocialGraphService $socialGraphService,
    ): Response {
        $user = request()->user();
        $conversations = $conversationService->inbox($user);
        $activeConversation = $conversations->first();
        $contacts = $this->messageableContacts($user, $socialGraphService);

        if ($activeConversation) {
            $activeConversation = $conversationService->threadFor($user, $activeConversation);
        }

        return Inertia::render(
            'Messages/Index',
            $this->payload($conversations, $activeConversation, $contacts),
        );
    }

    public function show(
        Conversation $conversation,
        ConversationService $conversationService,
        SocialGraphService $socialGraphService,
    ): Response {
        $this->authorize('view', $conversation);

        $user = request()->user();
        $conversations = $conversationService->inbox($user);
        $activeConversation = $conversationService->threadFor($user, $conversation);
        $contacts = $this->messageableContacts($user, $socialGraphService);

        return Inertia::render(
            'Messages/Index',
            $this->payload($conversations, $activeConversation, $contacts),
        );
    }

    public function start(User $user, ConversationService $conversationService)
    {
        $this->authorize('message', $user);

        $conversation = $conversationService->startDirect(request()->user(), $user);

        return redirect()->route('messages.show', $conversation);
    }

    public function destroy(
        Conversation $conversation,
        ConversationService $conversationService,
    ): JsonResponse|RedirectResponse {
        $this->authorize('view', $conversation);

        $deletedConversationId = $conversation->id;
        $conversationService->deleteConversationFor(request()->user(), $conversation);

        if (request()->expectsJson()) {
            return response()->json([
                'deleted_conversation_id' => $deletedConversationId,
            ]);
        }

        return redirect()->route('messages.index');
    }

    public function clear(
        Conversation $conversation,
        ConversationService $conversationService,
    ): JsonResponse|RedirectResponse {
        $this->authorize('view', $conversation);

        $conversation = $conversationService->clearConversation($conversation);

        if (request()->expectsJson()) {
            return response()->json([
                'conversation' => ConversationResource::make($conversation)->resolve(),
            ]);
        }

        return redirect()->route('messages.show', $conversation);
    }

    public function storeMessage(
        StoreMessageRequest $request,
        Conversation $conversation,
        ConversationService $conversationService,
    ): Response|JsonResponse|RedirectResponse {
        $this->authorize('view', $conversation);

        $message = $conversationService->sendMessage(
            $request->user(),
            $conversation,
            $request->string('body')->trim()->value(),
        );

        if ($request->expectsJson()) {
            $conversation->load(['participants', 'latestMessage.sender']);

            return response()->json([
                'message' => MessageResource::make($message)->resolve(),
                'conversation' => ConversationResource::make($conversation)->resolve(),
            ]);
        }

        return redirect()->route('messages.show', $conversation);
    }

    public function updateMessage(
        StoreMessageRequest $request,
        Conversation $conversation,
        Message $message,
        ConversationService $conversationService,
    ): JsonResponse|RedirectResponse {
        $this->authorize('view', $conversation);
        abort_unless($message->conversation_id === $conversation->id, 404);
        abort_unless($message->user_id === $request->user()->id, 403);

        $message = $conversationService->updateMessage(
            $message,
            $request->string('body')->trim()->value(),
        );

        $conversation->load(['participants', 'latestMessage.sender']);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => MessageResource::make($message)->resolve(),
                'conversation' => ConversationResource::make($conversation)->resolve(),
            ]);
        }

        return redirect()->route('messages.show', $conversation);
    }

    public function destroyMessage(
        Conversation $conversation,
        Message $message,
        ConversationService $conversationService,
    ): JsonResponse|RedirectResponse {
        $this->authorize('view', $conversation);
        abort_unless($message->conversation_id === $conversation->id, 404);
        abort_unless($message->user_id === request()->user()->id, 403);

        $deletedMessageId = $message->id;
        $conversationService->deleteMessage($message);
        $conversation->load(['participants', 'latestMessage.sender']);

        if (request()->expectsJson()) {
            return response()->json([
                'deleted_message_id' => $deletedMessageId,
                'conversation' => ConversationResource::make($conversation)->resolve(),
            ]);
        }

        return redirect()->route('messages.show', $conversation);
    }

    private function payload($conversations, ?Conversation $activeConversation, $contacts): array
    {
        return [
            'conversations' => ConversationResource::collection($conversations)->resolve(),
            'activeConversation' => $activeConversation
                ? ConversationResource::make($activeConversation)->resolve()
                : null,
            'contacts' => UserResource::collection($contacts)->resolve(),
            'messages' => $activeConversation
                ? MessageResource::collection($activeConversation->messages)->resolve()
                : [],
        ];
    }

    private function messageableContacts(User $user, SocialGraphService $socialGraphService)
    {
        return $socialGraphService->friends($user, perPage: 100)->getCollection()
            ->merge($socialGraphService->followers($user, perPage: 100)->getCollection())
            ->merge($socialGraphService->following($user, perPage: 100)->getCollection())
            ->unique('id')
            ->sortBy('name')
            ->values();
    }
}
