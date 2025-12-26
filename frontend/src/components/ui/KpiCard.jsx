export default function KpiCard({ title, value, icon, subtitle, loading }) {
    return (
        <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/[0.07]">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/50">{title}</span>
                {icon && <span className="text-xl">{icon}</span>}
            </div>
            <div className="mt-2">
                {loading ? (
                    <div className="h-8 w-24 animate-pulse rounded bg-white/10" />
                ) : (
                    <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
                )}
            </div>
            {subtitle && <span className="text-xs text-white/30">{subtitle}</span>}
        </div>
    );
}
