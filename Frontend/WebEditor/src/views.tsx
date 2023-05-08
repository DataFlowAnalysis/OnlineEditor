/** @jsx svg */
import {svg, IView, SNode, RenderingContext, SNodeSchema} from "sprotty";
import {injectable} from "inversify";
import { VNode } from "snabbdom";
import "./views.css";

export interface TaskNodeSchema extends SNodeSchema {
    name?: string
    status?: string
}

export class TaskNode extends SNode {
    name: string = ''
    status: string = ''
}

@injectable()
export class TaskNodeView implements IView {
    render(node: Readonly<TaskNode>, _context: RenderingContext): VNode {
        const radius = 20;
        // In this context, the coordinates (0,0) mark the upper left corner of
        // the node, thus we shift all elements by the radius of the circle.
        return <g>
            <circle class-sprotty-node={true} class-task={true}
                    class-running={node.status === 'running'}
                    class-finished={node.status === 'finished'}
                    r={radius} cx={radius} cy={radius}></circle>
            <text x={radius} y={radius + 5}>{node.name}</text>
        </g>;
    }
}

export interface StorageNodeSchema extends SNodeSchema {
    name?: string;
}

export class StorageNode extends SNode {
    name: string = '';
}

@injectable()
export class StorageNodeView implements IView {
    render(node: Readonly<StorageNode>, _context: RenderingContext): VNode {
        const width = 60;
        const height = 20;
        return <g class-sprotty-node={true} class-storage={true}>
            <line x1="0" y1="0" x2={width} y2="0"></line>
            <text x={width / 2} y={height - 5}>{node.name}</text>
            <line x1="0" y1={height} x2={width} y2={height}></line>
        </g>;
    }
}