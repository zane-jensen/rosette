import { renderToStaticMarkup } from "react-dom/server";
import type { RosetteNode } from "../../nodes/types";
import { renderNode } from "../../nodes/renderNode";

export function formatRosetteToHtml(nodes: RosetteNode[]): string {
    return nodes.map(node => renderToStaticMarkup(renderNode(node))).join('');
}
