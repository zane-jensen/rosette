
import { NodeRange } from "../types/NodeRange";
import type { FindNodeResult, RosetteNode } from "./types";


export const getParentPath = (path: number[]) => path.slice(0, -1);

export const getActiveElement = () => {
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    if (!anchorNode) return null;

    const element = getElementFromDOMNode(anchorNode);
    return element;
}

export const getActiveNode = (nodes: RosetteNode[]): FindNodeResult | null => {
    const element = getActiveElement();
    if (!element) return null;

    return findNodeById(nodes, element.dataset.nodeId!);
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

/**
 * Gets the first element tagged with data-node-id from DOM Node.
 * @param node 
 * @returns 
 */
const getElementFromDOMNode = (node: Node): HTMLElement | null => {
    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement | null;
    return element?.closest("[data-node-id]") as HTMLElement | null;
}

const getSelectedElements = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);

    const startNode = range.startContainer;
    const endNode = range.endContainer;

    const startElement = getElementFromDOMNode(startNode);
    const endElement = getElementFromDOMNode(endNode);

    if (!startElement || !endElement) return null;

    return {
        startElement: startElement,
        endElement: endElement,
        startOffset: range.startOffset,
        endOffset: range.endOffset
    }
}

export const getSelectedNodes = (nodes: RosetteNode[]) => {
    const elementRange = getSelectedElements();
    if (!elementRange) return null;

    const {
        startElement,
        endElement,
        startOffset,
        endOffset
    } = elementRange;

    const startNode = findNodeById(nodes, startElement.dataset.nodeId!);
    const endNode = findNodeById(nodes, endElement.dataset.nodeId!);

    if (!startNode || !endNode) return null;

    return new NodeRange(
        startNode,
        endNode,
        startOffset,
        endOffset
    );
}

export const splitTextElement = (element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return ["", element.textContent];
    
    const range = selection.getRangeAt(0);
    const text = element.textContent ?? "";

    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.startContainer, range.startOffset);

    const offset = preCaretRange.toString().length;

    return [
        text.slice(0, offset),
        text.slice(offset)
    ]
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

    const targetPathOffset = target.nodePath[target.nodePath.length - 1] + 1;
    const updatedParent = {
        ...parent,
        nodes: [...parent.nodes.slice(0, targetPathOffset), newNode, ...parent.nodes.slice(targetPathOffset)]
    }

    return updateNodeById(nodes, parent.id, updatedParent);
}


export const getNodeBefore = (nodes: RosetteNode[], targetNodeId: string): RosetteNode | null => {
    var target = findNodeById(nodes, targetNodeId);
    if (!target) return null

    while (true) {
        const parentPath = getParentPath(target.nodePath);
        const parent = getNodeAtPath(nodes, parentPath);
        const targetOrder = target.nodePath[target.nodePath.length - 1];

        if (!parent || !("nodes" in parent)) return nodes[targetOrder - 1];

        if (targetOrder === 0) {
            target = {node: parent, nodePath: parentPath}
            continue;
        }

        return parent.nodes[targetOrder - 1];
    }
}

export const findNodeOfType = (parentNode: RosetteNode, nodeType: string): RosetteNode | null => {
    var targetNode = parentNode;

    if (targetNode.type === nodeType) return targetNode;

    if (!("nodes" in targetNode)) return null;

    for (let node of [...targetNode.nodes].reverse()) {
        const foundNode = findNodeOfType(node, nodeType);
        if (foundNode) return foundNode;
    }

    return null;
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