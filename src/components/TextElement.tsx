interface ITextElement {
    content: string;
}



const TextElement = ({content = ""}: ITextElement) => {
    return (
        <p contentEditable suppressContentEditableWarning>{content}</p>
    )
}

export default TextElement;