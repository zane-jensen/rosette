
import type { FindNodeResult, RosetteNode } from "./types";


export const getParentPath = (path: number[]) => path.slice(0, -1);

export const getFocusedId = () => {
    const focusedElement = document.activeElement;
    const focusedId = focusedElement?.getAttribute("data-node-id");

    return focusedId;
}

export const getNodeAtPath = (nodes: RosetteNode[], path: number[]) => {
    let currentNodes = nodes;
    let currentNode: RosetteNode | null = null;

    for (const index of path) {
        currentNode = currentNodes[index];
        if (!currentNode) return null;

        if ("nodes" in currentNode) {
            currentNodes = currentNode.nodes;
        }
    }

    return currentNode;
}


export const findNodeById = (nodes: RosetteNode[], id: string, nodePath: number[] = []): FindNodeResult | null => {
    for (const [index, node] of nodes.entries()) {
        const localNodePath = [...nodePath, index];

        if (node.id === id) return {
            node,
            nodePath: localNodePath
        }; // found!

        if ("nodes" in node) { // if there are child nodes recurse
            const found = findNodeById(node.nodes, id, localNodePath);
            if (found) return found;
        }
    }

    return null;
}



export const updateNodeById = (nodes: RosetteNode[], id: string, updatedNode: RosetteNode): RosetteNode[] => {
    return nodes.map((node: RosetteNode) => {
        if (node.id === id) {
            return updatedNode
        }

        if ("nodes" in node) {
            return {
                ...node,
                nodes: updateNodeById(node.nodes, id, updatedNode)
            }
        }

        return node;
    });
}


export const insertNodeAtPath = (nodes: RosetteNode[], node: RosetteNode, nodePath: number[]) => {
    const parentNode = getNodeAtPath(nodes, getParentPath(nodePath));
    if (!parentNode) {
        return [...nodes.slice(0, nodePath[0]), node, ...nodes.slice(nodePath[0])]
    }
    
    if ("nodes" in parentNode) {
        const updatedNode = {
            ...parentNode,
            nodes: [...parentNode.nodes, node]
        }

        return updateNodeById(nodes, parentNode.id, updatedNode);
    }

    return nodes
}


export const insertNodeAfter = (nodes: RosetteNode[], targetNodeId: string, newNode: RosetteNode): RosetteNode[] => {
    const target = findNodeById(nodes, targetNodeId);
    if (!target) return nodes;

    const parent = getNodeAtPath(nodes, getParentPath(target.nodePath));
    if (!parent || !("nodes" in parent)) {
        return [...nodes.slice(0, target.nodePath[0] + 1), newNode, ...nodes.slice(target.nodePath[0] + 1)];
    }

    const updatedParent = {
        ...parent,
        nodes: [...parent.nodes, newNode]
    }

    return updateNodeById(nodes, parent.id, updatedParent);
}


export const getNodesFromNodePath = (nodes: RosetteNode[], nodePath: number[]) => {
    var foundNodes: RosetteNode[] = [];
    var currentNodes = nodes;

    for (const index of nodePath) {
        const currentNode = currentNodes[index]
        
        if (!currentNode) return foundNodes;

        foundNodes.push(currentNode);

        if (!("nodes" in currentNode)) return foundNodes;

        currentNodes = currentNode.nodes;
    }

    return foundNodes;
}


export const deleteNodeById = (nodes: RosetteNode[], nodeId: string) => {
    const target = findNodeById(nodes, nodeId);

    if (!target) {
        console.log("No target node found to delete");
        return nodes;
    }

    const {node, nodePath} = target;

    // if node has no parent
    if (nodePath.length === 1) {
        const updatedNodes = [...nodes].filter(n => n.id !== node.id);
        return updatedNodes;
    }
    // if node has parent
    else {
        const parent = getNodeAtPath(nodes, getParentPath(nodePath));
        if (!parent || !("nodes" in parent)) {
            throw new Error("Node path length > 1 but has no parent");
        }

        const updatedParent = {
            ...parent,
            nodes: [...parent.nodes].filter(n => n.id !== nodeId)
        }

        const updatedNodes = updateNodeById(nodes, parent.id, updatedParent);

        return updatedNodes;
    }
}