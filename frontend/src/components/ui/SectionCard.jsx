export default function SectionCard({ title, subtitle, children, className = "", onDownload, onDownloadPdf }) {
    return (
        <div className={`rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 relative group shadow-[var(--card-shadow)] transition-colors duration-300 ${className}`}>
            {(title || subtitle) && (
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        {title && <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>}
                        {subtitle && <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {onDownloadPdf && (
                            <button
                                onClick={onDownloadPdf}
                                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3"
                                title="Download as PDF"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[10px] font-bold uppercase tracking-wider">PDF</span>
                            </button>
                        )}
                        {onDownload && (
                            <button
                                onClick={onDownload}
                                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3"
                                title="Download as Image"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="text-[10px] font-bold uppercase tracking-wider">PNG</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
            {children}
        </div>
    );
}
