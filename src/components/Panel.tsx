

const Panel = ({children, className}: {children: React.ReactNode, className?: string}) => (
    <div className={"rounded-xl border border-white/[0.03] shadow-lg p-4 bg-(--color-slate) relative " + className}>
        {children}
    </div>
)

export default Panel;