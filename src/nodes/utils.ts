import type { RosetteNode } from "./types";


export const findNodeById = (nodes: RosetteNode[], id: string, nodePath: number[] = []): {node: RosetteNode, nodePath: number[] } | null => {
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
            node.nodes = updateNodeById(node.nodes, id, updatedNode);
        }

        return node;
    });
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