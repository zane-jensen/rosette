import Panel from "../components/Panel";
import ToolbarButton from "../components/ToolbarButton";
import { NODE_TYPES, type RosetteNode } from "../nodes/types";
import { renderNode } from "../nodes/renderNode";
import { createListItemNode, createOrderedListNode, createTextNode, createUnorderedListNode } from "../nodes/factories";
import { deleteNodeById, findNodeById, findNodeOfType, getActiveElement, getNodeAtPath, getNodeBefore, getParentPath, getSelectedNodes, insertNodeAfter, splitTextElement, updateNodeById } from "../nodes/utils";
import { useEditor } from "../providers/editor/EditorProvider";
import { deleteNode, insertToolbarNode } from "../nodes/commands";
import { type KeyboardEvent } from "react";


const Editor = () => {
    const {nodes, replaceNodes, flushDirtyNodes, focusNode, addDirtyNode} = useEditor();

    const toolbarHandler = (node: RosetteNode) => {
        const syncedNodes = flushDirtyNodes();

        const element = getActiveElement();
        const updatedNodes = insertToolbarNode(syncedNodes, node, element?.dataset.nodeId);
        replaceNodes(updatedNodes);

        // you need to get the toolbarnode again, as the children may be stale at this time.
        const targetToolbarNode = findNodeById(updatedNodes, node.id);
        if (!targetToolbarNode) return;

        const newTextNode = findNodeOfType(targetToolbarNode.node, NODE_TYPES.TEXT);
        if (newTextNode) focusNode(newTextNode.id, newTextNode.content.length);
    }

    const blurHandler = () => {
        const syncedNodes = flushDirtyNodes();
        replaceNodes(syncedNodes);
    }

    const inputHandler = () => {
        const element = getActiveElement();
        if (!element) return;

        addDirtyNode(element.dataset.nodeId!);
    }

    const keyDownHandler = (e: KeyboardEvent<HTMLParagraphElement>) => {
        if (e.key == "Enter") {
            e.preventDefault();

            var syncedNodes = flushDirtyNodes();
            
            const element = getActiveElement();
            if (!element) return;

            const elementNodeId = element.dataset.nodeId;
            if (!elementNodeId) return;

            const listItemElement = element.closest(
                `[data-node-type=${NODE_TYPES.LIST_ITEM}]`
            ) as HTMLElement | null;

            const target = findNodeById(syncedNodes, elementNodeId);
            if (!target) return;
            const {node} = target;

            if (node.type !== NODE_TYPES.TEXT) return;

            const [formerText, latterText] = splitTextElement(element);

            // if the text is in a list item element
            const listItemElementId = listItemElement?.dataset.nodeId;

            var newNode;
            var newNodeParentId;
            if (listItemElementId) {
                // if the text is currently blank, exit out of the list
                if (element.innerText === "") {
                    const newTextNode = createTextNode();

                    const listItemTarget = findNodeById(syncedNodes, listItemElementId);
                    if (!listItemTarget) return;

                    const listNode = getNodeAtPath(syncedNodes, getParentPath(listItemTarget.nodePath))
                    if (!listNode) return;
                    
                    syncedNodes = insertNodeAfter(syncedNodes, listNode.id, newTextNode);
                    syncedNodes = deleteNodeById(syncedNodes, listItemElementId);
                    replaceNodes(syncedNodes);
                    focusNode(newTextNode.id, 0);
                    return;
                }
                
                newNode = createListItemNode(latterText);
                newNodeParentId = listItemElementId;
            }
            // otherwise just add a new line below
            else {
                newNode = createTextNode(latterText);
                newNodeParentId = elementNodeId;
            }

            syncedNodes = insertNodeAfter(syncedNodes, newNodeParentId, newNode);
            syncedNodes = updateNodeById(syncedNodes, elementNodeId, {
                ...node,
                content: formerText
            });

            replaceNodes(syncedNodes);
            const childTextNode = findNodeOfType(newNode, NODE_TYPES.TEXT);
            if (childTextNode) focusNode(childTextNode.id, 0);
            return;
        }
        
        if (e.key === "Backspace") {
            var syncedNodes = flushDirtyNodes();

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            // if items are multi-selected / highlighted
            if (!selection.isCollapsed) {
                e.preventDefault();
                
                const range = getSelectedNodes(syncedNodes);
                if (!range) return;

                const deadNodes = range.nodesInRange(syncedNodes);
                const deadNodeIds = deadNodes.map(n => n.id);

                const updatedNodes = syncedNodes.filter(n => !deadNodeIds.includes(n.id));
                replaceNodes(updatedNodes.length !== 0 ? updatedNodes : [createTextNode()]);
            }

            let element = getActiveElement();
            console.log(element);
            if (!element) return;

            let target = findNodeById(syncedNodes, element.dataset.nodeId!);
            if (!target) return;

            let {node, nodePath} = target;

            if (node.type !== NODE_TYPES.TEXT) return;
            
            const range = selection.getRangeAt(0);

            // if line is at the start
            if (range.startOffset === 0) {
                e.preventDefault();

                const nodeBefore = getNodeBefore(syncedNodes, node.id);
                if (!nodeBefore) return;

                const parentPath = getParentPath(nodePath);
                const parent = getNodeAtPath(syncedNodes, parentPath);

                var newTextNode;
                // if node has no other text nodes before it (last node)
                const textNodeBefore = findNodeOfType(nodeBefore, NODE_TYPES.TEXT);
                if (!textNodeBefore) {
                    syncedNodes = updateNodeById(syncedNodes, node.id, {
                        ...node,
                        content: ""
                    });

                    replaceNodes(syncedNodes);
                    focusNode(node.id, 0);
                    return;
                }

                var focusedNodeId;
                var focusOffset;

                // if text node is the first element in a list
                if (parent && parent.type === NODE_TYPES.LIST_ITEM && parentPath[parentPath.length - 1] === 0) {
                    newTextNode = createTextNode(node.content);
                    syncedNodes = insertNodeAfter(syncedNodes, nodeBefore.id, newTextNode);
                    
                    focusedNodeId = newTextNode.id;
                }

                // if deleted node has content left in it
                if (node.content) {
                    syncedNodes = updateNodeById(syncedNodes, textNodeBefore.id, {
                        ...textNodeBefore,
                        content: textNodeBefore.content + node.content
                    });

                    focusedNodeId = textNodeBefore.id;
                    focusOffset = textNodeBefore.content.length;
                }

                syncedNodes = deleteNode(syncedNodes, node.id);
                replaceNodes(syncedNodes);

                focusedNodeId = focusedNodeId || textNodeBefore.id;
                focusOffset = focusOffset || textNodeBefore.content.length;
                console.log(focusedNodeId, focusOffset);
                focusNode(focusedNodeId, focusOffset);
            }
        }
    }

    return (
        <Panel>
            <div className="flex flex-col gap-4 min-w-125 max-w-150">
                <p>Editor</p>

                <div
                className="flex flex-col items-start bg-(--color-dark-slate) p-4 inset-shadow-md whitespace-pre-wrap"
                contentEditable 
                suppressContentEditableWarning
                onBlur={blurHandler} 
                onInput={inputHandler}
                onKeyDown={keyDownHandler} 
                onSelect={inputHandler}
                >
                    {nodes.map((n: RosetteNode) => renderNode(n))}
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
            </div>
            {true && <pre className='absolute top-[100%] left-0'>{JSON.stringify(nodes, null, 2)}</pre>}
        </Panel>
    )
}

export default Editor;