export default function Card({ title, subtitle, children, className = "" }) {
    return (
        <div className={`rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 shadow-[var(--card-shadow)] transition-colors duration-300 ${className}`}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">{title}</h2>
                {right}
            </div>
            {children}
        </div>
    );
}
