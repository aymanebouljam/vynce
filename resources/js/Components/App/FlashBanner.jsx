import { usePage } from '@inertiajs/react';

export default function FlashBanner() {
    const { flash } = usePage().props;

    if (!flash?.success) {
        return null;
    }

    return <div className="app-flash rounded-2xl px-4 py-3 text-sm">{flash.success}</div>;
}
