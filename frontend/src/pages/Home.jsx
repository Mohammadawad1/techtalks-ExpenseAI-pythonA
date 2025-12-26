import { Link, Navigate } from "react-router-dom";
import Button from "../components/ui/Button";

export default function Home() {
    const token = localStorage.getItem("expenseai_token");

    // Optional: Redirect to dashboard if already logged in
    if (token) {
        return <Navigate to="/upload" replace />;
    }

    return (
        <div className="min-h-screen bg-[#0a0e17] text-white selection:bg-blue-500/30">
            {/* Header / Navbar */}
            <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0e17]/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20">
                            EA
                        </div>
                        <span className="text-xl font-bold tracking-tight">ExpenseAI</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
                        <a href="#about" className="hover:text-white transition-colors">About</a>
                        <a href="#contact" className="hover:text-white transition-colors">Contact Us</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="hidden sm:block text-sm font-medium text-white/60 hover:text-white transition-colors">
                            Log In
                        </Link>
                        <Link to="/signup">
                            <Button className="bg-blue-600 px-6 py-2.5 shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="relative mx-auto max-w-7xl px-6 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <span>✨</span>
                            <span>Powered by Advanced AI Intelligence</span>
                        </div>
                        <h1 className="mx-auto max-w-4xl text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-8 [text-wrap:balance] animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
                            Turn Raw Bank Transactions into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Clear Insights</span>
                        </h1>
                        <p className="mx-auto max-w-2xl text-lg lg:text-xl text-white/40 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
                            Upload your CSV, let AI auto-categorize your spending, and export clean financial data in seconds. Professional expense management without the Excel headache.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both">
                            <Link to="/signup" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto bg-blue-600 px-8 py-4 text-base font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-500 active:scale-[0.98] transition-all">
                                    Start Free Account
                                </Button>
                            </Link>
                            <Link to="/login" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-bold text-white hover:bg-white/10 transition-all">
                                    Login to Dashboard
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 relative">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
                            <p className="text-white/40">Everything you need to master your finances</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="group rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all hover:-translate-y-1">
                                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">🤖</div>
                                <h3 className="text-xl font-bold mb-3 text-white/90">AI Categorization</h3>
                                <p className="text-sm text-white/40 leading-relaxed">
                                    Our intelligent models auto-assign categories to your transactions with high precision.
                                </p>
                            </div>
                            <div className="group rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all hover:-translate-y-1">
                                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">✅</div>
                                <h3 className="text-xl font-bold mb-3 text-white/90">Review & Correct</h3>
                                <p className="text-sm text-white/40 leading-relaxed">
                                    Easily review AI predictions and correct them with a single click in our streamlined interface.
                                </p>
                            </div>
                            <div className="group rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all hover:-translate-y-1">
                                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">📊</div>
                                <h3 className="text-xl font-bold mb-3 text-white/90">Smart Dashboards</h3>
                                <p className="text-sm text-white/40 leading-relaxed">
                                    Visualize your spending habits with beautiful, interactive charts and KPI summaries.
                                </p>
                            </div>
                            <div className="group rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all hover:-translate-y-1">
                                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">📥</div>
                                <h3 className="text-xl font-bold mb-3 text-white/90">One-Click Export</h3>
                                <p className="text-sm text-white/40 leading-relaxed">
                                    Export your cleaned and verified data back to CSV for accounting or personal tracking.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* How it Works Section */}
                <section id="how-it-works" className="py-24 bg-white/[0.01] border-y border-white/5">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="lg:w-1/2">
                                <h2 className="text-4xl font-extrabold mb-6 tracking-tight">Cleaning your expenses <br /><span className="text-blue-500">doesn't have to be hard.</span></h2>
                                <p className="text-lg text-white/40 mb-10">We've streamlined the workflow so you can focus on making decisions, not sorting spreadsheets.</p>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 font-bold text-blue-500">1</div>
                                        <div>
                                            <h4 className="font-bold mb-1">Upload your CSV</h4>
                                            <p className="text-sm text-white/40">Drag and drop any bank transaction file into our secure uploader.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 font-bold text-blue-500">2</div>
                                        <div>
                                            <h4 className="font-bold mb-1">AI Classification</h4>
                                            <p className="text-sm text-white/40">Sit back as our engine predicts categories for every single line item.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 font-bold text-blue-500">3</div>
                                        <div>
                                            <h4 className="font-bold mb-1">Review & Sync</h4>
                                            <p className="text-sm text-white/40">Confirm predictions, fix outliers, and export clean data instantly.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:w-1/2 w-full">
                                <div className="aspect-video rounded-3xl border border-white/10 bg-[#0b0f19] p-2 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <div className="w-full h-full rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5">
                                        <div className="text-center">
                                            <div className="text-6xl mb-4">🚀</div>
                                            <div className="text-sm font-medium text-white/40 uppercase tracking-widest">Interactive Dashboard Demo</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section id="about" className="py-24 relative overflow-hidden">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="lg:w-1/2">
                                <span className="text-blue-500 font-bold tracking-widest uppercase text-xs mb-4 block">Our Story</span>
                                <h2 className="text-4xl font-extrabold mb-6 tracking-tight">📗 About Expense AI</h2>
                                <p className="mb-4 text-lg font-semibold text-white/90">
                                    We are the developers of this project.
                                </p>
                                <p className="mb-8 text-white/40 leading-relaxed text-lg">
                                    Expense AI is an innovative application designed to help users manage and track their expenses effortlessly.
                                    By leveraging advanced AI technologies, Expense AI provides intelligent insights and personalized recommendations
                                    to optimize your financial habits. Our mission is to empower individuals to
                                    take control of their finances with ease and confidence. 💡💰
                                </p>
                            </div>
                            <div className="lg:w-1/2 relative">
                                <div className="absolute -inset-4 bg-blue-500/10 blur-2xl rounded-full"></div>
                                <div className="relative rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                                    <img
                                        src="https://assets.seobotai.com/cdn-cgi/image/quality=75,w=1536,h=1024/lucid.now/68116f8092ebe69020266505-1745981658071.jpg"
                                        alt="ExpenseAI - Smart Expense Management"
                                        className="w-full rounded-2xl shadow-2xl"
                                    />
                                    <p className="mt-4 text-center text-sm text-white/40 italic">ExpenseAI - Smart Expense Management</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section id="contact" className="py-24 bg-white/[0.01] border-y border-white/5">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <span className="text-blue-500 font-bold tracking-widest uppercase text-xs mb-4 block">Support</span>
                            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">📞 Contact Us</h2>
                            <p className="text-white/40 max-w-2xl mx-auto">
                                We'd love to hear from you! Your thoughts help us make the experience even better.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 text-center hover:bg-white/[0.04] transition-all group">
                                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📧</div>
                                <h4 className="font-bold mb-2">Email Us</h4>
                                <a href="mailto:expenseAI@gmail.com" className="text-blue-400 hover:text-blue-300 hover:underline block">
                                    expenseAI@gmail.com
                                </a>
                            </div>

                            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 text-center hover:bg-white/[0.04] transition-all group">
                                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📱</div>
                                <h4 className="font-bold mb-2">Call Us</h4>
                                <p className="text-white/60">+961 70300300</p>
                            </div>

                            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 text-center hover:bg-white/[0.04] transition-all group">
                                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📍</div>
                                <h4 className="font-bold mb-2">Location</h4>
                                <p className="text-white/60">Beirut, Lebanon</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="mx-auto max-w-7xl px-6 text-center">
                        <h2 className="text-4xl font-extrabold mb-6">Ready to regain control?</h2>
                        <p className="text-white/40 mb-10 max-w-xl mx-auto">Join freelancers and small business owners who save hours every month on bookkeeping.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/signup">
                                <Button className="bg-blue-600 px-10 py-4 font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all">
                                    Create My Account Now
                                </Button>
                            </Link>
                            <Link to="/login" className="text-sm font-semibold text-white/60 hover:text-white underline underline-offset-8 decoration-white/10 decoration-2 transition-all">
                                or sign in to your existing account
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 bg-white/[0.01]">
                <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/90 text-sm font-bold text-white">
                            EA
                        </div>
                        <span className="font-bold tracking-tight text-white/90">ExpenseAI</span>
                    </div>
                    <div className="flex gap-8 text-sm text-white/40">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Support</a>
                    </div>
                    <p className="text-sm text-white/20">© 2025 ExpenseAI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
