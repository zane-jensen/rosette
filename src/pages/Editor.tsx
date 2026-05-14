import Panel from "../components/Panel";
import ToolbarButton from "../components/ToolbarButton";
import { NODE_TYPES, type RosetteNode } from "../nodes/types";
import { renderNode } from "../nodes/renderNode";
import { createListItemNode, createOrderedListNode, createTextNode, createUnorderedListNode } from "../nodes/factories";
import { findNodeById, findNodeOfType, getActiveElement, getActiveNode, getNodeAtPath, getNodeBefore, getParentPath, getSelectedNodes, insertNodeAfter, splitTextElement, updateNodeById } from "../nodes/utils";
import { useEditor } from "../providers/editor/EditorProvider";
import { deleteNode, insertToolbarNode } from "../nodes/commands";
import { useEffect, useRef, type KeyboardEvent } from "react";


const Editor = () => {
    const {nodes, replaceNodes, flushDirtyNodes, focusNode} = useEditor();
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;

        el.addEventListener("beforeinput", beforeInputHandler);

        return () => {el.removeEventListener("beforeinput", beforeInputHandler)}
    }, [nodes])

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

    const beforeInputHandler = (e: globalThis.InputEvent) => {
        e.preventDefault();

        console.log(e);

        const active = getActiveNode(nodes);
        if (!active?.node || active.node.type !== NODE_TYPES.TEXT) return;

        const {node} = active;

        var selection = getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);

        const offset = range.startOffset

        if (e.inputType === "insertText") {
            const text = e.data ?? "";
            console.log(text);

            let syncedNodes = updateNodeById(nodes, node.id, {
                ...node,
                content: node.content.slice(0, offset) + text + node.content.slice(offset)
            });

            replaceNodes(syncedNodes);
            focusNode(node.id, offset + text.length)
        }

        if (e.inputType === "deleteContentBackward") {
            let syncedNodes = updateNodeById(nodes, node.id, {
                ...node,
                content: node.content.slice(0, offset - 1) + node.content.slice(offset)
            });

            replaceNodes(syncedNodes);
            focusNode(node.id, offset - 1);
        }

        if (e.inputType === "deleteSoftLineBackward") {
            let syncedNodes = updateNodeById(nodes, node.id, {
                ...node,
                content: node.content.slice(offset)
            });

            replaceNodes(syncedNodes);
            focusNode(node.id, offset);
        }
    }

    const keyDownHandler = (e: KeyboardEvent<HTMLParagraphElement>) => {
        if (e.key == "Enter") {
            e.preventDefault();

            var syncedNodes = flushDirtyNodes();
            
            const element = getActiveElement();
            if (!element) return;

            const elementNodeId = element.dataset.nodeId;
            if (!elementNodeId) return;

            const target = findNodeById(syncedNodes, elementNodeId);
            if (!target) return;
            const {node, nodePath} = target;

            if (node.type !== NODE_TYPES.TEXT) return;

            const [formerText, latterText] = splitTextElement(element);

            var newNode;
            var newNodeParentId;
            // if neseted inside of something
            if (nodePath.length > 1) {
                const parentPath = getParentPath(nodePath);
                const parent = getNodeAtPath(syncedNodes, parentPath);
                if (!parent) return;

                // if text blank
                if (node.content === "") {
                    const listNode = getNodeAtPath(syncedNodes, getParentPath(nodePath, 2));
                    if (!listNode) return;

                    // if node is nested in another list make a new list item node
                    const listParentNode = getNodeAtPath(syncedNodes, getParentPath(nodePath, 3));
                    const newNode = listParentNode ? createListItemNode() : createTextNode();
                    console.log(listParentNode);
                    
                    syncedNodes = insertNodeAfter(syncedNodes, listParentNode?.id || listNode.id, newNode);
                    syncedNodes = deleteNode(syncedNodes, elementNodeId);
                    replaceNodes(syncedNodes);
                    focusNode(newNode.id, 0);
                    return;
                }
                
                newNode = createListItemNode(latterText);
                newNodeParentId = parent.id;
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
                return;

                const range = getSelectedNodes(syncedNodes);
                if (!range) return;

                const deadNodes = range.nodesInRange(syncedNodes);
                const deadNodeIds = deadNodes.map(n => n.id);

                const updatedNodes = syncedNodes.filter(n => !deadNodeIds.includes(n.id));
                replaceNodes(updatedNodes.length !== 0 ? updatedNodes : [createTextNode()]);
            }

            let element = getActiveElement();
            if (!element) {
                return;
            }

            let target = findNodeById(syncedNodes, element.dataset.nodeId!);
            if (!target) return;

            let {node, nodePath} = target;

            if (node.type !== NODE_TYPES.TEXT) return;
            
            const range = selection.getRangeAt(0);

            // if line is at the start
            if (range.startOffset === 0) {
                e.preventDefault();
                
                const nodeBefore = getNodeBefore(syncedNodes, node.id);
                console.log(nodeBefore);
                if (!nodeBefore?.node) return;

                const parentPath = getParentPath(nodePath);
                const parent = getNodeAtPath(syncedNodes, parentPath);

                // if node has no other text nodes before it (last node)
                const textNodeBefore = findNodeOfType(nodeBefore.node, NODE_TYPES.TEXT);
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
                    // if the node before belongs toa. list, add to the list instead
                    const nodeBeforeParent = getNodeAtPath(syncedNodes, getParentPath(nodeBefore.nodePath));
                    const newNode = nodeBeforeParent ? createListItemNode(node.content) : createTextNode(node.content);
                    
                    syncedNodes = insertNodeAfter(syncedNodes, nodeBeforeParent?.id || nodeBefore.node.id, newNode);
                    focusedNodeId = findNodeOfType(newNode, NODE_TYPES.TEXT)!.id;
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

        if (e.key === "Tab") {
            e.preventDefault();

            let syncedNodes = flushDirtyNodes();

            const active = getActiveNode(syncedNodes);
            if (!active) return;

            const {node, nodePath} = active;

            const parentNodePath = getParentPath(nodePath);
            const parentNode = getNodeAtPath(syncedNodes, parentNodePath);
            if (!parentNode) return;

            if (parentNode.type !== NODE_TYPES.LIST_ITEM) return;
            
            // get the node before, if it's text attempt to get the list item above it
            let nodeBeforeTarget = getNodeBefore(syncedNodes, parentNode.id);
            if (!nodeBeforeTarget) return;
            
            let nodeBefore = nodeBeforeTarget.node.type === NODE_TYPES.TEXT ? getNodeAtPath(syncedNodes, getParentPath(nodeBeforeTarget.nodePath)) : nodeBeforeTarget.node;
            if (!nodeBefore || nodeBefore.type !== NODE_TYPES.LIST_ITEM) return;

            // if active node is in a list
            const listNodePath = getParentPath(nodePath, 2);
            const listNode = getNodeAtPath(syncedNodes, listNodePath);
            console.log(listNode);
            if (!listNode || !("nodes" in listNode)) return;

            // delete the active node
            syncedNodes = deleteNode(syncedNodes, node.id);

            // TAB + SHIFT (Shift down)
            let newParentNode: RosetteNode = nodeBefore;
            let shiftedNode;
            if (e.shiftKey) {
                const listParentNode = getNodeAtPath(syncedNodes, getParentPath(listNodePath));
                if (listParentNode?.type !== NODE_TYPES.LIST_ITEM) return;

                const newParentList = getNodeAtPath(syncedNodes, getParentPath(listNodePath, 2));
                if (!newParentList || !("nodes" in newParentList)) return;
                newParentNode = newParentList;
                
                shiftedNode = {...parentNode};
                const shiftedNodeOrder = parentNodePath[parentNodePath.length - 1] + 1;

                syncedNodes = updateNodeById(syncedNodes, newParentList.id, {
                    ...newParentList,
                    nodes: [...newParentList.nodes.slice(0, shiftedNodeOrder), shiftedNode, ...newParentList.nodes.slice(shiftedNodeOrder)]
                });
            }
            // TAB (Shift Up)
            else {
                if (parentNodePath[parentNodePath.length - 1] === 0) return;

                shiftedNode = listNode.type === NODE_TYPES.ORDERED_LIST ? createOrderedListNode() : createUnorderedListNode();
                shiftedNode.nodes = [{...parentNode}];

                syncedNodes = updateNodeById(syncedNodes, newParentNode.id, {
                    ...newParentNode,
                    nodes: [...newParentNode.nodes, shiftedNode]
                });
            }   
            
            replaceNodes(syncedNodes);
            const focusedNode = findNodeOfType(shiftedNode, NODE_TYPES.TEXT);
            if (!focusedNode) return;

            focusNode(focusedNode.id, focusedNode.content.length);
            return;
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
                ref={editorRef}
                onKeyDown={keyDownHandler} 
                onPaste={(e) => e.preventDefault()}
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