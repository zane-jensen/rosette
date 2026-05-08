import type { FocusEvent, KeyboardEvent } from "react";
import { NODE_TYPES, type TextNode } from "../nodes/types";
import { useEditor } from "../providers/editor/EditorProvider";
import { createListItemNode, createTextNode } from "../nodes/factories";
import { insertNodeAfter } from "../nodes/utils";
import { deleteNode } from "../nodes/commands";

interface ITextElement {
    node: TextNode;
}



const TextElement = ({node}: ITextElement) => {
    const { nodes, updateNode, replaceNodes, focusNode, flushActiveText } = useEditor();

    const blurHandler = (e: FocusEvent<HTMLParagraphElement>) => {
        updateNode({
            ...node,
            content: e.currentTarget.innerText
        })
    }

    const keyDownHandler = (e: KeyboardEvent<HTMLParagraphElement>) => {
        if (e.key == "Enter") {
            e.preventDefault();
            
            const element = e.currentTarget;
            const elementNodeId = element.dataset.nodeId;
            if (!elementNodeId) return;

            const listItemElement = element.closest(
                `[data-node-type=${NODE_TYPES.LIST_ITEM}]`
            ) as HTMLElement | null;

            // if the text is in a list item element
            const listItemElementId = listItemElement?.dataset.nodeId;
            if (listItemElementId) {
                const newListItemNode = createListItemNode();
                const syncedNodes = flushActiveText();
                const updatedNodes = insertNodeAfter(syncedNodes, listItemElementId, newListItemNode);
                replaceNodes(updatedNodes);
                focusNode(newListItemNode.nodes[0].id);
                return;
            }
            
            // otherwise just add a new line below
            const newTextNode = createTextNode();
            const syncedNodes = flushActiveText();
            const updatedNodes = insertNodeAfter(syncedNodes, elementNodeId, newTextNode);
            replaceNodes(updatedNodes);
            focusNode(newTextNode.id);
            return;
        }
        
        if (e.key === "Backspace") {
            const element = e.currentTarget;

            if (element.textContent === "") {
                const updatedNodes = deleteNode(nodes, node.id);
                replaceNodes(updatedNodes);
            }
        }
    }

    return (
        <div data-node-id={node.id} 
             data-node-type={node.type} 
             onBlur={blurHandler} 
             onKeyDown={keyDownHandler} 
             contentEditable 
             suppressContentEditableWarning
             className="outline-none whitespace-pre-wrap w-full"
        >{node.content}</div>
    )
}

export default TextElement;