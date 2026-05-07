
interface IOrderedList {
    children?: React.ReactNode
}

const OrderedList = ({children}: IOrderedList) => {
    return (
        <ol className="list-decimal pl-6 w-full text-left">
            {children}
        </ol>
    )
}

export default OrderedList;