<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InertiaPaginatedData
{
    public static function fromPaginator(LengthAwarePaginator $paginator, string $resourceClass): array
    {
        return [
            'data' => $resourceClass::collection($paginator->getCollection())->resolve(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
