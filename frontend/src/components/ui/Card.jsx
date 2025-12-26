export default function Card({ title, children, right }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">{title}</h2>
                {right}
            </div>
            {children}
        </div>
    );
}
