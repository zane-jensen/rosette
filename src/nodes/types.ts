
export const NODE_TYPES = {
    ORDERED_LIST: 'ordered-list',
    UNORDERED_LIST: "unordered-list",
    LIST_ITEM: "list-item",
    TEXT: "text",
} as const;

export type RosetteNodeType = RosetteNode["type"];

export type RosetteNodeOfType<T extends RosetteNodeType> = Extract<RosetteNode, { type: T}>;

interface RosetteNodeBase<TType extends string> {
    id: string;
    type: TType;
}

export interface OrderedListNode extends RosetteNodeBase<typeof NODE_TYPES.ORDERED_LIST> {
    nodes: RosetteNode[];
}
export interface UnorderedListNode extends RosetteNodeBase<typeof NODE_TYPES.UNORDERED_LIST> {
    nodes: RosetteNode[];
}

export interface ListItemNode extends RosetteNodeBase<typeof NODE_TYPES.LIST_ITEM> {
    nodes: RosetteNode[];
}

export interface TextNode extends RosetteNodeBase<typeof NODE_TYPES.TEXT> {
    content: string;
}


export type RosetteNode = 
    OrderedListNode |
    UnorderedListNode | 
    ListItemNode |
    TextNode


export interface FindNodeResult {
    node: RosetteNode,
    nodePath: number[]
}