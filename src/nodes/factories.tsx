import { NODE_TYPES, type ListItemNode, type OrderedListNode, type TextNode, type UnorderedListNode } from "./types";


export const createOrderedListNode = (): OrderedListNode => ({
    id: crypto.randomUUID(),
    type: NODE_TYPES.ORDERED_LIST,
    nodes: [
        createListItemNode()
    ]
})



export const createUnorderedListNode = (): UnorderedListNode => ({
    id: crypto.randomUUID(),
    type: NODE_TYPES.UNORDERED_LIST,
    nodes: [
        createListItemNode()
    ]
})



export const createListItemNode = (startingText?: string): ListItemNode => ({
    id: crypto.randomUUID(),
    type: NODE_TYPES.LIST_ITEM,
    nodes: [
        createTextNode(startingText)
    ]
})



export const createTextNode = (content: string = ""): TextNode => ({
    id: crypto.randomUUID(),
    type: NODE_TYPES.TEXT,
    content
})