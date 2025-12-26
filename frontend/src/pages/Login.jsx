import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import Button from "../components/ui/Button";
import Toast from "../components/ui/Toast";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [forgotMsg, setForgotMsg] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.login(email, password);
            localStorage.setItem("expenseai_token", res.access_token);
            // Wait a bit to show a smooth transition
            setTimeout(() => navigate("/upload"), 500);
        } catch (err) {
            setError(err.message || "Login failed. Check your credentials.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0e17] px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-500 shadow-xl shadow-blue-500/10 mb-6">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white/90">Welcome back</h2>
                    <p className="mt-2 text-sm text-white/40">Securely sign into your ExpenseAI account</p>
                </div>

                <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400 animate-in fade-in slide-in-from-top-4">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-white/20"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-white/20"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-600 p-1.5 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-offset-[#0a0e17]" id="remember-me" />
                                <label htmlFor="remember-me" className="ml-2 block text-xs text-white/40 cursor-pointer">Remember me</label>
                            </div>
                            <div className="text-xs">
                                <button
                                    type="button"
                                    onClick={() => setForgotMsg("Please contact support at support@expenseai.com to reset your password.")}
                                    className="font-medium text-blue-400 hover:text-blue-300"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 py-3 font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-[0.98] transition-transform"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-white/40">
                            Don't have an account?{" "}
                            <Link to="/signup" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-[10px] text-white/20 uppercase tracking-[0.2em]">
                    Powered by ExpenseAI Intelligence
                </p>
            </div>
            <Toast
                message={forgotMsg}
                type="info"
                onClose={() => setForgotMsg("")}
            />
        </div>
    );
}
