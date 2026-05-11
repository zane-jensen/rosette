import type { FindNodeResult, RosetteNode } from "../nodes/types";
import { getNodeAtPath } from "../nodes/utils";

export class NodeRange {
    public start: FindNodeResult;
    public end: FindNodeResult;
    public startOffset: number;
    public endOffset: number;

    constructor(
        start: FindNodeResult,
        end: FindNodeResult,
        startOffset: number,
        endOffset: number
    ) {
        this.start = start;
        this.end = end;
        this.startOffset = startOffset;
        this.endOffset = endOffset;
    }

    nodesInRange(nodes: RosetteNode[]) {
        const startPath = this.start.nodePath;
        const endPath = this.end.nodePath;

        const cachedNodes: RosetteNode[] = [];

        for (let i = startPath[0]; i <= endPath[0]; i++) {
            const node = getNodeAtPath(nodes, [i]);
            if (node) cachedNodes.push(node);
        }

        return cachedNodes;
    }
}