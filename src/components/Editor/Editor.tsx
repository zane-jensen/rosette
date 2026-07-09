import Panel from "../Panel";
import ToolbarButton from "../ToolbarButton";
import { NODE_TYPES, type OrderedListNode, type RosetteNode, type TextNode, type UnorderedListNode } from "../../nodes/types";
import { renderNode } from "../../nodes/renderNode";
import { copyNodes, createListItemNode, createOrderedListNode, createTextNode, createUnorderedListNode } from "../../nodes/factories";
import { findNodeById, findNodeOfType, getActiveElement, getActiveNode, getNodeAtPath, getNodeBefore, getParentPath, getSelectedNodes, updateNodeById } from "../../nodes/utils";
import { EditorProvider, useEditor } from "../../providers/editor/EditorProvider";
import { deleteNode, insertToolbarNode, insertNodeAfter, insertNodeBefore } from "../../nodes/commands";
import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import "./editor.css";

interface EditorProps {
    defaultValue?: RosetteNode[];
    onChange?: (nodes: RosetteNode[]) => void;
    className?: string;
}


const EditorInner = ({className}: {className?: string}) => {
    const {nodes, replaceNodes, focusNode} = useEditor();
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;

        el.addEventListener("beforeinput", beforeInputHandler);

        return () => {el.removeEventListener("beforeinput", beforeInputHandler)}
    }, [nodes])

    const toolbarHandler = (node: RosetteNode) => {
        const element = getActiveElement();
        const updatedNodes = insertToolbarNode(nodes, node, element?.dataset.nodeId);
        replaceNodes(updatedNodes);

        // you need to get the toolbarnode again, as the children may be stale at this time.
        const targetToolbarNode = findNodeById(updatedNodes, node.id);
        if (!targetToolbarNode) return;

        const newTextNode = findNodeOfType(targetToolbarNode.node, NODE_TYPES.TEXT);
        if (newTextNode) focusNode(newTextNode.id, newTextNode.content.length);
    }

    const copyHandler = (e: ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const selectedNodes = getSelectedNodes(nodes);

        const topNodes: RosetteNode[] = [];
        const topNodeIds: string[] = [];

        for (let nodeResult of selectedNodes) {
            let {nodePath} = nodeResult;

            let topNode = getNodeAtPath(nodes, [nodePath[0]]);
            if (!topNode) continue;

            if (!topNodeIds.includes(topNode.id)) {
                topNodes.push(topNode);
                topNodeIds.push(topNode.id);
            }
        }

        e.clipboardData.setData("text/plain", selection.toString());
        e.clipboardData.setData("application/rosette+json", JSON.stringify(topNodes));
    }

    const pasteHandler = (e: ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();

        let syncedNodes = nodes;

        const activeNode = getActiveNode(syncedNodes);
        if (!activeNode) return;

        const rosetteData = e.clipboardData.getData("application/rosette+json");
        const plainText = e.clipboardData.getData("text/plain");

        let newNodes: RosetteNode[] = [];
        if (rosetteData) {
            newNodes = copyNodes(JSON.parse(rosetteData));
        }
        else if (plainText) {
            const lines = plainText.split(/\r?\n/).map(l => l.trim());
            newNodes = lines.map(line => createTextNode(line));
        }

        if (newNodes.length === 0) return;

        syncedNodes = insertNodeAfter(syncedNodes, activeNode.node.id, newNodes);
        replaceNodes(syncedNodes);

        // focus last node
        let lastNode = newNodes.at(-1)!;
        let focusedTextNode = findNodeOfType(lastNode, NODE_TYPES.TEXT);
        if (!focusedTextNode) return;
        focusNode(focusedTextNode.id, focusedTextNode.content.length);
    }

    const beforeInputHandler = (e: globalThis.InputEvent) => {
        e.preventDefault();
        const inputType = e.inputType;

        const active = getActiveNode(nodes);
        if (!active?.node || active.node.type !== NODE_TYPES.TEXT) return;

        const {node} = active;

        var selection = getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);

        var syncedNodes = nodes;
        
        if (inputType === "insertText") {
            const text = e.data ?? "";
            console.log(text);

            syncedNodes = updateNodeById(nodes, node.id, {
                ...node,
                content: node.content.slice(0, range.startOffset) + text + node.content.slice(range.endOffset)
            });

            replaceNodes(syncedNodes);
            focusNode(node.id, range.startOffset + text.length)
        }

        if (inputType === "deleteContentBackward") {
            let startOffset = range.startOffset
            const selectedNodesResults = getSelectedNodes(nodes);
            
            if (!selection.isCollapsed && selectedNodesResults.length > 1) {
                let startNode = selectedNodesResults[0].node as TextNode;
                let middleNodes = selectedNodesResults.length > 2 ? selectedNodesResults.slice(1, selectedNodesResults.length - 1) : [];
                let endNode = selectedNodesResults[selectedNodesResults.length - 1].node as TextNode;

                // start node updates
                syncedNodes = updateNodeById(syncedNodes, startNode.id, {
                    ...startNode,
                    content: startNode.content.slice(0, startOffset)
                });
                
                // middle node deletes
                for (let nodeResult of middleNodes) {
                    let node = nodeResult.node;
                    syncedNodes = deleteNode(syncedNodes, node.id);
                }

                // end node updates
                if (endNode.content.length === range.endOffset) {
                    syncedNodes = deleteNode(syncedNodes, endNode.id);
                }
                else {
                    syncedNodes = updateNodeById(syncedNodes, endNode.id, {
                        ...endNode,
                        content: endNode.content.slice(range.endOffset)
                    })
                }                
            }
            else {
                startOffset = selection.isCollapsed ? startOffset - 1 : startOffset;

                syncedNodes = updateNodeById(nodes, node.id, {
                    ...node,
                    content: node.content.slice(0, startOffset) + node.content.slice(range.endOffset)
                });
            }

            replaceNodes(syncedNodes);
            const focusedNode = selectedNodesResults.length > 0 ? selectedNodesResults[0].node : node;
            focusNode(focusedNode.id, Math.max(0, startOffset));
        }

        if (inputType === "deleteSoftLineBackward") {
            let syncedNodes = updateNodeById(nodes, node.id, {
                ...node,
                content: node.content.slice(range.endOffset)
            });

            replaceNodes(syncedNodes);
            focusNode(node.id, 0);
        }
    }

    const keyDownHandler = (e: KeyboardEvent<HTMLParagraphElement>) => {
        if (e.key == "Enter") {
            e.preventDefault();
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);

            let syncedNodes = [...nodes];

            const target = getActiveNode(syncedNodes);
            if (!target) return;
            const {node, nodePath} = target;

            if (node.type !== NODE_TYPES.TEXT) return;

            const [formerText, latterText] = [node.content.slice(0, range.startOffset), node.content.slice(range.startOffset)];

            var newNode;
            var newNodeParentId;

            // if nested inside of something
            if (nodePath.length > 1) {
                const parentPath = getParentPath(nodePath);
                const parent = getNodeAtPath(nodes, parentPath);
                if (!parent) return;

                // if text blank
                if (node.content === "") {
                    const listNode = getNodeAtPath(nodes, getParentPath(nodePath, 2));
                    if (!listNode) return;

                    // if node is nested in another list make a new list item node
                    const listParentNode = getNodeAtPath(nodes, getParentPath(nodePath, 3));
                    const newNode = listParentNode ? createListItemNode() : createTextNode();
                    
                    let syncedNodes = insertNodeAfter(nodes, listParentNode?.id || listNode.id, newNode);
                    syncedNodes = deleteNode(syncedNodes, node.id);
                    replaceNodes(syncedNodes);
                    focusNode(newNode.id, 0);
                    return;
                }
                
                newNode = createListItemNode(formerText);
                newNodeParentId = parent.id;
            }
            // otherwise just add a new line below
            else {
                newNode = createTextNode(formerText);
                newNodeParentId = node.id;
            }
            
            syncedNodes = insertNodeBefore(syncedNodes, newNodeParentId, newNode);
            syncedNodes = updateNodeById(syncedNodes, node.id, {
                ...node,
                content: latterText
            });

            replaceNodes(syncedNodes);
            focusNode(node.id, 0);
            return;
        }
        
        if (e.key === "Backspace") {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            let syncedNodes = [...nodes];

            let target = getActiveNode(syncedNodes);
            if (!target) return;

            let {node, nodePath} = target;

            if (node.type !== NODE_TYPES.TEXT) return;
            
            const range = selection.getRangeAt(0);

            // if line is at the start
            if (selection.isCollapsed && range.startOffset === 0) {
                e.preventDefault();

                const nodeBefore = getNodeBefore(nodes, node.id);
                if (!nodeBefore?.node) return;

                const parentPath = getParentPath(nodePath);
                const parent = getNodeAtPath(nodes, parentPath);

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

                var focusedNode;
                var focusOffset;

                syncedNodes = deleteNode(syncedNodes, node.id);

                const nodeBeforeParent = getNodeAtPath(nodes, getParentPath(nodeBefore.nodePath));
                // if text node was the first element in a list
                if (parent && !nodeBeforeParent && parent.type === NODE_TYPES.LIST_ITEM && parentPath[parentPath.length - 1] === 0) {
                    const newNode = {...createTextNode(), id: node.id};
                    
                    syncedNodes = insertNodeAfter(syncedNodes, nodeBefore.node.id, newNode);
                    focusedNode = findNodeOfType(newNode, NODE_TYPES.TEXT);
                    focusOffset = 0;
                }

                // if we haven't already focused a node, focus it to text before
                focusedNode = focusedNode || textNodeBefore;
                focusOffset = focusedNode.content.length;

                syncedNodes = updateNodeById(syncedNodes, focusedNode.id, {
                    ...focusedNode,
                    id: focusedNode.content === "" ? node.id : focusedNode.id,
                    content: focusedNode.content + node.content
                });
                
                replaceNodes(syncedNodes);
                focusNode(focusedNode.id, focusOffset);
            }
        }

        if (e.key === "Tab") {
            e.preventDefault();

            const active = getActiveNode(nodes);
            if (!active) return;

            const {node, nodePath} = active;

            const parentNodePath = getParentPath(nodePath);
            const parentNode = getNodeAtPath(nodes, parentNodePath);
            if (!parentNode) return;

            if (parentNode.type !== NODE_TYPES.LIST_ITEM) return;
            
            // get the node before, if it's text attempt to get the list item above it
            let nodeBeforeTarget = getNodeBefore(nodes, parentNode.id);
            if (!nodeBeforeTarget) return;
            
            let nodeBefore = nodeBeforeTarget.node.type === NODE_TYPES.TEXT ? getNodeAtPath(nodes, getParentPath(nodeBeforeTarget.nodePath)) : nodeBeforeTarget.node;
            if (!nodeBefore || nodeBefore.type !== NODE_TYPES.LIST_ITEM) return;

            // if active node is in a list
            const listNodePath = getParentPath(nodePath, 2);
            const listNode = getNodeAtPath(nodes, listNodePath);
            if (!listNode || !("nodes" in listNode)) return;

            // delete the active node
            let syncedNodes = deleteNode(nodes, node.id);

            // TAB + SHIFT (Shift down)
            let newParentNode: RosetteNode = nodeBefore;
            let shiftedNode;
            if (e.shiftKey) {
                const listParentNode = getNodeAtPath(syncedNodes, getParentPath(listNodePath));
                if (listParentNode?.type !== NODE_TYPES.LIST_ITEM) return;

                const newParentList = getNodeAtPath(syncedNodes, getParentPath(listNodePath, 2));
                if (!newParentList || !newParentList.nodes) return;
                newParentNode = newParentList;
                
                shiftedNode = {...parentNode};
                const shiftedNodeOrder = listNodePath[listNodePath.length - 2] + 1;

                syncedNodes = updateNodeById(syncedNodes, newParentList.id, {
                    ...newParentList,
                    nodes: [...newParentList.nodes.slice(0, shiftedNodeOrder), shiftedNode, ...newParentList.nodes.slice(shiftedNodeOrder)]
                });
            }
            // TAB (Shift Up)
            else {
                if (parentNodePath[parentNodePath.length - 1] === 0) return;

                const newParentNodeChildList: OrderedListNode | UnorderedListNode | null = findNodeOfType(newParentNode, [NODE_TYPES.ORDERED_LIST, NODE_TYPES.UNORDERED_LIST]);

                if (newParentNodeChildList) {
                    newParentNode = newParentNodeChildList;
                    shiftedNode = {...parentNode};
                }
                else {
                    shiftedNode = listNode.type === NODE_TYPES.ORDERED_LIST ? createOrderedListNode() : createUnorderedListNode();
                    shiftedNode.nodes = [{...parentNode}];
                }

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
        <Panel className={className}>
            <div className="flex flex-col gap-4 w-full">
                <p>Rosette</p>
                <div
                className="items-start bg-(--color-dark-slate) p-4 inset-shadow-md whitespace-pre-wrap w-full max-h-200 overflow-scroll"
                contentEditable
                suppressContentEditableWarning
                ref={editorRef}
                onKeyDown={keyDownHandler}
                onCopy={copyHandler}
                onPaste={pasteHandler}
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
        </Panel>
    )
}


const Editor = ({defaultValue, className, onChange}: EditorProps) => {
    return (
        <EditorProvider defaultValue={defaultValue} onChange={onChange}>
            <EditorInner className={className} />
        </EditorProvider>
    )
}



export default Editor;