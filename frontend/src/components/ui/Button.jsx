export default function Button({ children, className = "", ...props }) {
    return (
        <button
            className={
                "rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 active:bg-white/20 disabled:opacity-50 " +
                className
            }
            {...props}
        >
            {children}
        </button>
    );
}
