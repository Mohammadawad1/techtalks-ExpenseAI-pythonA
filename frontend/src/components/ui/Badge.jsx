export default function Badge({ children, variant = "default" }) {
    const variants = {
        default: "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)]",
        success: "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400",
        warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${variants[variant] || variants.default}`}>
            {children}
        </span>
    );
}
