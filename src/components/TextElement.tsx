import {type TextNode } from "../nodes/types";

interface ITextElement {
    node: TextNode;
}



const TextElement = ({node}: ITextElement) => {
    return (
        <div data-node-id={node.id} 
             data-node-type={node.type}
             className="outline-none w-full wrap-anywhere"
        >{node.content || <br />}</div>
    )
}

export default TextElement;