import { usePage } from '@inertiajs/react';

export default function FlashBanner() {
    const { flash } = usePage().props;

    if (!flash?.success) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {flash.success}
        </div>
    );
}
