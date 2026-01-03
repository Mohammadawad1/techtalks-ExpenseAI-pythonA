export default function InsightsMenu({ selected, onChange }) {
    const items = [
        {
            id: "top10",
            title: "Top 10 Largest Single Expenses",
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 18H6V11H4V18ZM9 18H11V6H9V18ZM14 18H16V13H14V18ZM19 18H21V9H19V18Z" fill="currentColor" fillOpacity="0.8" />
                    <path d="M2 20H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )
        },
        {
            id: "monthlyTop5",
            title: "Monthly Expenses by Top 5 Categories",
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="14" width="4" height="6" rx="1" fill="#3b82f6" />
                    <rect x="4" y="8" width="4" height="5" rx="1" fill="#f59e0b" fillOpacity="0.6" />
                    <rect x="10" y="12" width="4" height="8" rx="1" fill="#3b82f6" />
                    <rect x="10" y="6" width="4" height="5" rx="1" fill="#f59e0b" fillOpacity="0.6" />
                    <rect x="16" y="15" width="4" height="5" rx="1" fill="#3b82f6" />
                    <rect x="16" y="10" width="4" height="4" rx="1" fill="#f59e0b" fillOpacity="0.6" />
                </svg>
            )
        },
        {
            id: "monthlyCountAmount",
            title: "Monthly Expense Count and Total Amount",
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 18V9H6V18H4Z" fill="currentColor" fillOpacity="0.6" />
                    <path d="M11 18V6H13V18H11Z" fill="currentColor" fillOpacity="0.6" />
                    <path d="M18 18V11H20V18H18Z" fill="currentColor" fillOpacity="0.6" />
                    <path d="M3 12L10 8L16 11L22 4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )
        },
        {
            id: "weeklyTrend",
            title: "Weekly Expense Trend",
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 18L8 13L13 16L21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 6L17 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M21 6L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )
        },
        {
            id: "spendingByWeekday",
            title: "Spending Patterns by Weekday",
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="15" r="2" fill="#3b82f6" />
                </svg>
            )
        },
        {
            id: "sizeShare",
            title: "Expense Share by Transaction Size Range",
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="14" width="4" height="6" rx="1" fill="#3b82f6" />
                    <rect x="4" y="8" width="4" height="5" rx="1" fill="#f59e0b" fillOpacity="0.6" />
                    <rect x="10" y="12" width="4" height="8" rx="1" fill="#3b82f6" />
                    <rect x="10" y="6" width="4" height="5" rx="1" fill="#f59e0b" fillOpacity="0.6" />
                    <rect x="16" y="15" width="4" height="5" rx="1" fill="#3b82f6" />
                    <rect x="16" y="10" width="4" height="4" rx="1" fill="#f59e0b" fillOpacity="0.6" />
                </svg>
            )
        },
        {
            id: "netCashFlow",
            title: "Monthly Net Cash Flow",
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="12" width="3" height="8" rx="1" fill="#10b981" />
                    <rect x="9" y="8" width="3" height="12" rx="1" fill="#f43f5e" />
                    <rect x="14" y="14" width="3" height="6" rx="1" fill="#10b981" />
                    <path d="M3 12L21 12" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                    <path d="M4 14L10 10L16 12L21 8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-2">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    className={`flex items-center justify-between gap-4 p-4 rounded-2xl transition-all border text-left group
            ${selected === item.id
                            ? "bg-blue-600/10 border-blue-500/50 text-[var(--text-primary)] shadow-lg shadow-blue-500/5"
                            : "bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-primary)] hover:text-[var(--text-primary)]"
                        }`}
                >
                    <span className={`text-sm font-medium leading-tight ${selected === item.id ? "font-bold" : ""}`}>
                        {item.title}
                    </span>
                    <div className={`${selected === item.id ? "text-blue-400" : "text-[var(--text-dim)] group-hover:text-[var(--text-muted)]"} transition-colors shrink-0`}>
                        {item.icon}
                    </div>
                </button>
            ))}
        </div>
    );
}
