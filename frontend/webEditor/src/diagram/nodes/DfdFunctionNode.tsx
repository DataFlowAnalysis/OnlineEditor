/** @jsx svg */
import { inject, injectable } from "inversify";
import { DfdNodeImpl } from "./common";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ShapeView, RenderingContext, svg } from "sprotty";
import { VNode } from "snabbdom";
import { DfdPositionalLabelArgs } from "../labels/DfdPositionalLabel";
import { DfdNodeLabelRenderer } from "./DfdNodeLabels";

export class FunctionNodeImpl extends DfdNodeImpl {
    static readonly TEXT_HEIGHT = 28;
    static readonly SEPARATOR_NO_LABEL_PADDING = 4;
    static readonly SEPARATOR_LABEL_PADDING = 4;
    static readonly LABEL_START_HEIGHT = this.TEXT_HEIGHT + this.SEPARATOR_LABEL_PADDING;
    static readonly BORDER_RADIUS = 5;

    protected noLabelHeight(): number {
        return FunctionNodeImpl.LABEL_START_HEIGHT + FunctionNodeImpl.SEPARATOR_NO_LABEL_PADDING;
    }
    protected labelStartHeight(): number {
        return FunctionNodeImpl.LABEL_START_HEIGHT;
    }
}

@injectable()
export class FunctionNodeView extends ShapeView {
    constructor(@inject(DfdNodeLabelRenderer) private readonly labelRenderer: DfdNodeLabelRenderer) {
        super();
    }

    render(node: Readonly<FunctionNodeImpl>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const { width, height } = node.bounds;
        const r = FunctionNodeImpl.BORDER_RADIUS;

        return (
            <g class-sprotty-node={true} class-function={true} style={node.geViewStyleObject()}>
                <rect x="0" y="0" width={width} height={height} rx={r} ry={r} />
                <line x1="0" y1={FunctionNodeImpl.TEXT_HEIGHT} x2={width} y2={FunctionNodeImpl.TEXT_HEIGHT} />
                {context.renderChildren(node, {
                    xPosition: width / 2,
                    yPosition: FunctionNodeImpl.TEXT_HEIGHT / 2,
                } as DfdPositionalLabelArgs)}
                {this.labelRenderer.renderNodeLabels(node, FunctionNodeImpl.LABEL_START_HEIGHT)}
            </g>
        );
    }
}
