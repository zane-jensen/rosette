import { NODE_TYPES, type ListItemNode, type OrderedListNode, type TextNode, type UnorderedListNode } from "./types";


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