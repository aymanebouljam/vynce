import { router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({
    fallbackHref = null,
    fallbackLabel = 'Back',
    className = '',
    children = 'Back',
}) {
    const goBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
            return;
        }

        if (fallbackHref) {
            router.visit(fallbackHref);
        }
    };

    return (
        <button
            type="button"
            onClick={goBack}
            className={`inline-flex items-center gap-2 rounded-full border border-[rgba(181,148,255,0.28)] bg-[linear-gradient(135deg,rgba(120,88,166,0.95),rgba(101,72,144,0.95))] px-3.5 py-2 text-[13px] text-[rgba(255,250,255,0.95)] shadow-[0_10px_30px_rgba(120,88,166,0.28)] transition hover:bg-[linear-gradient(135deg,rgba(129,96,178,0.98),rgba(110,80,153,0.98))] 2xl:px-4 2xl:text-sm ${className}`}
            aria-label={fallbackLabel}
            title={fallbackLabel}
        >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
            {children}
        </button>
    );
}
