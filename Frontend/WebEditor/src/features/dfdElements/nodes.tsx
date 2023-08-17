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
                type: "label:positional",
                text: schema.text ?? "",
                id: schema.id + "-label",
            } as SLabelSchema,
        ];
    }

    override removeChildren(schema: DFDNodeSchema): void {
        const label = schema.children?.find((element) => element.type === "label:positional") as
            | SLabelSchema
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

    private calculateWidth(): number {
        const textWidth = calculateTextWidth(this.editableLabel?.text);
        const labelWidths = this.labels.map(
            (labelAssignment) => DfdNodeLabelRenderer.computeLabelContent(labelAssignment)[1],
        );

        return Math.max(...labelWidths, textWidth, 50);
    }

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
                } as DfdPositionalLabelArgs)}
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

    /**
     * Calculates the diameter needed to fit just the text inside the node.
     * The diameter is clamped between 30 and 60 to make sure the node is not too small or too big.
     * This clamping especially important for when no or little labels are set because having a big function circle
     * for a long text would look bad.
     */
    calculateBaseDiameter(): number {
        const baseDiameter = calculateTextWidth(this.editableLabel?.text) + 5;

        // Clamp diameter to be between 30 and 60
        const clampedBaseDiameter = Math.min(Math.max(baseDiameter, 30), 60);
        return clampedBaseDiameter;
    }

    /**
     * Calculates the diameter needed to fit the text and all labels inside the node.
     * Includes the vertical space needed for the tables as well as the width required for the label texts
     * in the calculation.
     */
    private calculateDiameterWithLabels(): number {
        const baseDiameter = this.calculateBaseDiameter();
        const heightWithLabels = baseDiameter + (this.labels.length > 0 ? this.labels.length * 12 - 5 : 0);
        const labelWidths = this.labels.map(
            (labelAssignment) => DfdNodeLabelRenderer.computeLabelContent(labelAssignment)[1],
        );
        const finalDiameter = Math.max(...labelWidths, heightWithLabels);
        return finalDiameter;
    }

    override get bounds(): Bounds {
        const d = this.calculateDiameterWithLabels();

        return {
            x: this.position.x,
            y: this.position.y,
            width: d,
            height: d,
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
                } as DfdPositionalLabelArgs)}
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

    private calculateWidth(): number {
        const widthPadding = 5;
        const textWidth = calculateTextWidth(this.editableLabel?.text) + widthPadding;
        const labelWidths = this.labels.map(
            (labelAssignment) => DfdNodeLabelRenderer.computeLabelContent(labelAssignment)[1] + widthPadding,
        );

        return Math.max(...labelWidths, textWidth, 60);
    }

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
                } as DfdPositionalLabelArgs)}
                {this.labelRenderer.renderNodeLabels(node, 30)}
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
    private getPosition(label: Readonly<SLabel>, args?: DfdPositionalLabelArgs | IViewArgs): Point {
        if (args && "xPosition" in args && "yPosition" in args) {
            return { x: args.xPosition, y: args.yPosition };
        } else {
            const parentSize = (label.parent as SNode | undefined)?.bounds;
            const width = parentSize?.width ?? 0;
            const height = parentSize?.height ?? 0;
            return { x: width / 2, y: height / 2 + 5 };
        }
    }

    render(label: Readonly<SLabel>, _context: RenderingContext, args?: DfdPositionalLabelArgs): VNode | undefined {
        const position = this.getPosition(label, args);

        return (
            <text class-sprotty-label={true} x={position.x} y={position.y}>
                {label.text}
            </text>
        );
    }
}
