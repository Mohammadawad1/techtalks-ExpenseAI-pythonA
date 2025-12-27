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

    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#0b0f19] text-white">
            {/* Sidebar */}
            <aside
                className={`${collapsed ? 'w-20' : 'w-72'} fixed bottom-0 left-0 top-0 flex flex-col border-r border-white/10 bg-white/5 transition-all duration-300 ease-in-out z-50`}
            >
                <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-6'} py-6 transition-all`}>
                    {!collapsed && (
                        <div className="flex items-center gap-3 animate-in fade-in duration-300">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20">
                                EA
                            </div>
                            <h1 className="text-xl font-bold tracking-tight">ExpenseAI</h1>
                        </div>
                    )}
                    {collapsed && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20 animate-in fade-in zoom-in duration-300">
                            EA
                        </div>
                    )}

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition-colors ${collapsed ? 'absolute -right-3 top-8 bg-[#0b0f19] border border-white/10 shadow-xl' : ''}`}
                    >
                        {collapsed ? '❯' : '❮'}
                    </button>
                </div>

                {!collapsed && (
                    <div className="px-6 mb-6 flex flex-wrap gap-2 animate-in fade-in duration-300">
                        <Badge>
                            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${health?.ok ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
                            API: {health ? (health.ok ? "Online" : "Offline") : "…"}
                        </Badge>
                        <Badge>ML Ready: {health?.ml_ready ? "Yes" : "No"}</Badge>
                    </div>
                )}

                <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
                    <div>
                        {!collapsed && <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-white/40 animate-in fade-in">Main Menu</h2>}
                        <div className="space-y-1">
                            <NavLink
                                to="/upload"
                                title={collapsed ? "Upload CSV" : ""}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" : "text-white/60 hover:bg-white/5 hover:text-white"
                                    } ${collapsed ? 'justify-center' : ''}`
                                }
                            >
                                <span className="text-lg opacity-80 group-hover:scale-110 transition-transform">📁</span>
                                {!collapsed && <span className="animate-in fade-in duration-300">Upload CSV</span>}
                            </NavLink>
                            <NavLink
                                to="/categories"
                                title={collapsed ? "Review Categories" : ""}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" : "text-white/60 hover:bg-white/5 hover:text-white"
                                    } ${collapsed ? 'justify-center' : ''}`
                                }
                            >
                                <span className="text-lg opacity-80 group-hover:scale-110 transition-transform">ℹ️</span>
                                {!collapsed && <span className="animate-in fade-in duration-300">Review Categories</span>}
                            </NavLink>
                            <NavLink
                                to="/dashboard"
                                title={collapsed ? "Spending Dashboard" : ""}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" : "text-white/60 hover:bg-white/5 hover:text-white"
                                    } ${collapsed ? 'justify-center' : ''}`
                                }
                            >
                                <span className="text-lg opacity-80 group-hover:scale-110 transition-transform">📊</span>
                                {!collapsed && <span className="animate-in fade-in duration-300">Spending Dashboard</span>}
                            </NavLink>
                        </div>
                    </div>
                </nav>

                <div className="border-t border-white/10 p-4">
                    {!collapsed && <h2 className="mb-3 px-2 text-[10px] font-bold uppercase tracking-wider text-white/40 animate-in fade-in">System</h2>}
                    <div className="space-y-2">
                        <Button
                            onClick={() => {
                                localStorage.removeItem("expenseai_token");
                                window.location.href = "/login";
                            }}
                            title={collapsed ? "Logout" : ""}
                            className={`w-full justify-start gap-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border-red-500/10 text-red-400 ${collapsed ? 'justify-center px-0' : ''}`}
                        >
                            <span>🚪</span>
                            {!collapsed && <span>Logout</span>}
                        </Button>
                    </div>
                    {!collapsed && <p className="mt-4 px-2 text-[10px] italic text-white/30 text-center animate-in fade-in">JWT Authentication Active</p>}
                </div>
            </aside>

            {/* Main Content */}
            <main className={`${collapsed ? 'ml-20' : 'ml-72'} flex-1 overflow-auto bg-[#0b0f19] p-10 transition-all duration-300 ease-in-out`}>
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
