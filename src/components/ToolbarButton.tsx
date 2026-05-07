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
        <button onMouseDown={(e) => e.preventDefault()} onClick={clickHandler} className="cursor-pointer">{buttonText}</button>
    )
}

export default ToolbarButton;