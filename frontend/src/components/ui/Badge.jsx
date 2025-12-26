export default function Badge({ children, variant = "default" }) {
    const variants = {
        default: "border-white/10 bg-white/5 text-white/90",
        success: "border-green-500/20 bg-green-500/10 text-green-400",
        warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-500",
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${variants[variant] || variants.default}`}>
            {children}
        </span>
    );
}
