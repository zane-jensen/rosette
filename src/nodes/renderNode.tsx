import ListItem from "../components/ListItem"
import OrderedList from "../components/OrderedList"
import TextElement from "../components/TextElement"
import UnorderedList from "../components/UnorderedList"
import { NODE_TYPES, type RosetteNode } from "./types"

export const renderNode = (node: RosetteNode) => {
    switch (node.type) {
        case NODE_TYPES.ORDERED_LIST:
            return (
                <OrderedList key={node.id}>
                    {node.nodes.map((child: RosetteNode) => renderNode(child))}
                </OrderedList>
            )
            
        case NODE_TYPES.UNORDERED_LIST:
            return (
                <UnorderedList key={node.id}>
                    {node.nodes.map((child: RosetteNode) => renderNode(child))}
                </UnorderedList>
            )

        case NODE_TYPES.LIST_ITEM:
            return (
                <ListItem key={node.id}>
                    {node.nodes.map((child: RosetteNode) => renderNode(child))}
                </ListItem>
            )

        case NODE_TYPES.TEXT:
            return (
                <TextElement key={node.id} content={node.content} />
            )

        default:
            return <p>DOES NOT MATCH KNOWN TYPE: {JSON.stringify(node)}</p>
    }
}