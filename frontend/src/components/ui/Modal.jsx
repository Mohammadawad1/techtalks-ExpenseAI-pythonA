export default function Modal({ open, title, children, onClose }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
            <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-6 text-[var(--text-primary)] shadow-2xl custom-scrollbar-styling">
                <div className="mb-5 flex items-center justify-between sticky top-0 bg-[var(--bg-primary)] z-10 pb-2 border-b border-[var(--border-secondary)]">
                    <div className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{title}</div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-[var(--text-dim)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="relative text-[var(--text-primary)]">
                    {children}
                </div>
            </div>
        </div>
    );
}
