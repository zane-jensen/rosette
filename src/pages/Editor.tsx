import { useState } from "react";
import Panel from "../components/Panel";
import ToolbarButton from "../components/ToolbarButton";
import { type RosetteNode } from "../nodes/types";
import { renderNode } from "../nodes/renderNode";
import { createOrderedListNode, createTextNode, createUnorderedListNode } from "../nodes/factories";


const Editor = () => {
    const [nodes, setNodes] = useState<RosetteNode[]>([
        createTextNode("hello"),
        createUnorderedListNode()
    ]);

    const toolbarHandler = (node: RosetteNode) => {
        setNodes(prev => [...prev, node]);
    }

    return (
        <Panel>
            <div className="flex flex-col gap-4 min-w-150">
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
            </div>
        </Panel>
    )
}

export default Editor;