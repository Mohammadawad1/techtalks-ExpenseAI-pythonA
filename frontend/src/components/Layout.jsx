import { useEffect, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { api } from "../api";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Toast from "./ui/Toast";

export default function Layout() {
    const [health, setHealth] = useState(null);
    const [categories, setCategories] = useState([]);
    const [txns, setTxns] = useState([]);
    const [busyRetrain, setBusyRetrain] = useState(false);
    const [busyExport, setBusyExport] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "success" });

    async function refreshHealth() {
        const h = await api.health();
        setHealth(h);
    }

    async function refreshCategories() {
        const c = await api.getCategories();
        setCategories(c.categories || []);
    }

    async function refreshTransactions() {
        try {
            const list = await api.getTransactions();
            setTxns(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("Failed to fetch transactions:", e);
        }
    }

    async function refreshAll() {
        await Promise.all([refreshHealth(), refreshCategories(), refreshTransactions()]);
    }

    useEffect(() => {
        refreshAll();
    }, []);

    async function runRetrain() {
        setBusyRetrain(true);
        try {
            const r = await api.retrain();
            setToast({
                message: `Intelligence optimization complete! Analyzed ${r.corrections_rows} personal corrections.`,
                type: "success"
            });
            await refreshHealth();
            await refreshTransactions();
        } catch (e) {
            setToast({ message: `Retrain failed: ${e.message}`, type: "error" });
        } finally {
            setBusyRetrain(false);
        }
    }

    async function downloadExport() {
        setBusyExport(true);
        try {
            const blob = await api.exportCsv();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "expenseai_export.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            setToast({ message: `Export failed: ${e.message}`, type: "error" });
        } finally {
            setBusyExport(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-[#0b0f19] text-white">
            {/* Sidebar */}
            <aside className="fixed bottom-0 left-0 top-0 flex w-72 flex-col border-r border-white/10 bg-white/5">
                <div className="px-6 py-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20">
                            EA
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">ExpenseAI</h1>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <Badge>
                            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${health?.ok ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
                            API: {health ? (health.ok ? "Online" : "Offline") : "…"}
                        </Badge>
                        <Badge>ML Ready: {health?.ml_ready ? "Yes" : "No"}</Badge>
                    </div>
                </div>

                <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
                    <div>
                        <h2 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Main Menu</h2>
                        <div className="space-y-1">
                            <NavLink
                                to="/upload"
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }`
                                }
                            >
                                <span className="text-lg opacity-80 group-hover:scale-110 transition-transform">📁</span>
                                <span>Upload CSV</span>
                            </NavLink>
                            <NavLink
                                to="/categories"
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }`
                                }
                            >
                                <span className="text-lg opacity-80 group-hover:scale-110 transition-transform">ℹ️</span>
                                <span>Review Categories</span>
                            </NavLink>
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }`
                                }
                            >
                                <span className="text-lg opacity-80 group-hover:scale-110 transition-transform">📊</span>
                                <span>Spending Dashboard</span>
                            </NavLink>
                        </div>
                    </div>


                </nav>

                <div className="border-t border-white/10 p-4">
                    <h2 className="mb-3 px-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Global Actions</h2>
                    <div className="space-y-2">
                        <Button
                            onClick={runRetrain}
                            disabled={busyRetrain}
                            className="w-full justify-start gap-3 rounded-xl bg-white/5 hover:bg-white/10 border-white/5"
                        >
                            <span>🔄</span>
                            <span>{busyRetrain ? "Processing…" : "Retrain Model"}</span>
                        </Button>
                        <Button
                            onClick={downloadExport}
                            disabled={busyExport}
                            className="w-full justify-start gap-3 rounded-xl bg-white/5 hover:bg-white/10 border-white/5"
                        >
                            <span>📥</span>
                            <span>{busyExport ? "Downloading…" : "Export CSV"}</span>
                        </Button>
                        <Button
                            onClick={refreshAll}
                            className="w-full justify-start gap-3 rounded-xl bg-white/5 hover:bg-white/10 border-white/5"
                        >
                            <span>⚡</span>
                            <span>Refresh All</span>
                        </Button>
                        <Button
                            onClick={() => {
                                localStorage.removeItem("expenseai_token");
                                window.location.href = "/login";
                            }}
                            className="w-full justify-start gap-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border-red-500/10 text-red-400 mt-4"
                        >
                            <span>🚪</span>
                            <span>Logout</span>
                        </Button>
                    </div>
                    <p className="mt-4 px-2 text-[10px] italic text-white/30 text-center">JWT Authentication Active</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-72 flex-1 overflow-auto bg-[#0b0f19] p-10">
                <div className="mx-auto max-w-7xl">
                    <Outlet context={{ health, categories, txns, refreshTransactions, refreshCategories }} />
                </div>
            </main>

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, message: "" })}
            />
        </div>
    );
}
