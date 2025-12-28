export default function Toast({ message, type = "success", onClose }) {
    if (!message) return null;

    const Icon = () => {
        if (type === "success") return <span className="text-lg">✅</span>;
        if (type === "error") return <span className="text-lg">❌</span>;
        return <span className="text-lg">ℹ️</span>;
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
            <div className={`flex items-center gap-4 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all
                ${type === "success"
                    ? "border-green-500/20 bg-green-500/10 text-green-800 dark:text-green-100"
                    : "border-red-500/20 bg-red-500/10 text-red-800 dark:text-red-100"}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl 
                    ${type === "success" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                    <Icon />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold uppercase tracking-wider opacity-60">
                        {type === "success" ? "Success" : "Error"}
                    </span>
                    <p className="text-sm font-medium">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="ml-4 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-40 hover:opacity-100 text-[var(--text-primary)]"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
