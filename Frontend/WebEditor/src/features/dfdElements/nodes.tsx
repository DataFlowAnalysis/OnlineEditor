/** @jsx svg */
import {
    IView,
    SNodeImpl,
    WithEditableLabel,
    isEditableLabel,
    svg,
    withEditLabelFeature,
    RenderingContext,
    SLabelImpl,
    ShapeView,
    IViewArgs,
} from "sprotty";
import { SNode, SLabel, Bounds, Point } from "sprotty-protocol";
import { inject, injectable } from "inversify";
import { VNode } from "snabbdom";
import { LabelAssignment } from "../labels/labelTypeRegistry";
import { DynamicChildrenNode } from "./dynamicChildren";
import { containsDfdLabelFeature } from "../labels/elementFeature";
import { calculateTextWidth } from "../../utils";
import { DfdNodeLabelRenderer } from "../labels/labelRenderer";

export interface DfdNodeSchema extends SNode {
    text: string;
    labels: LabelAssignment[];
}

export abstract class DfdNode extends DynamicChildrenNode implements WithEditableLabel {
    static readonly DEFAULT_FEATURES = [...SNodeImpl.DEFAULT_FEATURES, withEditLabelFeature, containsDfdLabelFeature];
    static readonly DEFAULT_WIDTH = 50;
    static readonly WIDTH_PADDING = 8;

    text: string = "";
    labels: LabelAssignment[] = [];

    override setChildren(schema: DfdNodeSchema): void {
        schema.children = [
            {
                type: "label:positional",
                text: schema.text ?? "",
                id: schema.id + "-label",
            } as SLabel,
        ];
    }

    override removeChildren(schema: DfdNodeSchema): void {
        const label = schema.children?.find((element) => element.type === "label:positional") as
            | SLabel
            | undefined;
        schema.text = label?.text ?? "";
        schema.children = [];
    }

    get editableLabel() {
        const label = this.children.find((element) => element.type === "label:positional");
        if (label && isEditableLabel(label)) {
            return label;
        }

        return undefined;
    }

    protected calculateWidth(): number {
        const textWidth = calculateTextWidth(this.editableLabel?.text);
        const labelWidths = this.labels.map(
            (labelAssignment) => DfdNodeLabelRenderer.computeLabelContent(labelAssignment)[1],
        );

        const neededWidth = Math.max(...labelWidths, textWidth, DfdNode.DEFAULT_WIDTH);
        return neededWidth + DfdNode.WIDTH_PADDING;
    }

    protected abstract calculateHeight(): number;

    override get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.calculateWidth(),
            height: this.calculateHeight(),
        };
    }
}

@injectable()
export class StorageNode extends DfdNode {
    protected override calculateHeight(): number {
        const hasLabels = this.labels.length > 0;
        if (hasLabels) {
            return (
                StorageNode.LABEL_START_HEIGHT +
                this.labels.length * DfdNodeLabelRenderer.LABEL_SPACING_HEIGHT +
                DfdNodeLabelRenderer.LABEL_SPACE_BETWEEN
            );
        } else {
            return StorageNode.TEXT_HEIGHT;
        }
    }

    static readonly TEXT_HEIGHT = 32;
    static readonly LABEL_START_HEIGHT = 28;
}

@injectable()
export class StorageNodeView implements IView {
    constructor(@inject(DfdNodeLabelRenderer) private readonly labelRenderer: DfdNodeLabelRenderer) {}

    render(node: Readonly<DfdNode>, context: RenderingContext): VNode {
        const width = node.bounds.width;
        const height = node.bounds.height;

        return (
            <g class-sprotty-node={true} class-storage={true}>
                {/* This transparent rect exists only to make this element easily selectable.
                    Without this you would need click the text or exactly hit one of the lines.
                    With this rect you can click anywhere between the two lines to select it.
                    This is especially important when there is no text given or it is short. */}
                <rect x="0" y="0" width={width} height={height} class-select-rect={true} />

                <line x1="0" y1="0" x2={width} y2="0" />
                {context.renderChildren(node, {
                    xPosition: width / 2,
                    yPosition: StorageNode.TEXT_HEIGHT / 2,
                } as DfdPositionalLabelArgs)}
                {this.labelRenderer.renderNodeLabels(node, StorageNode.LABEL_START_HEIGHT)}
                <line x1="0" y1={height} x2={width} y2={height} />
            </g>
        );
    }
}

export class FunctionNode extends DfdNode {
    protected override calculateHeight(): number {
        const hasLabels = this.labels.length > 0;
        if (hasLabels) {
            return (
                // height for text
                FunctionNode.LABEL_START_HEIGHT +
                // height for the labels
                this.labels.length * DfdNodeLabelRenderer.LABEL_SPACING_HEIGHT +
                // Spacing between last label and the under edge of the node rectangle
                DfdNodeLabelRenderer.LABEL_SPACE_BETWEEN
            );
        } else {
            return FunctionNode.LABEL_START_HEIGHT + FunctionNode.SEPARATOR_NO_LABEL_PADDING;
        }
    }

    static readonly TEXT_HEIGHT = 28;
    static readonly SEPARATOR_NO_LABEL_PADDING = 4;
    static readonly SEPARATOR_LABEL_PADDING = 4;
    static readonly LABEL_START_HEIGHT = this.TEXT_HEIGHT + this.SEPARATOR_LABEL_PADDING;
    static readonly BORDER_RADIUS = 5;
}

@injectable()
export class FunctionNodeView implements IView {
    constructor(@inject(DfdNodeLabelRenderer) private readonly labelRenderer: DfdNodeLabelRenderer) {}

    render(node: Readonly<FunctionNode>, context: RenderingContext): VNode {
        const width = node.bounds.width;
        const height = node.bounds.height;
        const r = FunctionNode.BORDER_RADIUS;

        return (
            <g class-sprotty-node={true} class-function={true}>
                <rect x="0" y="0" width={width} height={height} rx={r} ry={r} />
                {context.renderChildren(node, {
                    xPosition: width / 2,
                    yPosition: FunctionNode.TEXT_HEIGHT / 2,
                } as DfdPositionalLabelArgs)}
                <line x1="0" y1={FunctionNode.TEXT_HEIGHT} x2={width} y2={FunctionNode.TEXT_HEIGHT} />
                {this.labelRenderer.renderNodeLabels(node, FunctionNode.LABEL_START_HEIGHT)}
            </g>
        );
    }
}

export class IONode extends DfdNode {
    protected override calculateHeight(): number {
        const hasLabels = this.labels.length > 0;
        if (hasLabels) {
            return (
                IONode.LABEL_START_HEIGHT +
                this.labels.length * DfdNodeLabelRenderer.LABEL_SPACING_HEIGHT +
                DfdNodeLabelRenderer.LABEL_SPACE_BETWEEN
            );
        } else {
            return IONode.TEXT_HEIGHT;
        }
    }

    protected override calculateWidth(): number {
        return super.calculateWidth() + IONode.LEFT_PADDING;
    }

    static readonly TEXT_HEIGHT = 32;
    static readonly LABEL_START_HEIGHT = 28;
    static readonly LEFT_PADDING = 10;
}

@injectable()
export class IONodeView implements IView {
    constructor(@inject(DfdNodeLabelRenderer) private readonly labelRenderer: DfdNodeLabelRenderer) {}

    render(node: Readonly<DfdNode>, context: RenderingContext): VNode {
        const width = node.bounds.width;
        const height = node.bounds.height;
        const leftPadding = IONode.LEFT_PADDING / 2;

        return (
            <g class-sprotty-node={true} class-io={true}>
                <rect x="0" y="0" width={width} height={height} />
                <line x1={IONode.LEFT_PADDING} y1="0" x2={IONode.LEFT_PADDING} y2={height} />
                {context.renderChildren(node, {
                    xPosition: width / 2 + leftPadding,
                    yPosition: IONode.TEXT_HEIGHT / 2,
                } as DfdPositionalLabelArgs)}
                {this.labelRenderer.renderNodeLabels(node, IONode.LABEL_START_HEIGHT, leftPadding)}
            </g>
        );
    }
}

interface DfdPositionalLabelArgs extends IViewArgs {
    xPosition: number;
    yPosition: number;
}

@injectable()
export class DfdPositionalLabelView extends ShapeView {
    private getPosition(label: Readonly<SLabelImpl>, args?: DfdPositionalLabelArgs | IViewArgs): Point {
        if (args && "xPosition" in args && "yPosition" in args) {
            return { x: args.xPosition, y: args.yPosition };
        } else {
            const parentSize = (label.parent as SNodeImpl | undefined)?.bounds;
            const width = parentSize?.width ?? 0;
            const height = parentSize?.height ?? 0;
            return { x: width / 2, y: height / 2 };
        }
    }

    render(label: Readonly<SLabelImpl>, _context: RenderingContext, args?: DfdPositionalLabelArgs): VNode | undefined {
        const position = this.getPosition(label, args);

        return (
            <text class-sprotty-label={true} x={position.x} y={position.y}>
                {label.text}
            </text>
        );
    }
}
