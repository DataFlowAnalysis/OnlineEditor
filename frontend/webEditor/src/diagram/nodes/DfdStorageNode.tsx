/** @jsx svg */
import { injectable, inject } from "inversify";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { svg, RenderingContext, ShapeView } from "sprotty";
import { DfdNodeImpl } from "./common";
import { VNode } from "snabbdom";
import { DfdPositionalLabelArgs } from "../labels/DfdPositionalLabel";
import { DfdNodeLabelRenderer } from "./DfdNodeLabels";

@injectable()
export class StorageNodeImpl extends DfdNodeImpl {
    static readonly TEXT_HEIGHT = 32;
    static readonly LABEL_START_HEIGHT = 28;
    static readonly LEFT_PADDING = 10;

    protected noLabelHeight(): number {
        return StorageNodeImpl.TEXT_HEIGHT;
    }
    protected labelStartHeight(): number {
        return StorageNodeImpl.LABEL_START_HEIGHT;
    }

    protected override calculateWidth(): number {
        return super.calculateWidth() + StorageNodeImpl.LEFT_PADDING;
    }
}

@injectable()
export class StorageNodeView extends ShapeView {
    constructor(@inject(DfdNodeLabelRenderer) private readonly labelRenderer: DfdNodeLabelRenderer) {
            super();
        }

    render(node: Readonly<DfdNodeImpl>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const { width, height } = node.bounds;
        const leftPadding = StorageNodeImpl.LEFT_PADDING / 2;

        return (
            <g class-sprotty-node={true} class-storage={true} style={node.geViewStyleObject()}>
                <rect x="0" y="0" width={width} height={height} stroke="red" />
                <line x1={StorageNodeImpl.LEFT_PADDING} y1="0" x2={StorageNodeImpl.LEFT_PADDING} y2={height} />
                {context.renderChildren(node, {
                    xPosition: width / 2 + leftPadding,
                    yPosition: StorageNodeImpl.TEXT_HEIGHT / 2,
                } as DfdPositionalLabelArgs)}
                {this.labelRenderer.renderNodeLabels(node, StorageNodeImpl.LABEL_START_HEIGHT, leftPadding)}
            </g>
        );
    }
}