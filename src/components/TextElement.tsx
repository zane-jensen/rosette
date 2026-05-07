import type { InputEvent } from "react";
import type { TextNode } from "../nodes/types";
import { useEditor } from "../providers/editor/EditorProvider";

interface ITextElement {
    node: TextNode;
    content?: string;
}



const TextElement = ({node, content = ""}: ITextElement) => {
    const { updateNode } = useEditor();

    const inputHandler = (e: InputEvent<HTMLParagraphElement>) => {
        updateNode({
            ...node,
            content: e.currentTarget.textContent
        })
    }

    return (
        <p data-node-id={node.id} onInput={inputHandler} contentEditable suppressContentEditableWarning>{content}</p>
    )
}

export default TextElement;