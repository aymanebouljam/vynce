export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `app-button-secondary inline-flex items-center rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-widest shadow-none transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--vynce-accent)] focus:ring-offset-2 focus:ring-offset-[var(--vynce-bg)] disabled:opacity-25 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
