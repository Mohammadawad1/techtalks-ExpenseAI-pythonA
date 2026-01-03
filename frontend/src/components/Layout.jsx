import { useEffect, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { api } from "../api";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Toast from "./ui/Toast";
import { useTheme } from "../context/ThemeContext";

// --- Sidebar Icons ---
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
);

const ReviewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
);

const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 16v-4" /><path d="M11 16V9" /><path d="M15 16v-7" /></svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" /></svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
);

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
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
            {/* Sidebar */}
            <aside
                className={`${collapsed ? 'w-20' : 'w-72'} fixed bottom-0 left-0 top-0 flex flex-col border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] transition-all duration-300 ease-in-out z-50`}
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
                        className={`rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors ${collapsed ? 'absolute -right-3 top-8 bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-xl' : ''}`}
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
                        {!collapsed && <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)] animate-in fade-in">Main Menu</h2>}
                        <div className="space-y-1">
                            <NavLink
                                to="/upload"
                                title={collapsed ? "Upload CSV" : ""}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-blue-600/10 text-blue-500 shadow-sm ring-1 ring-blue-500/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                                    } ${collapsed ? 'justify-center' : ''}`
                                }
                            >
                                <span className="opacity-80 group-hover:scale-110 transition-transform"><UploadIcon /></span>
                                {!collapsed && <span className="animate-in fade-in duration-300">Upload CSV</span>}
                            </NavLink>
                            <NavLink
                                to="/categories"
                                title={collapsed ? "Review Categories" : ""}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-blue-600/10 text-blue-500 shadow-sm ring-1 ring-blue-500/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                                    } ${collapsed ? 'justify-center' : ''}`
                                }
                            >
                                <span className="opacity-80 group-hover:scale-110 transition-transform"><ReviewIcon /></span>
                                {!collapsed && <span className="animate-in fade-in duration-300">Review Categories</span>}
                            </NavLink>
                            <NavLink
                                to="/dashboard"
                                title={collapsed ? "Spending Dashboard" : ""}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-blue-600/10 text-blue-500 shadow-sm ring-1 ring-blue-500/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                                    } ${collapsed ? 'justify-center' : ''}`
                                }
                            >
                                <span className="opacity-80 group-hover:scale-110 transition-transform"><DashboardIcon /></span>
                                {!collapsed && <span className="animate-in fade-in duration-300">Spending Dashboard</span>}
                            </NavLink>
                        </div>
                    </div>
                </nav>

                <div className="border-t border-[var(--border-primary)] p-4">
                    {!collapsed && <h2 className="mb-3 px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)] animate-in fade-in">System</h2>}
                    <div className="space-y-2">
                        <Button
                            onClick={toggleTheme}
                            title={collapsed ? (theme === 'dark' ? "Light Mode" : "Dark Mode") : ""}
                            className={`w-full justify-start gap-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] transition-all ${collapsed ? 'justify-center px-0' : ''}`}
                        >
                            <span>{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</span>
                            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                        </Button>
                        <Button
                            onClick={() => {
                                localStorage.removeItem("expenseai_token");
                                window.location.href = "/";
                            }}
                            title={collapsed ? "Logout" : ""}
                            className={`w-full justify-start gap-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border-red-500/10 text-red-500 ${collapsed ? 'justify-center px-0' : ''}`}
                        >
                            <span><LogoutIcon /></span>
                            {!collapsed && <span>Logout</span>}
                        </Button>
                    </div>
                    {!collapsed && <p className="mt-4 px-2 text-[10px] italic text-[var(--text-dim)] text-center animate-in fade-in">JWT Authentication Active</p>}
                </div>
            </aside>

            {/* Main Content */}
            <main className={`${collapsed ? 'ml-20' : 'ml-72'} flex-1 overflow-auto bg-[var(--bg-primary)] p-10 transition-all duration-300 ease-in-out`}>
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
