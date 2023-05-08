/** @jsx svg */
import { SNode as SNodeSchema } from "sprotty-protocol";
import { svg, IView, SNode, RenderingContext } from "sprotty";
import { injectable } from "inversify";
import { VNode } from "snabbdom";
import "./views.css";

export interface StorageNodeSchema extends SNodeSchema {
    name?: string;
}

export class StorageNode extends SNode {
    name: string = "";
}

@injectable()
export class StorageNodeView implements IView {
    render(node: Readonly<StorageNode>, _context: RenderingContext): VNode {
        const width = 60;
        const height = 20;
        return (
            <g class-sprotty-node={true} class-storage={true}>
                <line x1="0" y1="0" x2={width} y2="0" />
                <text x={width / 2} y={height - 5}>
                    {node.name}
                </text>
                <line x1="0" y1={height} x2={width} y2={height} />
            </g>
        );
    }
}

export interface FunctionNodeSchema extends SNodeSchema {
    name?: string;
}

export class FunctionNode extends SNode {
    name: string = "";
}

@injectable()
export class FunctionNodeView implements IView {
    render(node: Readonly<StorageNode>, _context: RenderingContext): VNode {
        const radius = 20;
        return (
            <g class-sprotty-node={true} class-function={true}>
                <circle r={radius} cx={radius} cy={radius} />
                <text x={radius} y={radius + 5}>
                    {node.name}
                </text>
            </g>
        );
    }
}
