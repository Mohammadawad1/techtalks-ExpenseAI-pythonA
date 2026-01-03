export default function Button({ children, onClick, className = "", disabled = false, title = "" }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`flex items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-all active:scale-95 disabled:opacity-50 ${className}`}
        >
            {children}
        </button>
    );
}
