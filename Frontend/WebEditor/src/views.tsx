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