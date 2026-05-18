
import type { RicosDocument, RicosNode } from "../types/Ricos";
import { createListItemNode, createOrderedListNode, createTextNode, createUnorderedListNode } from "./factories";
import type { RosetteNode } from "./types";

export const convertFromRicosDocument = (doc: RicosDocument): RosetteNode[] => {
    var nodes: RosetteNode[] = [];

    for (const wixNode of doc.nodes) {
        const node = convertFromRicosNode(wixNode);
        if (node) nodes.push(node);
    }

    return nodes.flat();
}

const convertFromRicosNode = (wixNode: RicosNode): RosetteNode | null => {
    var node: RosetteNode | null = null;

    var childTextList: string[] = []; // used for any wix nodes that we "skip"
    switch (wixNode.type) {
        case "PARAGRAPH":
            foreachRicosNodeChild(wixNode, (childNode: RicosNode) => {
                if (childNode.textData) childTextList.push(childNode.textData.text);
            });

            node = createTextNode(childTextList.join(" "));
            return node; // escape, no need to search the children again;

        case "TEXT": 
            if (wixNode.textData) node = createTextNode(wixNode.textData.text);
            break;


        case "BULLETED_LIST":
            node = createUnorderedListNode();
            node.nodes = [];
            break;

        case "ORDERED_LIST":
            node = createOrderedListNode();
            node.nodes = [];
            break;

        case "LIST_ITEM":
            node = createListItemNode();
            node.nodes = [];
            break;

        case "IMAGE":
            let imageId: string = wixNode.imageData!.image.src.id;
            node = createTextNode(`[Image: ${imageId}]`);
            break;

        case "FILE":
            let fileName: string = wixNode.fileData!.name;
            node = createTextNode(`[File: ${fileName}]`);
            break;

        default:
            foreachRicosNodeChild(wixNode, (childNode: RicosNode) => {
                if (childNode.textData) childTextList.push(childNode.textData.text);
            });

            node = createTextNode(childTextList.join(" "));
            return node; // escape, no need to search the children again;
    }

    if (!node) return null;

    if (!node.nodes) return node;

    if (wixNode.nodes.length > 0) {
        for (const wixNodeChild of wixNode.nodes) {
            const nodeChild = convertFromRicosNode(wixNodeChild);
            if (!nodeChild) continue;

            node.nodes?.push(nodeChild);
        }
    }

    return node;
}


const foreachRicosNodeChild = (wixNode: RicosNode, callback: (wixNodeChild: RicosNode) => void) => {
    if (wixNode.nodes.length > 0) {
        for (const wixNodeChild of wixNode.nodes) {
            callback(wixNodeChild);
        }
    }
}

