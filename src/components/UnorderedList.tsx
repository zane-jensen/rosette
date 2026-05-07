

interface IUnorderedList {
    children?: React.ReactNode
}

const UnorderedList = ({children}: IUnorderedList) => {
    return (
        <ul className="list-disc pl-6 w-full text-left">
            {children}
        </ul>
    )
}

export default UnorderedList;