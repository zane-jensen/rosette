import type { ReactNode } from "react"

interface IListItem {
    children?: ReactNode
}


const ListItem = ({children}: IListItem) => {
    return (
        <li>{children}</li>
    )
}

export default ListItem;