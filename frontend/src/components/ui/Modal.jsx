export default function Modal({ open, title, children, onClose }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0f19] p-5 text-white shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-lg font-semibold">{title}</div>
                    <button className="rounded-lg px-2 py-1 hover:bg-white/10" onClick={onClose}>
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
