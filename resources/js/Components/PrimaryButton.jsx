export default function PrimaryButton({ className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            className={
                `app-button-primary inline-flex items-center rounded-md border border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--vynce-accent-hover)] focus:ring-offset-2 focus:ring-offset-[var(--vynce-bg)] ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
