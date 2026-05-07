

const Panel = ({children}: {children: React.ReactNode}) => (
    <div className="rounded-xl overflow-hidden border border-white/[0.03] shadow-lg p-4 bg-(--color-slate)">
        {children}
    </div>
)

export default Panel;