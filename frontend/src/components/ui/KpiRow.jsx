export default function KpiRow({ children }) {
    return (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {children}
        </div>
    );
}
