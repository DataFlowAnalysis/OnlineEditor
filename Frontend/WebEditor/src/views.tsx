/** @jsx svg */
import { SNode as SNodeSchema } from "sprotty-protocol";
import { svg, IView, SNode, RenderingContext, CircularNodeView } from "sprotty";
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
        const height = 30;
        return (
            <g class-sprotty-node={true} class-storage={true}>
                <line x1="0" y1="0" x2={width} y2="0" />
                <text x={width / 2} y={height / 2 + 5}>
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
export class FunctionNodeView extends CircularNodeView implements IView {
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

export interface IONodeSchema extends SNodeSchema {
    // TODO: must this be optional? Can this be made required?
    name?: string;
}

// TODO: the node is the same everywhere (for now), so this could be a single class and single schema instead
export class IONode extends SNode {
    name: string = "";
}

@injectable()
export class IONodeView implements IView {
    render(node: Readonly<IONode>, _context: RenderingContext): VNode {
        const width = 80;
        const height = 40;

        return (
            <g class-sprotty-node={true} class-io={true}>
                <rect x="0" y="0" width={width} height={height} />
                <text x={width / 2} y={height / 2 + 5}>
                    {node.name}
                </text>
            </g>
        );
    }
}
