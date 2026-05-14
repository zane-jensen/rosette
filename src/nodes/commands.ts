import { createListItemNode } from "./factories";
import { NODE_TYPES, type FindNodeResult, type RosetteNode } from "./types";
import { deleteNodeById, findNodeById, getNodeAtPath, getParentPath, insertNodeAtPath } from "./utils";



export const deleteNode = (
    nodes: RosetteNode[],
    deletedNodeId: string
): RosetteNode[] => {
    const focused = findNodeById(nodes, deletedNodeId);
    if (!focused) return nodes;

    const parentPath = getParentPath(focused.nodePath);
    const parent = getNodeAtPath(nodes, parentPath);
    
    // if the parent is a list item, delete that, not the node
    if (parent && parent.type === NODE_TYPES.LIST_ITEM) {
        deletedNodeId = parent.id;

        // if this is the last list item in the list, delete the list instead.
        const parentList = getNodeAtPath(nodes, getParentPath(parentPath));
        if (parentList && "nodes" in parentList && parentList.nodes.length <= 1) {
            deletedNodeId = parentList.id;
        }

    }

    const updatedNodes = deleteNodeById(nodes, deletedNodeId);
    return updatedNodes;
}



export const insertToolbarNode = (
    nodes: RosetteNode[], 
    insertedNode: RosetteNode, 
    focusedId?: string | null
): RosetteNode[] => {
    if (!focusedId) {
        return [...nodes, insertedNode]
    }

    const target = findNodeById(nodes, focusedId);

    if (!target) {
        console.warn(`No focused node matching id: ${focusedId}`);
        return nodes;
    }
    
    switch (target.node.type) {
        case NODE_TYPES.TEXT:
            return insertAtText(nodes, target, insertedNode);
    }

    console.warn("insertToolbarNode failed");
    return nodes;
}



const insertAtText = (
    nodes: RosetteNode[],
    target: FindNodeResult,
    insertedNode: RosetteNode
): RosetteNode[] => {
    const {node: targetNode, nodePath: targetNodePath} = target;

    // if text node has no parent wrap it in insertedNode
    if (targetNodePath.length === 1 && "nodes" in insertedNode) {
        const wrapperNode = { // make new node that wraps focused node
            ...insertedNode,
            nodes: [
                {
                    ...createListItemNode(),
                    nodes: [targetNode]
                }
            ]
        }

        console.log("Wrapper Node", wrapperNode);

        // remove old focused node from dom
        let updatedNodes = deleteNode(nodes, targetNode.id);
        // add wrapped node with focused node into DOM in place
        updatedNodes = insertNodeAtPath(updatedNodes, wrapperNode, targetNodePath);
        return updatedNodes;
    }
    else if (target.node.type === NODE_TYPES.TEXT && target.node.content === "" && target.nodePath.length > 1) {
        return nodes;
    }
    
    // get parent
    const parentPath = getParentPath(targetNodePath);
    const parent = getNodeAtPath(nodes, parentPath);
    
    // if text belongs to a list item, create another list below it
    if (parent && parent.type === NODE_TYPES.LIST_ITEM) {
        const updatedNodes = insertNodeAtPath(nodes, insertedNode, targetNodePath);
        return updatedNodes;
    }

    // fallback don't mututate
    return nodes;
}