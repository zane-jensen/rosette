import {type TextNode } from "../nodes/types";

interface ITextElement {
    node: TextNode;
}



const TextElement = ({node}: ITextElement) => {
    return (
        <p data-node-id={node.id} 
             data-node-type={node.type}
             className="outline-none w-full min-h-[1em]"
        >{node.content}</p>
    )
}

export default TextElement;