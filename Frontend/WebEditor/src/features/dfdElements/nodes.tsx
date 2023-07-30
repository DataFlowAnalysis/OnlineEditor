/** @jsx svg */
import {
    IView,
    SNode,
    WithEditableLabel,
    hoverFeedbackFeature,
    isEditableLabel,
    svg,
    withEditLabelFeature,
    RenderingContext,
    ELLIPTIC_ANCHOR_KIND,
    SLabel,
    ShapeView,
    IViewArgs,
} from "sprotty";
import { SNode as SNodeSchema, SLabel as SLabelSchema, Bounds, Point } from "sprotty-protocol";
import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { LabelAssignment } from "../labels/labelTypeRegistry";
import { DynamicChildrenNode } from "./dynamicChildren";
import { containsDfdLabelFeature } from "../labels/elementFeature";
import { calculateTextWidth, constructorInject } from "../../utils";
import { DfdNodeLabelRenderer } from "../labels/labelRenderer";

export interface DFDNodeSchema extends SNodeSchema {
    text: string;
    labels: LabelAssignment[];
}

class RectangularDFDNode extends DynamicChildrenNode implements WithEditableLabel {
    static readonly DEFAULT_FEATURES = [...SNode.DEFAULT_FEATURES, withEditLabelFeature, containsDfdLabelFeature];

    text: string = "";
    labels: LabelAssignment[] = [];

    override setChildren(schema: DFDNodeSchema): void {
        schema.children = [
            {
                type: "label",
                text: schema.text,
                id: schema.id + "-label",
            } as SLabelSchema,
        ];
    }

    override removeChildren(schema: DFDNodeSchema): void {
        const label = schema.children?.find((element) => element.type === "label") as SLabelSchema | undefined;
        schema.text = label?.text ?? "";
        schema.children = [];
    }

    get editableLabel() {
        const label = this.children.find((element) => element.type === "label");
        if (label && isEditableLabel(label)) {
            return label;
        }

        return undefined;
    }
}

@injectable()
export class StorageNode extends RectangularDFDNode {
    static readonly DEFAULT_FEATURES = [...RectangularDFDNode.DEFAULT_FEATURES, hoverFeedbackFeature];

    private calculateHeight(): number {
        const hasLabels = this.labels.length > 0;
        if (hasLabels) {
            return 26 + this.labels.length * 12;
        } else {
            return 30;
        }
    }

    override get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: Math.max(calculateTextWidth(this.editableLabel?.text), 40),
            height: this.calculateHeight(),
        };
    }
}

@injectable()
export class StorageNodeView implements IView {
    constructor(@constructorInject(DfdNodeLabelRenderer) private readonly labelRenderer: DfdNodeLabelRenderer) {}

    render(node: Readonly<RectangularDFDNode>, context: RenderingContext): VNode {
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
                    yPosition: 20,
                } as DfdLabelArgs)}
                {this.labelRenderer.renderNodeLabels(node, 25)}
                <line x1="0" y1={height} x2={width} y2={height} />
            </g>
        );
    }
}

export class FunctionNode extends RectangularDFDNode {
    override get anchorKind() {
        return ELLIPTIC_ANCHOR_KIND;
    }

    calculateBaseDiameter(): number {
        const baseDiameter = calculateTextWidth(this.editableLabel?.text) + 5;
        // Clamp diameter to be between 30 and 60
        const clampedBaseDiameter = Math.min(Math.max(baseDiameter, 30), 60);
        return clampedBaseDiameter;
    }

    override get bounds(): Bounds {
        const baseDiameter = this.calculateBaseDiameter();
        const labelDiameter = baseDiameter + (this.labels.length > 0 ? this.labels.length * 12 - 5 : 0);

        return {
            x: this.position.x,
            y: this.position.y,
            width: labelDiameter,
            height: labelDiameter,
        };
    }
}

@injectable()
export class FunctionNodeView implements IView {
    constructor(@constructorInject(DfdNodeLabelRenderer) private readonly labelRenderer: DfdNodeLabelRenderer) {}

    render(node: Readonly<FunctionNode>, context: RenderingContext): VNode {
        const baseRadius = node.calculateBaseDiameter() / 2;
        const fullRadius = node.bounds.width / 2;

        return (
            <g class-sprotty-node={true} class-function={true}>
                <circle r={fullRadius} cx={fullRadius} cy={fullRadius} />
                {context.renderChildren(node, {
                    xPosition: fullRadius,
                    yPosition: baseRadius + 4,
                } as DfdLabelArgs)}
                {this.labelRenderer.renderNodeLabels(node, baseRadius + 10)}
            </g>
        );
    }
}

export class IONode extends RectangularDFDNode {
    private calculateHeight(): number {
        const hasLabels = this.labels.length > 0;
        if (hasLabels) {
            return 36 + this.labels.length * 12;
        } else {
            return 40;
        }
    }

    override get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: Math.max(calculateTextWidth(this.editableLabel?.text) + 5, 40),
            height: this.calculateHeight(),
        };
    }
}

@injectable()
export class IONodeView implements IView {
    constructor(@constructorInject(DfdNodeLabelRenderer) private readonly labelRenderer: DfdNodeLabelRenderer) {}

    render(node: Readonly<RectangularDFDNode>, context: RenderingContext): VNode {
        const width = node.bounds.width;
        const height = node.bounds.height;

        return (
            <g class-sprotty-node={true} class-io={true}>
                <rect x="0" y="0" width={width} height={height} />
                {context.renderChildren(node, {
                    xPosition: width / 2,
                    yPosition: 25,
                } as DfdLabelArgs)}
                {this.labelRenderer.renderNodeLabels(node, 30)}
            </g>
        );
    }
}

interface DfdLabelArgs extends IViewArgs {
    xPosition: number;
    yPosition: number;
}

@injectable()
export class DfdLabelView extends ShapeView {
    private getPosition(label: Readonly<SLabel>, args?: DfdLabelArgs | IViewArgs): Point {
        if (args && "xPosition" in args && "yPosition" in args) {
            return { x: args.xPosition, y: args.yPosition };
        } else {
            const parentSize = (label.parent as SNode | undefined)?.bounds;
            const width = parentSize?.width ?? 0;
            const height = parentSize?.height ?? 0;
            return { x: width / 2, y: height / 2 + 5 };
        }
    }

    render(label: Readonly<SLabel>, _context: RenderingContext, args?: DfdLabelArgs): VNode | undefined {
        const position = this.getPosition(label, args);

        return (
            <text class-sprotty-label={true} x={position.x} y={position.y}>
                {label.text}
            </text>
        );
    }
}
