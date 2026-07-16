import type { RosetteNode } from "../nodes/types";

interface IToolbarButton {
    buttonText?: string;
    node?: () => RosetteNode;
    onClick?: (node: RosetteNode) => void;
}

const ToolbarButton = ({buttonText, node, onClick}: IToolbarButton) => {
    const clickHandler = () => {
        if (node) onClick?.(node());
    }

    return (
        <button onMouseDown={(e) => e.preventDefault()} onClick={clickHandler} className="cursor-pointer hover:bg-green/20 px-3 py-1.5 border-1 border-transparent hover:border-green">{buttonText}</button>
    )
}

export default ToolbarButton;