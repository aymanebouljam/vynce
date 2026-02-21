import { router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function useLiveInertiaReload(only, interval = 5000, enabled = true) {
    const onlyKey = Array.isArray(only) ? only.join('|') : String(only);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') {
            return undefined;
        }

        const reload = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            router.reload({
                only,
                preserveScroll: true,
                preserveState: true,
            });
        };

        const intervalId = window.setInterval(reload, interval);
        window.addEventListener('focus', reload);
        document.addEventListener('visibilitychange', reload);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', reload);
            document.removeEventListener('visibilitychange', reload);
        };
    }, [enabled, interval, onlyKey]);
}
