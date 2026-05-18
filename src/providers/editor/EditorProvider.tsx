import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { NODE_TYPES, type RosetteNode } from "../../nodes/types";
import { findNodeById, updateNodeById } from "../../nodes/utils";
import { createTextNode } from "../../nodes/factories";

interface EditorProviderProps {
    children: ReactNode;
    defaultValue?: RosetteNode[],
    onChange?: (nodes: RosetteNode[]) => void;
}

interface EditorContextValue {
    nodes: RosetteNode[];
    replaceNodes: (updatedNodes: RosetteNode[]) => void;
    updateNode: (node: RosetteNode) => RosetteNode[];
    focusNode: (nodeId: string, offset?: number) => void;
    flushDirtyNodes: () => RosetteNode[];
    addDirtyNode: (nodeId: string) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const useEditor = () => {
    const ctx = useContext(EditorContext);
    if (!ctx) throw new Error("useEditor must be used within EditorProvider");
    return ctx;
}

export const EditorProvider = ({children, defaultValue, onChange}: EditorProviderProps) => {
    const [focusNext, setFocusNext] = useState<{nodeId: string, offset: number}>({nodeId: "", offset: 0});
    const dirtyNodeIdsRef = useRef<Set<string>>(new Set());

    const [nodes, setNodes] = useState<RosetteNode[]>(defaultValue || [createTextNode()]);

    useEffect(() => {
        onChange?.(nodes);
    }, [nodes])

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
            if (!target) continue;

            if (target.node.type !== NODE_TYPES.TEXT) continue;

            const updatedNode = {
                ...target.node,
                content: element?.textContent ?? ""
            }

            pendingNodes = updateNodeById(pendingNodes, nodeId, updatedNode);
        }

        dirtyNodeIdsRef.current.clear();
        return pendingNodes;
    }

    const addDirtyNode = (nodeId: string): void => {
        dirtyNodeIdsRef.current.add(nodeId);
    }

    const focusNode = (nodeId: string, offset: number = 0) => {
        setFocusNext({nodeId, offset});
    }

    const clearFocusNext = () => {
        setFocusNext({nodeId: "", offset: 0});
    }

    useEffect(() => {
        if (!focusNext) return;

        const focusedNode = findNodeById(nodes, focusNext.nodeId);
        if (!focusedNode) return;

        const element = document.querySelector(
            `[data-node-id="${focusNext.nodeId}"]`
        ) as HTMLElement | null;

        if (!element) return;

        element.focus();

        const elementNode = element?.firstChild;

        const selection = window.getSelection();
        const range = document.createRange();
        if (elementNode) {
            range.setStart(elementNode, focusNext.offset);
            range.setEnd(elementNode, focusNext.offset);
        }
        else {
            range.setStart(element, 0);
            range.setEnd(element, 0);
        }

        selection?.removeAllRanges();
        selection?.addRange(range);
        clearFocusNext();

    }, [nodes, focusNext])

    return (
        <EditorContext.Provider value={{nodes, replaceNodes, updateNode, focusNode, flushDirtyNodes, addDirtyNode}}>
            {children}
        </EditorContext.Provider>
    )
}