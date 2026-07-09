import { NODE_TYPES, type ListItemNode, type OrderedListNode, type RosetteNode, type RosetteNodeOfType, type RosetteNodeType, type TextNode, type UnorderedListNode } from "./types";


export const createOrderedListNode = (): OrderedListNode => ({
    id: crypto.randomUUID(),
    type: NODE_TYPES.ORDERED_LIST,
    tags: [],
    nodes: [
        createListItemNode()
    ]
})



export const createUnorderedListNode = (): UnorderedListNode => ({
    id: crypto.randomUUID(),
    type: NODE_TYPES.UNORDERED_LIST,
    tags: [],
    nodes: [
        createListItemNode()
    ]
})



export const createListItemNode = (startingText?: string): ListItemNode => ({
    id: crypto.randomUUID(),
    type: NODE_TYPES.LIST_ITEM,
    tags: [],
    nodes: [
        createTextNode(startingText)
    ]
})



export const createTextNode = (content: string = "", style?: TextNode["style"]): TextNode => ({
    id: crypto.randomUUID(),
    type: NODE_TYPES.TEXT,
    tags: [],
    content,
    style
})

export const copyNode = <T extends RosetteNodeType>(node: RosetteNodeOfType<T>): RosetteNodeOfType<T> => {
    return {
        ...node,
        id: crypto.randomUUID(),
        nodes: node.nodes ? copyNodes(node.nodes) : undefined
    }
}

export const copyNodes = (nodes: RosetteNode[]) => {
    return nodes.map(copyNode)
}