import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl m-4 space-y-4">
                    <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-3xl">⚠️</div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Something went wrong</h2>
                    <p className="text-[var(--text-muted)] text-sm max-w-sm">
                        An unexpected error occurred in this section. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
