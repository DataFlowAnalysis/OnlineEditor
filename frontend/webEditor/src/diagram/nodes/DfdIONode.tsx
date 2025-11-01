/** @jsx svg */
import { inject, injectable } from "inversify";
import { DfdNodeImpl } from "./common";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ShapeView, svg, RenderingContext } from "sprotty";
import { VNode } from "snabbdom";
import { DfdPositionalLabelArgs } from "../labels/DfdPositionalLabel";
import { DfdNodeLabelRenderer } from "./DfdNodeLabels";

@injectable()
export class IONodeImpl extends DfdNodeImpl {
    static readonly TEXT_HEIGHT = 32;
    static readonly LABEL_START_HEIGHT = 28;

    protected noLabelHeight(): number {
        return IONodeImpl.TEXT_HEIGHT;
    }
    protected labelStartHeight(): number {
        return IONodeImpl.LABEL_START_HEIGHT
    }
}

@injectable()
export class IONodeView extends ShapeView {

    constructor(@inject(DfdNodeLabelRenderer) private readonly labelRenderer: DfdNodeLabelRenderer) {
        super();
    }

    render(node: Readonly<DfdNodeImpl>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const { width, height } = node.bounds;

        return (
            <g class-sprotty-node={true} class-io={true} style={node.geViewStyleObject()}>
                <rect x="0" y="0" width={width} height={height} />
                {context.renderChildren(node, {
                    xPosition: width / 2,
                    yPosition: IONodeImpl.TEXT_HEIGHT / 2,
                } as DfdPositionalLabelArgs)}
                {this.labelRenderer.renderNodeLabels(node, IONodeImpl.LABEL_START_HEIGHT)}
            </g>
        );
    }
}
