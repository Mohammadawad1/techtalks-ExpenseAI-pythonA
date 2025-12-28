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
                <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 border border-white/10 rounded-2xl m-4 space-y-4">
                    <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-3xl">⚠️</div>
                    <h2 className="text-xl font-bold text-white">Something went wrong</h2>
                    <p className="text-white/40 text-sm max-w-sm">
                        An unexpected error occurred in this section. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg"
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
