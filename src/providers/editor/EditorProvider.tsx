import { createContext, useContext, useState, type ReactNode } from "react";
import type { RosetteNode } from "../../nodes/types";
import { createListItemNode, createOrderedListNode, createTextNode, createUnorderedListNode } from "../../nodes/factories";
import { findNodeById, updateNodeById } from "../../nodes/utils";

interface EditorContextValue {
    nodes: RosetteNode[];
    updateNode: (node: RosetteNode) => RosetteNode[];
    appendNode: (node: RosetteNode, sourceNodes?: RosetteNode[]) => RosetteNode[];
    deleteNodeById: (nodeId: string) => RosetteNode[];
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const useEditor = () => {
    const ctx = useContext(EditorContext);
    if (!ctx) throw new Error("useEditor must be used within EditorProvider");
    return ctx;
}

export const EditorProvider = ({children}: {children: ReactNode}) => {
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

    const updateNode = (node: RosetteNode) => {
        const updatedNodes = updateNodeById([...nodes], node.id, node);
        setNodes(updatedNodes);

        return updatedNodes
    }

    const appendNode = (node: RosetteNode, sourceNodes?: RosetteNode[]) => {
        const updatedNodes = [...(sourceNodes || nodes), node];
        setNodes(updatedNodes);

        return updatedNodes;
    }

    const deleteNodeById = (nodeId: string) => {
        const target = findNodeById(nodes, nodeId);

        if (!target) {
            console.log("No target node found to delete");
            return nodes;
        }

        const {node, nodePath} = target;

        if (nodePath.length === 1) {
            const updatedNodes = [...nodes].filter(n => n.id !== node.id);
            console.log(updatedNodes);
            setNodes(updatedNodes);
            return updatedNodes;
        }

        return nodes;
    }

    return (
        <EditorContext.Provider value={{nodes, updateNode, appendNode, deleteNodeById}}>
            {children}
        </EditorContext.Provider>
    )
}