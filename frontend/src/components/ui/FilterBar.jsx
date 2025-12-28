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
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 shadow-[var(--card-shadow)] transition-colors duration-300">
            <div className="flex flex-1 min-w-[240px] items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-2 focus-within:border-blue-500/50 transition-colors">
                <span className="text-[var(--text-dim)]">🔍</span>
                <input
                    type="text"
                    placeholder="Search by description..."
                    className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-dim)]"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2">
                    <span className="text-xs font-medium text-[var(--text-muted)]">Category:</span>
                    <select
                        className="bg-transparent text-sm text-[var(--text-primary)] outline-none"
                        value={category}
                        onChange={(e) => onCategoryChange(e.target.value)}
                    >
                        <option value="All" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">All Categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{c}</option>
                        ))}
                    </select>
                </div>

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-2 hover:bg-[var(--bg-secondary)] transition-colors">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--border-primary)] bg-[var(--bg-primary)] text-blue-600 focus:ring-0 focus:ring-offset-0"
                        checked={showUnreviewed}
                        onChange={(e) => onShowUnreviewedChange(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-[var(--text-muted)] text-[var(--text-primary)]">Unreviewed Only</span>
                </label>
            </div>
        </div>
    );
}
