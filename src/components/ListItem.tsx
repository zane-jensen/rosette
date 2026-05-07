import type { ReactNode } from "react"
import type { ListItemNode } from "../nodes/types";

interface IListItem {
    node: ListItemNode
    children: ReactNode
}


const ListItem = ({node, children}: IListItem) => {
    return (
        <li data-node-id={node.id}>{children}</li>
    )
}

export default ListItem;