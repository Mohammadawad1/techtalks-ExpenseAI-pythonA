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
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-dim)]"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
);

export default function Categories() {
    const { categories, txns, refreshTransactions } = useOutletContext();
    const [fixOpen, setFixOpen] = useState(false);
    const [fixTxn, setFixTxn] = useState(null);
    const [fixCategory, setFixCategory] = useState("");
    const [fixDate, setFixDate] = useState("");
    const [fixDescription, setFixDescription] = useState("");
    const [fixAmount, setFixAmount] = useState("");
    const [saving, setSaving] = useState(false);

    const [addOpen, setAddOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
        setFixDate(t.txn_date || "");
        setFixDescription(t.description || "");
        setFixAmount(t.amount || "");
        setFixCategory(t.final_category || t.predicted_category || "");
        setFixOpen(true);
    }

    async function saveFix() {
        if (!fixTxn || !fixCategory || !fixDate || !fixDescription || !fixAmount) {
            setToastMessage("Please fill all fields.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                txn_date: fixDate,
                description: fixDescription,
                amount: parseFloat(fixAmount),
                category: fixCategory
            };
            await api.updateTransaction(fixTxn.id, payload);
            setToastMessage("Transaction updated successfully! ✅");
            await refreshTransactions();
            setFixOpen(false);
        } catch (e) {
            setToastMessage("Update failed: " + e.message);
        } finally {
            setSaving(false);
        }
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


    async function handleBulkDelete() {
        setDeleting(true);
        try {
            await api.deleteTransactions(selectedIds);
            setToastMessage(`Successfully deleted ${selectedIds.length} transactions`);
            refreshTransactions();
            setSelectedIds([]);
            setDeleteOpen(false);
        } catch (e) {
            setToastMessage("Deletion failed: " + e.message);
        } finally {
            setDeleting(false);
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

    const isAnyModalOpen = fixOpen || addOpen || deleteOpen;

    return (
        <div className="relative">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            {/* Main Content Container with Conditional Dimming */}
            <div className={`space-y-6 transition-all duration-500 ${isAnyModalOpen ? 'opacity-20 blur-sm pointer-events-none scale-[0.99]' : 'animate-in fade-in duration-700'}`}>
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Categories Management</h1>
                        <p className="mt-0.5 text-[var(--text-muted)] text-xs uppercase tracking-widest font-semibold">Verification Dashboard</p>
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

                        <div className="h-6 w-[1px] bg-[var(--border-primary)] hidden md:block" />

                        <button
                            onClick={runRetrain}
                            disabled={busyRetrain}
                            className={`group flex items-center gap-3 rounded-xl pl-2 pr-4 py-1.5 text-xs font-bold transition-all shadow-lg active:scale-95 ${busyRetrain
                                ? "bg-[var(--bg-tertiary)] text-[var(--text-dim)] cursor-wait"
                                : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                                }`}
                        >
                            <div className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors ${busyRetrain
                                ? "bg-[var(--bg-primary)] border-[var(--border-primary)]"
                                : "bg-[var(--bg-primary)] border-[var(--border-primary)] group-hover:bg-[var(--bg-tertiary)] group-hover:border-[var(--border-secondary)]"
                                }`}>
                                <div className={busyRetrain ? "animate-spin" : ""}>
                                    <RefreshIcon />
                                </div>
                            </div>
                            {busyRetrain ? "Optimizing..." : "Optimize AI Model"}
                        </button>

                        <button
                            onClick={() => setAddOpen(true)}
                            className="group flex items-center gap-3 rounded-xl pl-2 pr-4 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-md active:scale-95 translate-y-[-1px]"
                        >
                            <div className="p-1.5 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all">
                                <PlusIcon />
                            </div>
                            Add Transaction
                        </button>
                    </div>
                </div>

                {/* Smart Unified Toolbar */}
                <div className="border border-[var(--border-primary)] bg-[var(--bg-secondary)]/90 backdrop-blur-md rounded-2xl shadow-[var(--card-shadow)] relative z-[100]">
                    {/* Top Row: Main Filters */}
                    <div className="p-2 border-b border-[var(--border-primary)] flex flex-wrap items-center gap-2">
                        {/* Category Selector */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth px-1">
                            {["All", ...categories].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedCategory(c)}
                                    className={`whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium transition-all ${selectedCategory === c
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                                        : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-primary)]"
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        <div className="h-4 w-[1px] bg-[var(--border-primary)] mx-1 hidden sm:block" />

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
                                className="w-full rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] pl-9 pr-4 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-blue-500/30 focus:bg-[var(--bg-secondary)] outline-none transition-all"
                            />
                        </div>

                    </div>

                    {/* Bottom Row: Scope & Tools */}
                    <div className="p-2 bg-[var(--bg-primary)]/10 flex flex-wrap items-center justify-between gap-4">
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
                                        className={`px-3 py-1 rounded-md text-[12px] font-bold transition-all ${scope === item.id
                                            ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-dim)]"
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
                                    <span className="text-[var(--text-dim)]">→</span>
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
                                        className="text-[10px] font-bold text-[var(--text-dim)] hover:text-[var(--text-muted)] uppercase tracking-widest px-2"
                                    >
                                        Clear Selection
                                    </button>

                                    <button
                                        onClick={() => setDeleteOpen(true)}
                                        className="flex items-center gap-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 text-[12px] font-bold text-red-400 transition-all shadow-sm active:scale-95"
                                    >
                                        <TrashIcon />
                                        Delete ({selectedIds.length})
                                    </button>

                                    <div className="relative" ref={bulkRef}>
                                        <button
                                            onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                                            className="flex items-center gap-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 px-3 py-1.5 text-[12px] font-bold text-blue-400 transition-all shadow-sm active:scale-95"
                                        >
                                            Bulk Category ({selectedIds.length})
                                            <ChevronDown />
                                        </button>
                                        {bulkMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-1 shadow-xl z-[300] max-h-60 overflow-y-auto no-scrollbar">
                                                <div className="p-2 border-b border-[var(--border-primary)] text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-widest">Assign Category</div>
                                                {categories.map((c) => (
                                                    <button
                                                        key={c}
                                                        onClick={() => applyBulkCategory(c)}
                                                        className="flex w-full items-center px-4 py-2.5 text-[11px] font-bold text-[var(--text-muted)] hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-left"
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Unreviewed Toggle */}
                            <button
                                onClick={() => setShowUnreviewed(!showUnreviewed)}
                                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-bold border transition-all shadow-lg active:scale-95 ${showUnreviewed
                                    ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-inner"
                                    : "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${showUnreviewed ? "bg-purple-400 animate-pulse" : "bg-[var(--text-dim)]"}`} />
                                Need Review
                            </button>

                            {/* Export Dropdown */}
                            <div className="relative" ref={exportRef}>
                                <button
                                    onClick={() => setExportMenuOpen(!exportMenuOpen)}
                                    className="flex items-center gap-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-primary)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-primary)] transition-all shadow-lg active:scale-95"
                                >
                                    Export CSV
                                    <ChevronDown />
                                </button>

                                {exportMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-1 shadow-2xl z-[200]">
                                        <button
                                            onClick={() => handleExport('latest')}
                                            className="flex w-full items-center px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                                        >
                                            Latest Upload Only
                                        </button>
                                        <button
                                            onClick={() => handleExport('all')}
                                            className="flex w-full items-center px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                                        >
                                            Full History (All)
                                        </button>
                                        <button
                                            onClick={() => handleExport('range')}
                                            disabled={!fromDate || !toDate}
                                            className="flex w-full items-center px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] hover:bg-blue-600 hover:text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                <SectionCard className="px-0 pt-0 overflow-hidden relative border-[var(--border-secondary)] bg-[var(--bg-secondary)] shadow-none">
                    <div className="overflow-x-auto px-6 py-2">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border-secondary)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-dim)]">
                                    <th className="pb-4 pt-4 px-2 w-8">
                                        <input
                                            type="checkbox"
                                            className="rounded border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-blue-500 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
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
                            <tbody className="divide-y divide-[var(--border-secondary)]">
                                {filteredTxns.length > 0 ? filteredTxns.map((t) => {
                                    const hasLocalChange = !!localChanges[t.id];
                                    return (
                                        <tr key={t.id} className={`group border-t border-[var(--border-secondary)] transition-colors ${selectedIds.includes(t.id) ? 'bg-blue-600/10' : hasLocalChange ? 'bg-blue-500/[0.04]' : 'hover:bg-[var(--bg-tertiary)]'}`}>
                                            <td className="py-3 px-2">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-blue-500 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                                                    checked={selectedIds.includes(t.id)}
                                                    onChange={() => toggleSelect(t.id)}
                                                />
                                            </td>
                                            <td className="py-3 text-[var(--text-muted)] text-[12px] font-mono">
                                                <div className="flex items-center gap-2">
                                                    <span>{t.txn_date || "—"}</span>
                                                    {isFromLatestBatch(t) && (
                                                        <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" title="New Transaction" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 max-w-[280px]">
                                                <div className="font-medium text-[var(--text-primary)] truncate text-[13px]">{t.description}</div>
                                            </td>
                                            <td className={`py-3 text-right font-mono text-[14px] font-bold ${t.amount < 0 ? "text-red-400" : "text-emerald-400"}`}>
                                                {Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 text-center">
                                                <Badge className="text-[11px] opacity-60 scale-90">{t.predicted_category}</Badge>
                                            </td>
                                            <td className="py-3 text-center">
                                                <Badge variant={(localChanges[t.id] || t.final_category) ? "success" : "default"} className="text-[11px] font-bold">
                                                    {localChanges[t.id] || t.final_category || t.predicted_category}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-center">
                                                {(localChanges[t.id] || t.final_category) ? (
                                                    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/20">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
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
                                                        className="rounded-lg p-2 text-[var(--text-dim)] hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all active:scale-95 group/edit"
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
                                        <td colSpan="7" className="py-12 text-center text-[var(--text-dim)] text-xs italic">
                                            No transactions match your current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Compact Footer Batch Actions */}
                    {changedCount > 0 && (
                        <div className="border-t border-[var(--border-secondary)] bg-blue-600/5 px-6 py-4 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
                                    {changedCount}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest">Unsaved Changes</p>
                                    <p className="text-[10px] text-[var(--text-muted)]">Finish review session to improve AI accuracy.</p>
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
            </div>

            {/* Modals - Outside of Dimming Container */}
            <div className="relative z-[60]">
                {/* Refinement Modal */}
                <Modal open={fixOpen} title="Edit Transaction" onClose={() => setFixOpen(false)}>
                    {fixTxn && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest px-1">Date</label>
                                    <input
                                        type="date"
                                        value={fixDate}
                                        onChange={(e) => setFixDate(e.target.value)}
                                        className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-blue-500/50 transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest px-1">Amount (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={fixAmount}
                                        onChange={(e) => setFixAmount(e.target.value)}
                                        className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-blue-500/50 transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest px-1">Description</label>
                                <input
                                    type="text"
                                    value={fixDescription}
                                    onChange={(e) => setFixDescription(e.target.value)}
                                    className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-blue-500/50 transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] px-1">Assign Class</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar-styling">
                                    {categories.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setFixCategory(c)}
                                            className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all truncate text-left ${fixCategory === c
                                                ? "bg-blue-600 border-blue-400 text-white shadow-lg"
                                                : "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]"
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={saveFix}
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-xl text-xs font-bold shadow-xl shadow-blue-500/20 mt-4"
                            >
                                {saving ? "Syncing..." : "Update Transaction"}
                            </Button>
                        </div>
                    )}
                </Modal>

                {/* Add Transaction Modal */}
                <AddTransactionModal
                    open={addOpen}
                    onClose={() => setAddOpen(false)}
                    categories={categories}
                    onSuccess={async () => {
                        setAddOpen(false);
                        await refreshTransactions();
                        setToastMessage("✅ Transaction added successfully");
                    }}
                />

                <Toast message={toastMessage} onClose={() => setToastMessage("")} />
                {/* Deletion Confirmation Modal */}
                <Modal open={deleteOpen} title="Permanent Deletion" onClose={() => setDeleteOpen(false)}>
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-3xl rounded-full" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/60">Warning</span>
                            <div className="mt-2 text-xl font-bold text-[var(--text-primary)]">Delete {selectedIds.length} items?</div>
                            <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
                                This action cannot be undone. These transactions will be permanently removed from your history and database.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleBulkDelete}
                                disabled={deleting}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white border-none h-12 rounded-xl text-xs font-bold"
                            >
                                {deleting ? "Deleting..." : "Confirm Deletion"}
                            </Button>
                            <Button
                                onClick={() => setDeleteOpen(false)}
                                className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-primary)] h-12 rounded-xl text-xs font-bold"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
}

{/* Modals - Outside of Dimming Container */ }

function AddTransactionModal({ open, onClose, categories, onSuccess }) {
    const [txnDate, setTxnDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setTxnDate(new Date().toISOString().split('T')[0]);
            setDescription("");
            setAmount("");
            setCategory(""); // Default to empty (Automatic Detection)
            setError("");
        }
    }, [open, categories]);

    async function handleSave() {
        if (!txnDate || !description || !amount) {
            setError("Please fill in all fields.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            await api.createTransaction({
                txn_date: txnDate,
                description,
                amount: parseFloat(amount),
                category: category || null // Send null if empty
            });
            onSuccess();
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal open={open} title="Create New Transaction" onClose={onClose}>
            <div className="space-y-5">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[11px] font-bold">
                        ⚠️ {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest px-1">Transaction Date</label>
                    <input
                        type="date"
                        value={txnDate}
                        onChange={(e) => setTxnDate(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 text-xs text-[var(--text-primary)] focus:border-blue-500/30 outline-none"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest px-1">Description</label>
                    <input
                        type="text"
                        placeholder="e.g. Starbucks Coffee"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-blue-500/30 outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest px-1">Amount ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-blue-500/30 outline-none"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest px-1">Assign Class</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 text-xs text-[var(--text-primary)] focus:border-blue-500/30 outline-none appearance-none"
                        >
                            <option value="" className="bg-[var(--bg-primary)]"> (Automatic Detection)</option>
                            {categories.map((c) => (
                                <option key={c} value={c} className="bg-[var(--bg-primary)]">
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[var(--border-secondary)]">
                    <button className="flex-1 py-3 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" onClick={onClose} disabled={submitting}>Cancel</button>
                    <Button className="flex-[2] bg-blue-600 text-white hover:bg-blue-500 py-3 rounded-xl font-black border-none" onClick={handleSave} disabled={submitting}>
                        {submitting ? "Processing..." : "ADD TRANSACTION"}
                    </Button>
                </div>
            </div>
        </Modal>
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
.custom-scrollbar-styling::-webkit-scrollbar {
    width: 5px;
}
.custom-scrollbar-styling::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar-styling::-webkit-scrollbar-thumb {
    background: var(--border-primary);
    border-radius: 10px;
}
.custom-scrollbar-styling::-webkit-scrollbar-thumb:hover {
    background: var(--border-secondary);
}
`;

