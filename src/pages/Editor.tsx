import Panel from "../components/Panel";
import ToolbarButton from "../components/ToolbarButton";
import { NODE_TYPES, type RosetteNode } from "../nodes/types";
import { renderNode } from "../nodes/renderNode";
import { createListItemNode, createOrderedListNode, createUnorderedListNode } from "../nodes/factories";
import { findNodeById, getNodesFromNodePath } from "../nodes/utils";
import { useEditor } from "../providers/editor/EditorProvider";
import { useState } from "react";


const Editor = () => {
    const {nodes, updateNode, appendNode, deleteNodeById} = useEditor();
    const [renderedNodes, setRenderedNodes] = useState<RosetteNode[]>([...nodes]);

    const save = (updatedNodes?: RosetteNode[]) => {
        setRenderedNodes(updatedNodes || nodes);
    }

    const deleteFocused = () => {
        const focusedId = getFocusedId();
        if (!focusedId) return;

        const updatedNodes = deleteNodeById(focusedId);
        save(updatedNodes);
    }

    const getFocusedId = () => {
        const focusedElement = document.activeElement;
        const focusedId = focusedElement?.getAttribute("data-node-id");

        return focusedId;
    }

    const toolbarHandler = (node: RosetteNode) => {
        const focusedId = getFocusedId();

        if (focusedId) {
            const focused = findNodeById(nodes, focusedId);

            if (!focused) {
                console.warn(`No focused node matching id: ${focusedId}`);
                return;
            }

            const {node: focusedNode, nodePath} = focused;
            
            switch (focusedNode?.type) {
                case NODE_TYPES.TEXT:
                    if (nodePath.length === 1 && "nodes" in node) {
                        const parentNode = {
                            ...node,
                            nodes: [
                                {
                                    ...createListItemNode(),
                                    nodes: [focusedNode]
                                }
                            ]
                        }

                        let updatedNodes = deleteNodeById(focusedNode.id);
                        updatedNodes = appendNode(parentNode, updatedNodes);
                        save(updatedNodes);
                        return;
                    }

                    const familyTree = getNodesFromNodePath(nodes, nodePath);
                    const parent = familyTree[familyTree.length - 2];
                    
                    // if text belongs to a list item, create another list item below it
                    if (parent.type === NODE_TYPES.LIST_ITEM) {
                        const updatedListItem = {
                            ...parent,
                            nodes: [...parent.nodes, node]
                        };

                        const updatedNodes = updateNode(updatedListItem);
                        save(updatedNodes);
                        return;
                    }
            }

            console.warn("Switch Failed");
            return;
        }

        const updatedNodes = appendNode(node);
        save(updatedNodes);
    }

    return (
        <Panel>
            <div className="flex flex-col gap-4 min-w-150">
                <p>Editor</p>

                <div
                className="flex flex-col items-start bg-(--color-dark-slate) p-4 inset-shadow-md"
                >
                    {renderedNodes.map((n: RosetteNode) => renderNode(n))}
                </div>

                {/** Toolbar */}
                <div className="flex gap-4">
                    <ToolbarButton 
                        buttonText="OL" 
                        node={createOrderedListNode}
                        onClick={toolbarHandler} 
                    />

                    <ToolbarButton 
                        buttonText="UL" 
                        node={createUnorderedListNode}
                        onClick={toolbarHandler} 
                    />
                </div>

                <div className="flex flex-row gap-2">
                    <button className="border-1 border-green rounded-md px-8 w-max hover:bg-green/20 cursor-pointer" onMouseDown={(e) => e.preventDefault()} onClick={() => save()}>Save</button>
                    <button className="border-1 border-green rounded-md px-8 w-max hover:bg-green/20 cursor-pointer" onMouseDown={(e) => e.preventDefault()} onClick={() => deleteFocused()}>Delete</button>
                </div>
            </div>
        </Panel>
    )
}

export default Editor;