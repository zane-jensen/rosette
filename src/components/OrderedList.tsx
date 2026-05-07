import type { OrderedListNode } from "../nodes/types";

interface IOrderedList {
    node: OrderedListNode;
    children?: React.ReactNode;
}

const OrderedList = ({node, children}: IOrderedList) => {
    return (
        <ol data-node-id={node.id} className="list-decimal pl-6 w-full text-left">
            {children}
        </ol>
    )
}

export default OrderedList;