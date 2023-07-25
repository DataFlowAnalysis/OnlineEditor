/** @jsx svg */
import {
    Point,
    SLabel as SLabelSchema,
    SNode as SNodeSchema,
    angleOfPoint,
    toDegrees,
    SEdge as SEdgeSchema,
    Bounds,
} from "sprotty-protocol";
import {
    svg,
    IView,
    SNode,
    RenderingContext,
    PolylineEdgeViewWithGapsOnIntersections,
    SEdge,
    ELLIPTIC_ANCHOR_KIND,
    IViewArgs,
    WithEditableLabel,
    isEditableLabel,
    withEditLabelFeature,
    ShapeView,
    SLabel,
    hoverFeedbackFeature,
} from "sprotty";
import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { DynamicChildrenEdge, DynamicChildrenNode } from "./dynamicChildren";
import { calculateTextWidth, constructorInject } from "./utils";
import { DfdNodeLabelRenderer, LabelAssignment, containsDfdLabelFeature } from "./labelTypes";

import "./views.css";

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

export interface ArrowEdgeSchema extends SEdgeSchema {
    text: string;
}

export class ArrowEdge extends DynamicChildrenEdge implements WithEditableLabel {
    setChildren(schema: ArrowEdgeSchema): void {
        schema.children = [
            {
                type: "label",
                text: schema.text,
                id: schema.id + "-label",
                edgePlacement: {
                    position: 0.5,
                    side: "on",
                    rotate: false,
                },
            } as SLabelSchema,
        ];
    }

    removeChildren(schema: ArrowEdgeSchema): void {
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
export class ArrowEdgeView extends PolylineEdgeViewWithGapsOnIntersections {
    /**
     * Renders an arrow at the end of the edge.
     */
    protected override renderAdditionals(edge: SEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        const arrow = (
            <path
                class-sprotty-edge={true}
                class-arrow={true}
                d="M 0.5,0 L 10,-4 L 10,4 Z"
                transform={`rotate(${toDegrees(angleOfPoint({ x: p1.x - p2.x, y: p1.y - p2.y }))} ${p2.x} ${
                    p2.y
                }) translate(${p2.x} ${p2.y})`}
            />
        );
        additionals.push(arrow);
        return additionals;
    }

    /**
     * Renders the edge line.
     * In contrast to the default implementation that we override here,
     * this implementation makes the edge line 10px shorter at the end to make space for the arrow without any overlap.
     */
    protected renderLine(_edge: SEdge, segments: Point[], _context: RenderingContext, _args?: IViewArgs): VNode {
        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            if (i === segments.length - 1) {
                // Make edge line 10px shorter to make space for the arrow
                const prevP = segments[i - 1];
                const dx = p.x - prevP.x;
                const dy = p.y - prevP.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const ratio = (length - 10) / length;
                path += ` L ${prevP.x + dx * ratio},${prevP.y + dy * ratio}`;
            } else {
                // Lines between points in between are not shortened
                path += ` L ${p.x},${p.y}`;
            }
        }
        return <path d={path} />;
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
