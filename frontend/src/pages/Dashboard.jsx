import { useState, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, LineChart, Line, ComposedChart, Area, Legend,
    AreaChart, Sector
} from "recharts";
import Card from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import KpiRow from "../components/ui/KpiRow";
import SectionCard from "../components/ui/SectionCard";
import InsightsMenu from "../components/InsightsMenu";

// --- Subcomponents ---

const OverviewKpis = ({ grandTotal, topCategory, selectedInsight, count }) => (
    <KpiRow>
        <KpiCard title="Net Spending" value={`$${grandTotal.toLocaleString()}`} icon="💰" subtitle="Sum of all outgoings" />
        <KpiCard title="Top Category" value={topCategory} icon="🔥" subtitle="Highest expense group" />
        <KpiCard title="Active Insight" value={selectedInsight.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())} icon="📊" subtitle="Current perspective" />
        <KpiCard title="Records count" value={count} icon="🧩" subtitle="Analyzed transactions" />
    </KpiRow>
);

const PriorityRecapFilters = ({ data, activeCategory, setActiveCategory, colors }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="space-y-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-1 group"
            >
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors">Priority Recap / Quick Filters</div>
                <div className="flex items-center gap-4">
                    {activeCategory && (
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mr-2">Filter Active: {activeCategory}</span>
                    )}
                    <span className={`text-white/20 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>
            </button>

            {isOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 animate-in slide-in-from-top-2 duration-300">
                    {data.map((item, idx) => {
                        const isActive = activeCategory === item.category;
                        return (
                            <div
                                key={item.category}
                                onClick={() => setActiveCategory(isActive ? null : item.category)}
                                className={`p-3 rounded-xl transition-all cursor-pointer border flex flex-col gap-0.5 
                                    ${isActive
                                        ? "bg-blue-500/15 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                        : "bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 truncate">{item.category}</span>
                                    </div>
                                    {isActive && <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500 flex items-center justify-center text-[7px] text-white">✓</div>}
                                </div>
                                <span className="text-base font-bold text-white">${item.total.toLocaleString()}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const IntelligenceMenuRow = ({ selected, onChange }) => (
    <div className="w-full">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2 mb-3">Intelligence Menu</div>
        <InsightsMenu selected={selected} onChange={onChange} />
    </div>
);

const DateRangeFilter = ({ startDate, endDate, setStartDate, setEndDate }) => (
    <div className="py-4 border-t border-b border-white/5 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2 shrink-0">Date Range Filter</div>
            <div className="flex items-center gap-3 flex-1">
                <div className="flex-1 max-w-[200px] relative">
                    <input
                        type="date"
                        className="w-full rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/30 transition-all font-mono"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <span className="text-white/20">→</span>
                <div className="flex-1 max-w-[200px] relative">
                    <input
                        type="date"
                        className="w-full rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/30 transition-all font-mono"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                {(startDate || endDate) && (
                    <button
                        onClick={() => { setStartDate(""); setEndDate(""); }}
                        className="text-[10px] font-bold text-white/20 hover:text-white transition-colors uppercase tracking-widest ml-auto"
                    >
                        Clear Range
                    </button>
                )}
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    const { txns } = useOutletContext();
    const [selectedInsight, setSelectedInsight] = useState("monthlyTop5");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [activeCategory, setActiveCategory] = useState(null);

    const colors = [
        "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
        "#06b6d4", "#6366f1", "#f43f5e", "#14b8a6", "#a855f7"
    ];

    // Premium active shape for donut charts
    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
        return (
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                stroke={fill}
                strokeWidth={1}
                style={{ filter: "drop-shadow(0px 0px 8px rgba(255,255,255,0.1))" }}
            />
        );
    };

    const dateFilteredData = useMemo(() => {
        if (!startDate && !endDate) return txns;
        return txns.filter((t) => {
            const txnDate = new Date(t.txn_date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (start && txnDate < start) return false;
            if (end && txnDate > end) return false;
            return true;
        });
    }, [txns, startDate, endDate]);

    const filteredData = useMemo(() => {
        if (!activeCategory) return dateFilteredData;
        return dateFilteredData.filter(t => {
            const cat = t.final_category || t.predicted_category || "Uncategorized";
            return cat === activeCategory;
        });
    }, [dateFilteredData, activeCategory]);

    // Data Processing for Insights
    const top10Data = useMemo(() => {
        return [...filteredData]
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
            .slice(0, 10)
            .map(t => ({
                name: t.description.length > 20 ? t.description.substring(0, 20) + "..." : t.description,
                amount: Math.abs(parseFloat(t.amount))
            }));
    }, [filteredData]);

    const weeklyTrendData = useMemo(() => {
        const weeks = {};
        filteredData.forEach(t => {
            const date = new Date(t.txn_date);
            const firstDay = new Date(date.setDate(date.getDate() - date.getDay()));
            const weekKey = firstDay.toISOString().split('T')[0];
            weeks[weekKey] = (weeks[weekKey] || 0) + Math.abs(parseFloat(t.amount));
        });
        return Object.entries(weeks)
            .map(([week, amount]) => ({ week, amount }))
            .sort((a, b) => a.week.localeCompare(b.week));
    }, [filteredData]);

    const monthlyTop5Data = useMemo(() => {
        const spending = {};
        dateFilteredData.forEach((t) => {
            const amount = Math.abs(parseFloat(t.amount)) || 0;
            const category = t.final_category || t.predicted_category || "Uncategorized";
            spending[category] = (spending[category] || 0) + amount;
        });
        return Object.entries(spending)
            .map(([category, total]) => ({ category, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [dateFilteredData]);

    const monthlyCountAmountData = useMemo(() => {
        const months = {};
        filteredData.forEach(t => {
            const date = new Date(t.txn_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!months[monthKey]) months[monthKey] = { amount: 0, count: 0 };
            months[monthKey].amount += Math.abs(parseFloat(t.amount));
            months[monthKey].count += 1;
        });
        return Object.entries(months)
            .map(([month, stats]) => ({ month, ...stats }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [filteredData]);

    const sizeShareData = useMemo(() => {
        const ranges = { "Small (<$50)": 0, "Medium ($50-200)": 0, "Large (>$200)": 0 };
        filteredData.forEach(t => {
            const amt = Math.abs(parseFloat(t.amount));
            if (amt < 50) ranges["Small (<$50)"]++;
            else if (amt <= 200) ranges["Medium ($50-200)"]++;
            else ranges["Large (>$200)"]++;
        });
        return Object.entries(ranges).map(([range, count]) => ({ name: range, value: count }));
    }, [filteredData]);

    const grandTotal = filteredData.reduce((sum, item) => sum + Math.abs(parseFloat(item.amount)), 0);
    const topCategory = monthlyTop5Data[0]?.category || "N/A";

    const chartRef = useRef(null);

    const downloadChart = async (title) => {
        if (!chartRef.current) return;
        try {
            const dataUrl = await toPng(chartRef.current, {
                backgroundColor: "#0b0f19",
                style: { borderRadius: "16px" },
                filter: (node) => !(node.tagName === "BUTTON" && node.title === "Download as Image")
            });
            saveAs(dataUrl, `ExpenseAI-${title.replace(/\s+/g, "-")}.png`);
        } catch (error) {
            console.error("Failed to download chart:", error);
        }
    };

    const renderEmptyState = (title) => (
        <SectionCard title={title}>
            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-2xl">🔍</div>
                <div>
                    <h3 className="text-white font-medium">No results found</h3>
                    <p className="text-white/40 text-sm max-w-[280px] mx-auto mt-1">
                        Try adjusting your date range or removing filters.
                    </p>
                </div>
            </div>
        </SectionCard>
    );

    const renderInsightContent = () => {
        if (filteredData.length === 0 && selectedInsight !== "monthlyTop5") {
            return renderEmptyState("Dashboard Analysis");
        }

        switch (selectedInsight) {
            case "top10":
                return (
                    <div ref={chartRef}>
                        <SectionCard title="Top 10 Largest Expenses" onDownload={() => downloadChart("Top-10-Expenses")}>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={top10Data} layout="vertical" margin={{ left: 20, right: 40, top: 10, bottom: 10 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={110} fontSize={9} stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#151a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                                        formatter={(v) => `$${v.toFixed(2)}`}
                                    />
                                    <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </SectionCard>
                    </div>
                );
            case "weeklyTrend":
                return (
                    <div ref={chartRef}>
                        <SectionCard title="Weekly Expenditure Pattern" onDownload={() => downloadChart("Weekly-Trend")}>
                            <ResponsiveContainer width="100%" height={400}>
                                <AreaChart data={weeklyTrendData}>
                                    <defs>
                                        <linearGradient id="colorAmountTrend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="week" stroke="rgba(255,255,255,0.2)" fontSize={9} tickFormatter={(v) => v.split('-').slice(1).join('/')} axisLine={false} tickLine={false} />
                                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#151a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                                        formatter={(v) => `$${v.toFixed(2)}`}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmountTrend)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </SectionCard>
                    </div>
                );
            case "monthlyCountAmount":
                return (
                    <div ref={chartRef}>
                        <SectionCard title="Traffic Volume & Magnitude" onDownload={() => downloadChart("Volume-Magnitude")}>
                            <ResponsiveContainer width="100%" height={400}>
                                <ComposedChart data={monthlyCountAmountData}>
                                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#151a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                                    />
                                    <Bar yAxisId="left" dataKey="amount" name="Total Amount ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Line yAxisId="right" type="monotone" dataKey="count" name="Count" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 3 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </SectionCard>
                    </div>
                );
            case "sizeShare":
                return (
                    <div ref={chartRef}>
                        <SectionCard title="Distribution by Charge Intensity" onDownload={() => downloadChart("Size-Distribution")}>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={sizeShareData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#151a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={60}>
                                        {sizeShareData.map((e, idx) => <Cell key={`c-${idx}`} fill={colors[idx % colors.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </SectionCard>
                    </div>
                );
            case "monthlyTop5":
            default:
                let chartFilteredTop5 = [];
                if (activeCategory) {
                    const existing = monthlyTop5Data.find(d => d.category === activeCategory);
                    if (existing) chartFilteredTop5 = [existing];
                    else {
                        const total = filteredData
                            .filter(t => (t.final_category || t.predicted_category || "Uncategorized") === activeCategory)
                            .reduce((sum, t) => sum + (Math.abs(parseFloat(t.amount)) || 0), 0);
                        if (total > 0) chartFilteredTop5 = [{ category: activeCategory, total }];
                    }
                } else chartFilteredTop5 = monthlyTop5Data;

                return (
                    <div ref={chartRef}>
                        <SectionCard title="Category Breakdown Portfolio" onDownload={() => downloadChart("Top-Categories")}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartFilteredTop5} margin={{ bottom: 20 }}>
                                            <XAxis dataKey="category" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#151a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                itemStyle={{ color: '#fff' }}
                                                labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                                                formatter={(v) => `$${v.toFixed(2)}`}
                                            />
                                            <Bar dataKey="total" radius={[6, 6, 6, 6]}>
                                                {chartFilteredTop5.map((e, idx) => <Cell key={`c-${idx}`} fill={colors[idx % colors.length]} fillOpacity={0.8} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartFilteredTop5}
                                                dataKey="total"
                                                nameKey="category"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                label={({ category, percent }) => `${category.substring(0, 8)} ${(percent * 100).toFixed(0)}%`}
                                                activeShape={renderActiveShape}
                                            >
                                                {chartFilteredTop5.map((e, idx) => <Cell key={`cp-${idx}`} fill={colors[idx % colors.length]} stroke="none" />)}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#151a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                itemStyle={{ color: '#fff' }}
                                                labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                                                formatter={(v) => `$${v.toFixed(2)}`}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white/90">Spending Dashboard</h1>
                    <p className="mt-1 text-white/40 text-sm">Visual insights and spending trends based on your history.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Live Sync</span>
                </div>
            </div>

            {txns.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-20 text-center text-white/20">
                    <span className="text-5xl block mb-4 opacity-50">📊</span>
                    <p className="text-sm">No data available. Start by uploading a CSV.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Top Overview Section */}
                    <OverviewKpis
                        grandTotal={grandTotal}
                        topCategory={topCategory}
                        selectedInsight={selectedInsight}
                        count={filteredData.length}
                    />

                    {/* Collapsible Quick Filters */}
                    <PriorityRecapFilters
                        data={monthlyTop5Data}
                        activeCategory={activeCategory}
                        setActiveCategory={setActiveCategory}
                        colors={colors}
                    />

                    {/* Main Layout Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Desktop: Sidebar Intelligence Menu */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="hidden lg:block sticky top-8">
                                <IntelligenceMenuRow selected={selectedInsight} onChange={setSelectedInsight} />
                            </div>
                            {/* Mobile Menu (stacked above) */}
                            <div className="lg:hidden">
                                <IntelligenceMenuRow selected={selectedInsight} onChange={setSelectedInsight} />
                            </div>
                        </div>

                        {/* Right Content: Date Range + Hero Insight */}
                        <div className="lg:col-span-3">
                            <div className="space-y-4">
                                <DateRangeFilter
                                    startDate={startDate}
                                    endDate={endDate}
                                    setStartDate={setStartDate}
                                    setEndDate={setEndDate}
                                />

                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[500px]">
                                    {renderInsightContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

