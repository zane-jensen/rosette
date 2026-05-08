import type { UnorderedListNode } from "../nodes/types";


interface IUnorderedList {
    node: UnorderedListNode;
    children?: React.ReactNode;
}

const UnorderedList = ({node, children}: IUnorderedList) => {
    return (
        <ul data-node-id={node.id} data-node-type={node.type} className="list-disc pl-6 w-full text-left">
            {children}
        </ul>
    )
}

export default UnorderedList;