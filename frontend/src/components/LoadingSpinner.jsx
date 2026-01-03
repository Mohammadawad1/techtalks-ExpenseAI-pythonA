export default function LoadingSpinner({ size = "md", message = "Processing..." }) {
    const sizes = {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-3",
        lg: "h-12 w-12 border-4"
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4 py-12 animate-in fade-in duration-500">
            <div className={`${sizes[size]} rounded-full border-blue-500 border-t-transparent animate-spin`} />
            {message && <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{message}</p>}
        </div>
    );
}
