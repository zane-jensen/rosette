

const Panel = ({children}: {children: React.ReactNode}) => (
    <div className="rounded-xl border border-white/[0.03] shadow-lg p-4 bg-(--color-slate) relative">
        {children}
    </div>
)

export default Panel;