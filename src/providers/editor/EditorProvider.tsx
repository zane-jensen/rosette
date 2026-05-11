import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { NODE_TYPES, type RosetteNode } from "../../nodes/types";
import { createListItemNode, createOrderedListNode, createTextNode, createUnorderedListNode } from "../../nodes/factories";
import { findNodeById, updateNodeById } from "../../nodes/utils";

interface EditorContextValue {
    nodes: RosetteNode[];
    replaceNodes: (updatedNodes: RosetteNode[]) => void;
    updateNode: (node: RosetteNode) => RosetteNode[];
    focusNode: (nodeId: string) => void;
    flushDirtyNodes: () => RosetteNode[];
    addDirtyNode: (nodeId: string) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const useEditor = () => {
    const ctx = useContext(EditorContext);
    if (!ctx) throw new Error("useEditor must be used within EditorProvider");
    return ctx;
}

export const EditorProvider = ({children}: {children: ReactNode}) => {
    const [focusNextId, setFocusNextId] = useState<string | null>(null);
    const dirtyNodeIdsRef = useRef<Set<string>>(new Set());

    const [nodes, setNodes] = useState<RosetteNode[]>([
        createTextNode("Ordered List"),
        {
            ...createOrderedListNode(),
            nodes: [
                createListItemNode("Hey"),
                createListItemNode("Ashley!"),
                createListItemNode("This works!")
            ]
        },
        createTextNode("Unordered List"),
        {
            ...createUnorderedListNode(),
            nodes: [
                createListItemNode("The raw rich content"),
                createListItemNode("is down"),
                createListItemNode("below!"),
                createListItemNode("Click on me and click [UL] or [OL]")
            ]
        },
        createTextNode(""),
        createTextNode("Try to select me then click [OL]"),
        createTextNode(""),
        createTextNode("Try to select me then click [UL]"),
        createTextNode(""),
        createTextNode("Delete button only works for text not nested in a list so far!"),
        createTextNode(""),
        createTextNode("It's not very user friendly yet! But once we get more inline controls it'll start feeling good!")
    ]);

    const replaceNodes = (updatedNodes: RosetteNode[]) => {
        setNodes(updatedNodes);
    }

    const updateNode = (node: RosetteNode) => {
        const updatedNodes = updateNodeById([...nodes], node.id, node);
        setNodes(updatedNodes);

        return updatedNodes
    }

    // save active text data before doing anything, should call before and command
    const flushDirtyNodes = (): RosetteNode[] => {
        var pendingNodes = nodes;
        for (let nodeId of dirtyNodeIdsRef.current) {
            const element = document.querySelector(`[data-node-id="${nodeId}"]`);
            const target = findNodeById(pendingNodes, nodeId);
            if (!target || !element) continue;

            if (target.node.type !== NODE_TYPES.TEXT) continue;

            const updatedNode = {
                ...target.node,
                content: element.textContent
            }

            pendingNodes = updateNodeById(pendingNodes, nodeId, updatedNode);
        }

        dirtyNodeIdsRef.current.clear();
        return pendingNodes;
    }

    const addDirtyNode = (nodeId: string): void => {
        dirtyNodeIdsRef.current.add(nodeId);
    }

    const focusNode = (nodeId: string) => {
        setFocusNextId(nodeId);
    }

    useEffect(() => {
        if (!focusNextId) return;

        const focusedNode = findNodeById(nodes, focusNextId);
        if (!focusedNode) return;

        const element = document.querySelector(
            `[data-node-id="${focusNextId}"]`
        ) as HTMLElement | null;

        if (!element) return;

        element.focus();

        const selection = window.getSelection();
        const range = document.createRange();

        range.selectNodeContents(element);
        range.collapse(true);

        selection?.removeAllRanges();
        selection?.addRange(range);

        setFocusNextId(null);

    }, [nodes, focusNextId])

    return (
        <EditorContext.Provider value={{nodes, replaceNodes, updateNode, focusNode, flushDirtyNodes, addDirtyNode}}>
            {children}
        </EditorContext.Provider>
    )
}