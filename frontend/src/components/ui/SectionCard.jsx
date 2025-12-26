export default function SectionCard({ title, subtitle, children, className = "" }) {
    return (
        <div className={`rounded-2xl border border-white/10 bg-white/5 p-6 ${className}`}>
            {(title || subtitle) && (
                <div className="mb-6">
                    {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                    {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
                </div>
            )}
            {children}
        </div>
    );
}
