import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import SectionCard from "../components/ui/SectionCard";
import FilterBar from "../components/ui/FilterBar";
import Toast from "../components/ui/Toast";

export default function Categories() {
    const { categories, txns, refreshTransactions } = useOutletContext();
    const [fixOpen, setFixOpen] = useState(false);
    const [fixTxn, setFixTxn] = useState(null);
    const [fixCategory, setFixCategory] = useState("");

    // Batch save state
    const [localChanges, setLocalChanges] = useState({}); // { [txnId]: newCategory }
    const [submitting, setSubmitting] = useState(false);

    // Filter states
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [showUnreviewed, setShowUnreviewed] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const filteredTxns = useMemo(() => {
        return txns.filter(t => {
            const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
            // Show the locally changed category if it exists
            const currentCategory = localChanges[t.id] || t.final_category || t.predicted_category;
            const matchesCategory = selectedCategory === "All" || currentCategory === selectedCategory;
            const matchesUnreviewed = !showUnreviewed || !t.final_category;
            return matchesSearch && matchesCategory && matchesUnreviewed;
        });
    }, [txns, search, selectedCategory, showUnreviewed, localChanges]);

    function openFix(t) {
        setFixTxn(t);
        // Default to local change if present, or existing
        setFixCategory(localChanges[t.id] || t.final_category || t.predicted_category || "");
        setFixOpen(true);
    }

    function saveFix() {
        if (!fixTxn || !fixCategory) return;

        // Update local state only
        setLocalChanges(prev => ({
            ...prev,
            [fixTxn.id]: fixCategory
        }));
        setFixOpen(false);
    }

    async function submitBulkCorrections() {
        const updates = Object.entries(localChanges).map(([id, cat]) => ({
            transaction_id: parseInt(id),
            new_category: cat
        }));

        if (updates.length === 0) return;

        setSubmitting(true);
        try {
            await api.bulkFeedback(updates);
            setLocalChanges({}); // Clear local changes
            await refreshTransactions(); // Sync with backend
            setToastMessage("All corrections have been successfully synced! 🚀");
        } catch (e) {
            setToastMessage(`Update failed: ${e.message}`);
        } finally {
            setSubmitting(false);
        }
    }

    const changedCount = Object.keys(localChanges).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white/90">Review Categories</h1>
                <p className="mt-1 text-white/40 text-sm">Verify AI predictions and correct labels to retrain the model.</p>
            </div>

            <SectionCard title="Valid Categories Strip" subtitle="Reference list of available classification labels.">
                <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                        <div key={c} className="group relative">
                            <span className="cursor-default rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 transition-all hover:bg-blue-500/20 hover:border-blue-500/40">
                                {c}
                            </span>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <FilterBar
                search={search} onSearchChange={setSearch}
                category={selectedCategory} onCategoryChange={setSelectedCategory}
                categories={categories}
                showUnreviewed={showUnreviewed} onShowUnreviewedChange={setShowUnreviewed}
            />

            <SectionCard className="px-0 pt-0 overflow-hidden relative">
                <div className="overflow-x-auto px-6 pt-6 pb-6">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                                <th className="pb-4 pt-2">ID</th>
                                <th className="pb-4 pt-2">Merchant Description</th>
                                <th className="pb-4 pt-2 text-right">Amount</th>
                                <th className="pb-4 pt-2 text-center">AI Prediction</th>
                                <th className="pb-4 pt-2 text-center">Final Prediction</th>
                                <th className="pb-4 pt-2 text-center">Status</th>
                                <th className="pb-4 pt-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTxns.map((t) => {
                                const hasLocalChange = !!localChanges[t.id];
                                return (
                                    <tr key={t.id} className={`group border-t border-white/5 transition-colors ${hasLocalChange ? 'bg-blue-500/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                                        <td className="py-4 text-white/30 text-xs">#{t.id}</td>
                                        <td className="py-4">
                                            <div className="font-medium text-white/90">{t.description}</div>
                                            <div className="text-[10px] uppercase text-white/30">{t.txn_date || "Unknown Date"}</div>
                                        </td>
                                        <td className={`py-4 text-right font-mono font-bold ${t.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                                            {Number(t.amount).toFixed(2)}
                                        </td>
                                        <td className="py-4 text-center">
                                            <Badge>{t.predicted_category}</Badge>
                                        </td>
                                        <td className="py-4 text-center">
                                            <Badge variant={(localChanges[t.id] || t.final_category) ? "success" : "default"}>
                                                {localChanges[t.id] || t.final_category || t.predicted_category}
                                            </Badge>
                                        </td>
                                        <td className="py-4 text-center">
                                            {(localChanges[t.id] || t.final_category) ? (
                                                <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                                    {localChanges[t.id] ? "Staged" : "Verified"}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400 ring-1 ring-inset ring-yellow-500/20">Pending</span>
                                            )}
                                        </td>
                                        <td className="py-4 text-right">
                                            <Button className="px-4 py-1.5 text-xs bg-white/10 hover:bg-white/20 border-white/5" onClick={() => openFix(t)}>
                                                Review
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Batch Actions Footer */}
                <div className="mt-4 border-t border-white/10 bg-white/[0.03] px-8 py-6 flex items-center justify-between">
                    <div>
                        <span className="text-sm font-medium text-white/60">
                            {changedCount} local changes to apply
                        </span>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Applying updates will improve future AI accuracy</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={submitBulkCorrections}
                            disabled={submitting || changedCount === 0}
                            className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 px-8"
                        >
                            {submitting ? "Applying..." : "Confirm & Save Changes"}
                        </Button>
                    </div>
                </div>
            </SectionCard>

            <Modal open={fixOpen} title="Refine Classification" onClose={() => setFixOpen(false)}>
                {fixTxn && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Merchant Details</span>
                            <div className="mt-2 text-lg font-semibold text-white">{fixTxn.description}</div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-white/40">Amount</span>
                                    <div className="font-mono text-white">${Number(fixTxn.amount).toFixed(2)}</div>
                                </div>
                                <div>
                                    <span className="text-xs text-white/40">Confidence</span>
                                    <div className="text-white">{(fixTxn.confidence * 100 || 0).toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-white/70">Assign New Category</label>
                            <select
                                className="w-full rounded-xl border border-white/10 bg-[#151a28] px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                value={fixCategory}
                                onChange={(e) => setFixCategory(e.target.value)}
                            >
                                <option value="">Select Category...</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                            <Button className="bg-transparent hover:bg-white/5 border-none" onClick={() => setFixOpen(false)}>Discard</Button>
                            <Button className="bg-blue-600 hover:bg-blue-500 px-8" onClick={saveFix} disabled={!fixCategory}>
                                Stage Change
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Toast
                message={toastMessage}
                onClose={() => setToastMessage("")}
            />
        </div>
    );
}
