export default function SectionCard({ title, subtitle, children, className = "", onDownload }) {
    return (
        <div className={`rounded-2xl border border-white/10 bg-white/5 p-6 relative group ${className}`}>
            {(title || subtitle) && (
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                        {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
                    </div>
                    {onDownload && (
                        <button
                            onClick={onDownload}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Download as Image"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}
