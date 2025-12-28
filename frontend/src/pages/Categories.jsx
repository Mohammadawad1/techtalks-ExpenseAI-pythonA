import { useState, useEffect, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import SectionCard from "../components/ui/SectionCard";
import Toast from "../components/ui/Toast";

// --- Sub-components for the Toolbar ---

const ChevronDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
);

export default function Categories() {
    const { categories, txns, refreshTransactions } = useOutletContext();
    const [fixOpen, setFixOpen] = useState(false);
    const [fixTxn, setFixTxn] = useState(null);
    const [fixCategory, setFixCategory] = useState("");

    // Batch save state
    const [localChanges, setLocalChanges] = useState({}); // { [txnId]: newCategory }
    const [submitting, setSubmitting] = useState(false);

    // Bulk Selection state
    const [selectedIds, setSelectedIds] = useState([]); // [id1, id2, ...]
    const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
    const bulkRef = useRef(null);

    // Filter states
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [showUnreviewed, setShowUnreviewed] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // Scope filter states
    const [scope, setScope] = useState('all');
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    // Export Dropdown state
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportRef = useRef(null);

    const [busyRetrain, setBusyRetrain] = useState(false);

    async function runRetrain() {
        setBusyRetrain(true);
        try {
            const r = await api.retrain();
            setToastMessage(`✅ Intelligence optimized! Analyzed ${r.corrections_rows} corrections.`);
            await refreshTransactions();
        } catch (e) {
            setToastMessage(`❌ Retrain failed: ${e.message}`);
        } finally {
            setBusyRetrain(false);
        }
    }

    // Close dropdowns on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (exportRef.current && !exportRef.current.contains(event.target)) {
                setExportMenuOpen(false);
            }
            if (bulkRef.current && !bulkRef.current.contains(event.target)) {
                setBulkMenuOpen(false);
            }
        }
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Determine latest batch for "NEW" highlighting
    const latestBatch = useMemo(() => {
        if (!txns || txns.length === 0) return null;
        if (txns[0]?.created_at) {
            const maxDate = Math.max(...txns.map(t => new Date(t.created_at).getTime()));
            return { type: 'date', value: maxDate };
        }
        if (txns[0]?.batch_id !== undefined) {
            const maxBatch = Math.max(...txns.map(t => t.batch_id || 0));
            return { type: 'batch', value: maxBatch };
        }
        return null;
    }, [txns]);

    const filteredTxns = useMemo(() => {
        let filtered = [...txns];

        // Apply scope filtering
        if (scope === 'latest' && latestBatch) {
            if (latestBatch.type === 'date') {
                filtered = filtered.filter(t => {
                    const diff = Math.abs(new Date(t.created_at).getTime() - latestBatch.value);
                    return diff < 1000;
                });
            } else if (latestBatch.type === 'batch') {
                filtered = filtered.filter(t => t.batch_id === latestBatch.value);
            }
        } else if (scope === 'range') {
            if (fromDate) {
                filtered = filtered.filter(t => {
                    if (!t.txn_date) return false;
                    const dateStr = t.txn_date.toString().substring(0, 10);
                    return dateStr >= fromDate;
                });
            }
            if (toDate) {
                filtered = filtered.filter(t => {
                    if (!t.txn_date) return false;
                    const dateStr = t.txn_date.toString().substring(0, 10);
                    return dateStr <= toDate;
                });
            }
        }

        return filtered.filter(t => {
            const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
            const currentCategory = localChanges[t.id] || t.final_category || t.predicted_category;
            const matchesCategory = selectedCategory === "All" || currentCategory === selectedCategory;
            const matchesUnreviewed = !showUnreviewed || !t.final_category;
            return matchesSearch && matchesCategory && matchesUnreviewed;
        });
    }, [txns, scope, fromDate, toDate, latestBatch, search, selectedCategory, showUnreviewed, localChanges]);

    function isFromLatestBatch(t) {
        if (!latestBatch || scope !== 'all') return false;
        if (latestBatch.type === 'date') {
            const diff = Math.abs(new Date(t.created_at).getTime() - latestBatch.value);
            return diff < 1000;
        } else if (latestBatch.type === 'batch') {
            return t.batch_id === latestBatch.value;
        }
        return false;
    }

    function openFix(t) {
        setFixTxn(t);
        setFixCategory(localChanges[t.id] || t.final_category || t.predicted_category || "");
        setFixOpen(true);
    }

    function saveFix() {
        if (!fixTxn || !fixCategory) return;
        setLocalChanges(prev => ({ ...prev, [fixTxn.id]: fixCategory }));
        setFixOpen(false);
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredTxns.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredTxns.map(t => t.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const applyBulkCategory = (cat) => {
        const newChanges = { ...localChanges };
        selectedIds.forEach(id => {
            newChanges[id] = cat;
        });
        setLocalChanges(newChanges);
        setSelectedIds([]);
        setBulkMenuOpen(false);
        setToastMessage(`Staged category "${cat}" for ${selectedIds.length} items. Don't forget to sync!`);
    };

    async function submitBulkCorrections() {
        const updates = Object.entries(localChanges).map(([id, cat]) => ({
            transaction_id: parseInt(id),
            new_category: cat
        }));
        if (updates.length === 0) return;
        setSubmitting(true);
        try {
            await api.bulkFeedback(updates);
            setLocalChanges({});
            await refreshTransactions();
            setToastMessage("All corrections synced successfully! 🚀");
        } catch (e) {
            setToastMessage(`Update failed: ${e.message}`);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleExport(mode) {
        setExportMenuOpen(false);
        try {
            let from = (mode === 'range') ? fromDate : null;
            let to = (mode === 'range') ? toDate : null;
            const filters = {
                search: search || '',
                category: selectedCategory !== 'All' ? selectedCategory : '',
                showUnreviewed: showUnreviewed
            };
            const blob = await api.exportCategories(mode, from, to, filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions_${mode}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setToastMessage(`✅ Export successful!`);
        } catch (error) {
            setToastMessage(`❌ Export failed: ${error.message}`);
        }
    }

    const clearFilters = () => {
        setSearch("");
        setSelectedCategory("All");
        setShowUnreviewed(false);
        setScope('all');
        setFromDate(null);
        setToDate(null);
    };

    const hasActiveFilters = search || selectedCategory !== "All" || showUnreviewed || scope !== 'all';
    const changedCount = Object.keys(localChanges).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white/90">Categories Management</h1>
                    <p className="mt-0.5 text-white/40 text-xs uppercase tracking-widest font-semibold">Verification Dashboard</p>
                </div>

                <div className="flex items-center gap-4">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 uppercase tracking-wider transition-colors"
                        >
                            <span className="w-4 h-4 rounded-full bg-blue-500/10 flex items-center justify-center">×</span>
                            Reset Filters
                        </button>
                    )}

                    <div className="h-6 w-[1px] bg-white/10 hidden md:block" />

                    <button
                        onClick={runRetrain}
                        disabled={busyRetrain}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-lg active:scale-95 ${busyRetrain
                            ? "bg-white/5 text-white/40 cursor-wait"
                            : "bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white"
                            }`}
                    >
                        <span className={busyRetrain ? "animate-spin" : ""}>🔄</span>
                        {busyRetrain ? "Processing Intelligence..." : "Optimize AI Model"}
                    </button>
                </div>
            </div>

            {/* Smart Unified Toolbar */}
            <div className="border border-white/10 bg-[#111622]/90 backdrop-blur-md rounded-2xl shadow-2xl relative z-[100]">
                {/* Top Row: Main Filters */}
                <div className="p-2 border-b border-white/5 flex flex-wrap items-center gap-2">
                    {/* Category Selector */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth px-1">
                        {["All", ...categories].map((c) => (
                            <button
                                key={c}
                                onClick={() => setSelectedCategory(c)}
                                className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium transition-all ${selectedCategory === c
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-white/5 text-white/40 hover:bg-white/10"
                                    }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />

                    {/* Compact Search */}
                    <div className="relative flex-1 min-w-[180px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Find description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-full border border-white/5 bg-white/[0.03] pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-white/20 focus:border-blue-500/30 focus:bg-white/[0.05] outline-none transition-all"
                        />
                    </div>

                    {/* Unreviewed Toggle */}
                    <button
                        onClick={() => setShowUnreviewed(!showUnreviewed)}
                        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${showUnreviewed
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-inner"
                            : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"
                            }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${showUnreviewed ? "bg-purple-400 animate-pulse" : "bg-white/20"}`} />
                        Need Review
                    </button>
                </div>

                {/* Bottom Row: Scope & Tools */}
                <div className="p-2 bg-white/[0.01] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {/* Segmented Scope Selector */}
                        <div className="bg-black/20 p-1 rounded-lg flex items-center">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'latest', label: 'Latest' },
                                { id: 'range', label: 'Date Range' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setScope(item.id)}
                                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${scope === item.id
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "text-white/30 hover:text-white/50"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Inline Date Pickers */}
                        {scope === 'range' && (
                            <div className="flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-300">
                                <input
                                    type="date"
                                    value={fromDate || ''}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="bg-transparent border-none text-[11px] font-medium text-blue-400 focus:ring-0 p-0 w-[100px]"
                                />
                                <span className="text-white/10">→</span>
                                <input
                                    type="date"
                                    value={toDate || ''}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="bg-transparent border-none text-[11px] font-medium text-blue-400 focus:ring-0 p-0 w-[100px]"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Bulk Action Toggle */}
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="text-[10px] font-bold text-white/30 hover:text-white/60 uppercase tracking-widest px-2"
                                >
                                    Clear Selection
                                </button>
                                <div className="relative" ref={bulkRef}>
                                    <button
                                        onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 px-3 py-1.5 text-[11px] font-bold text-blue-400 transition-all shadow-lg active:scale-95"
                                    >
                                        Bulk Category ({selectedIds.length})
                                        <ChevronDown />
                                    </button>
                                    {bulkMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-white/20 bg-[#1a202c] p-1 shadow-2xl z-[300] max-h-60 overflow-y-auto no-scrollbar">
                                            <div className="p-2 border-b border-white/5 text-[9px] font-bold text-white/20 uppercase tracking-widest">Assign Category</div>
                                            {categories.map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => applyBulkCategory(c)}
                                                    className="flex w-full items-center px-4 py-2.5 text-[11px] font-bold text-white/70 hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-left"
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Export Dropdown */}
                        <div className="relative" ref={exportRef}>
                            <button
                                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                                className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 text-[11px] font-bold text-white transition-all shadow-lg active:scale-95"
                            >
                                Export CSV
                                <ChevronDown />
                            </button>

                            {exportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-white/20 bg-[#1a202c] p-1 shadow-2xl z-[200]">
                                    <button
                                        onClick={() => handleExport('latest')}
                                        className="flex w-full items-center px-4 py-3 text-[11px] font-bold text-white/70 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                                    >
                                        Latest Upload Only
                                    </button>
                                    <button
                                        onClick={() => handleExport('all')}
                                        className="flex w-full items-center px-4 py-3 text-[11px] font-bold text-white/70 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                                    >
                                        Full History (All)
                                    </button>
                                    <button
                                        onClick={() => handleExport('range')}
                                        disabled={!fromDate || !toDate}
                                        className="flex w-full items-center px-4 py-3 text-[11px] font-bold text-white/70 hover:bg-blue-600 hover:text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        Current Date Range
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <SectionCard className="px-0 pt-0 overflow-hidden relative border-white/5 bg-[#111622]/30">
                <div className="overflow-x-auto px-6 py-2">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/20">
                                <th className="pb-4 pt-4 px-2 w-8">
                                    <input
                                        type="checkbox"
                                        className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                                        checked={filteredTxns.length > 0 && selectedIds.length === filteredTxns.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="pb-4 pt-4">Date</th>
                                <th className="pb-4 pt-4">Description</th>
                                <th className="pb-4 pt-4 text-right">Amount</th>
                                <th className="pb-4 pt-4 text-center">Prediction</th>
                                <th className="pb-4 pt-4 text-center">Final Label</th>
                                <th className="pb-4 pt-4 text-center">Status</th>
                                <th className="pb-4 pt-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTxns.length > 0 ? filteredTxns.map((t) => {
                                const hasLocalChange = !!localChanges[t.id];
                                return (
                                    <tr key={t.id} className={`group border-t border-white/5 transition-colors ${selectedIds.includes(t.id) ? 'bg-blue-600/10' : hasLocalChange ? 'bg-blue-500/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                                        <td className="py-3 px-2">
                                            <input
                                                type="checkbox"
                                                className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                                                checked={selectedIds.includes(t.id)}
                                                onChange={() => toggleSelect(t.id)}
                                            />
                                        </td>
                                        <td className="py-3 text-white/60 text-[11px] font-mono">
                                            <div className="flex items-center gap-2">
                                                <span>{t.txn_date || "—"}</span>
                                                {isFromLatestBatch(t) && (
                                                    <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" title="New Transaction" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 max-w-[280px]">
                                            <div className="font-medium text-white/80 truncate text-xs">{t.description}</div>
                                        </td>
                                        <td className={`py-3 text-right font-mono text-xs font-bold ${t.amount < 0 ? "text-red-400" : "text-emerald-400"}`}>
                                            {Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 text-center">
                                            <Badge className="text-[10px] opacity-60 scale-90">{t.predicted_category}</Badge>
                                        </td>
                                        <td className="py-3 text-center">
                                            <Badge variant={(localChanges[t.id] || t.final_category) ? "success" : "default"} className="text-[10px] font-bold">
                                                {localChanges[t.id] || t.final_category || t.predicted_category}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-center">
                                            {(localChanges[t.id] || t.final_category) ? (
                                                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                                    {localChanges[t.id] ? "STAGED" : "VERIFIED"}
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                                    <div className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse" />
                                                    PENDING
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 text-right">
                                            {selectedIds.length === 0 && (
                                                <button
                                                    className="rounded-lg p-2 text-white/30 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all active:scale-95 group/edit"
                                                    onClick={() => openFix(t)}
                                                    title="Review transaction"
                                                >
                                                    <EditIcon />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-white/20 text-xs italic">
                                        No transactions match your current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Compact Footer Batch Actions */}
                {changedCount > 0 && (
                    <div className="border-t border-white/5 bg-blue-600/5 px-6 py-4 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
                                {changedCount}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white/90 uppercase tracking-widest">Unsaved Changes</p>
                                <p className="text-[10px] text-white/30">Finish review session to improve AI accuracy.</p>
                            </div>
                        </div>
                        <Button
                            onClick={submitBulkCorrections}
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20 px-6 py-2 rounded-xl text-xs"
                        >
                            {submitting ? "Syncing..." : "Sync Changes"}
                        </Button>
                    </div>
                )}
            </SectionCard>

            {/* Refinement Modal */}
            <Modal open={fixOpen} title="Categorization Proof" onClose={() => setFixOpen(false)}>
                {fixTxn && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Transaction Proof</span>
                            <div className="mt-2 text-xl font-bold text-white truncate">{fixTxn.description}</div>
                            <div className="mt-4 flex items-baseline gap-2">
                                <span className="text-2xl font-mono font-bold text-white">${Number(fixTxn.amount).toFixed(2)}</span>
                                <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">USD</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Assign Class</label>
                            <div className="grid grid-cols-2 gap-2">
                                {categories.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setFixCategory(c)}
                                        className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all truncate text-left ${fixCategory === c
                                            ? "bg-blue-600 border-blue-400 text-white shadow-lg"
                                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10"
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <button className="flex-1 py-3 text-xs font-bold text-white/40 hover:text-white transition-colors" onClick={() => setFixOpen(false)}>Ignore</button>
                            <Button className="flex-[2] bg-blue-600 hover:bg-blue-500 py-3 rounded-xl" onClick={saveFix} disabled={!fixCategory}>
                                Stage Verification
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Toast message={toastMessage} onClose={() => setToastMessage("")} />
        </div>
    );
}

const styles = `
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
`;

