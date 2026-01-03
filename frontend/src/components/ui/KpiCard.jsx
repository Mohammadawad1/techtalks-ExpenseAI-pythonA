export default function KpiCard({ title, value, icon, subtitle, color = "blue" }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 transition-all hover:border-blue-500/30 shadow-[var(--card-shadow)]">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-dim)]">{title}</span>
                    <span className="text-xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
                </div>
                <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight font-display">{value}</div>
                {subtitle && <p className="mt-1 text-[10px] font-medium text-[var(--text-muted)] opacity-80">{subtitle}</p>}
            </div>
        </div>
    );
}
