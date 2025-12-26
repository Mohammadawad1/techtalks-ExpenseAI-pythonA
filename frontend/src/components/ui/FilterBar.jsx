export default function FilterBar({
    search,
    onSearchChange,
    category,
    onCategoryChange,
    categories = [],
    showUnreviewed,
    onShowUnreviewedChange
}) {
    return (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-1 min-w-[240px] items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 focus-within:border-blue-500/50 transition-colors">
                <span className="text-white/40">🔍</span>
                <input
                    type="text"
                    placeholder="Search by description..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-xs font-medium text-white/40">Category:</span>
                    <select
                        className="bg-transparent text-sm text-white outline-none"
                        value={category}
                        onChange={(e) => onCategoryChange(e.target.value)}
                    >
                        <option value="All" className="bg-[#0b0f19]">All Categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c} className="bg-[#0b0f19]">{c}</option>
                        ))}
                    </select>
                </div>

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/[0.08] transition-colors">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-0 focus:ring-offset-0"
                        checked={showUnreviewed}
                        onChange={(e) => onShowUnreviewedChange(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-white/70">Unreviewed Only</span>
                </label>
            </div>
        </div>
    );
}
