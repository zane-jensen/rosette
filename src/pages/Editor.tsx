import Panel from "../components/Panel";
import ToolbarButton from "../components/ToolbarButton";
import { type RosetteNode } from "../nodes/types";
import { renderNode } from "../nodes/renderNode";
import { createOrderedListNode, createUnorderedListNode } from "../nodes/factories";
import { getFocusedId } from "../nodes/utils";
import { useEditor } from "../providers/editor/EditorProvider";
import { deleteNode, insertToolbarNode } from "../nodes/commands";


const Editor = () => {
    const {nodes, replaceNodes, flushActiveText} = useEditor();

    const deleteFocused = () => {
        var focusedId = getFocusedId();
        if (!focusedId) return;

        const updatedNodes = deleteNode(nodes, focusedId);
        replaceNodes(updatedNodes);
    }

    const toolbarHandler = (node: RosetteNode) => {
        const syncedNodes = flushActiveText();

        const focusedId = getFocusedId();
        const updatedNodes = insertToolbarNode(syncedNodes, node, focusedId);
        replaceNodes(updatedNodes);
    }

    return (
        <Panel>
            <div className="flex flex-col gap-4 min-w-125 max-w-150">
                <p>Editor</p>

                <div
                className="flex flex-col items-start bg-(--color-dark-slate) p-4 inset-shadow-md"
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

                <div className="flex flex-row gap-2">
                    <button className="border-1 border-green rounded-md px-8 w-max hover:bg-green/20 cursor-pointer" onMouseDown={(e) => e.preventDefault()} onClick={() => deleteFocused()}>Delete</button>
                </div>
            </div>
            {true && <pre className='absolute top-[100%] left-0'>{JSON.stringify(nodes, null, 2)}</pre>}
        </Panel>
    )
}

export default Editor;