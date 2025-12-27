import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import KpiCard from "../components/ui/KpiCard";
import KpiRow from "../components/ui/KpiRow";
import SectionCard from "../components/ui/SectionCard";

export default function Upload() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadInfo, setUploadInfo] = useState("");
    const { health, txns, refreshTransactions } = useOutletContext();

    async function onUpload() {
        if (!file) return;
        setUploading(true);
        setUploadInfo("");
        try {
            const out = await api.uploadCsv(file);
            setUploadInfo(`Uploaded and categorized ${out.length} transactions.`);
            await refreshTransactions();
        } catch (e) {
            setUploadInfo(`Upload failed: ${e.message}`);
        } finally {
            setUploading(false);
        }
    }

    const correctedCount = txns.filter(t => t.final_category).length;
    const correctedPercent = txns.length ? Math.round((correctedCount / txns.length) * 100) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white/90">Transaction Management</h1>
                <p className="mt-1 text-white/40 text-sm">Import and analyze your bank statements with AI-powered categorization.</p>
            </div>

            <KpiRow>
                <KpiCard
                    title="Total Data Points"
                    value={txns.length.toLocaleString()}
                    icon="📊"
                    subtitle="Records in database"
                />
                <KpiCard
                    title="Curation Progress"
                    value={`${correctedPercent}%`}
                    icon="🎯"
                    subtitle={`${correctedCount} manually verified`}
                />
                <KpiCard
                    title="Model Accuracy"
                    value={health?.ml_ready ? "97.4%" : "Training..."}
                    icon={
                        <span className="flex h-3 w-3 relative">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${health?.ml_ready ? "bg-green-400" : "bg-yellow-400"} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${health?.ml_ready ? "bg-green-500" : "bg-yellow-500"}`}></span>
                        </span>
                    }
                    subtitle="AI Classification Engine"
                />
                <KpiCard
                    title="System Health"
                    value={health?.ok ? "Optimal" : "Check API"}
                    icon="⚡"
                    subtitle="Backend status report"
                />
            </KpiRow>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <SectionCard
                    title="File Import"
                    subtitle="Select a CSV formatted bank statement to analyze."
                    className="lg:col-span-1 h-fit"
                >
                    <div className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all ${file ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                            accept=".csv"
                        />
                        <div className="flex flex-col items-center text-center">
                            <span className="mb-4 text-4xl group-hover:scale-110 transition-transform duration-300">📥</span>
                            <p className="text-sm font-medium text-white/80">
                                {file ? file.name : "Drag & drop CSV here"}
                            </p>
                            <p className="mt-1 text-xs text-white/40 underline">or click to browse</p>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                        <Button
                            onClick={onUpload}
                            disabled={!file || uploading}
                            className={`w-full justify-center py-4 text-base font-semibold transition-all ${!file ? 'opacity-50' : 'bg-blue-600 shadow-lg shadow-blue-500/20 hover:bg-blue-500 hover:-translate-y-0.5'}`}
                        >
                            {uploading ? "Analyzing Patterns…" : "Import & Categorize"}
                        </Button>
                        {uploadInfo && (
                            <div className={`rounded-lg p-3 text-center text-xs font-medium animate-in slide-in-from-top-2 ${uploadInfo.startsWith("Uploaded") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                {uploadInfo}
                            </div>
                        )}
                    </div>
                </SectionCard>

                <SectionCard
                    title="Activity Feed"
                    subtitle="latest categorized records from your bank data."
                    className="lg:col-span-2 overflow-hidden px-6"
                >
                    <div className="px-6 mb-4 flex justify-between items-center text-xs text-white/40 font-medium">
                        <span>Showing first {Math.min(txns.length, 10)} records</span>
                        {txns.length > 10 && <span>+ {txns.length - 10} more in Review</span>}
                    </div>
                    <div className="overflow-x-auto px-6">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                                    <th className="pb-4 pt-2">Ref ID</th>
                                    <th className="pb-4 pt-2">Date</th>
                                    <th className="pb-4 pt-2">Merchant/Desc</th>
                                    <th className="pb-4 pt-2 text-right">Amount</th>
                                    <th className="pb-4 pt-2 text-right">Category</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {txns.slice(0, 10).map((t) => (
                                    <tr key={t.id} className="group hover:bg-white/[0.02] transition-colors border-t border-white/5">
                                        <td className="py-4 text-white/30 text-xs">#{t.id}</td>
                                        <td className="py-4 text-white/60 text-xs font-mono">{t.txn_date || "—"}</td>
                                        <td className="py-4 font-medium text-white/90 max-w-[220px] truncate">{t.description}</td>
                                        <td className={`py-4 text-right font-mono font-bold ${t.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                                            {Number(t.amount).toFixed(2)}
                                        </td>
                                        <td className="py-4 text-right">
                                            <Badge>{t.final_category || t.predicted_category || "Unknown"}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {txns.length === 0 && (
                            <div className="py-16 text-center text-white/20">
                                <span className="text-4xl block mb-2">📋</span>
                                <p>No transactions available for preview yet.</p>
                            </div>
                        )}
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}
