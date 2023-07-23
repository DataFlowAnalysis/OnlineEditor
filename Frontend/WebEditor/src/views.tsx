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
    TYPES,
    IActionDispatcher,
    SShapeElement,
    Hoverable,
} from "sprotty";
import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { DynamicChildrenEdge, DynamicChildrenNode } from "./dynamicChildren";
import { calculateTextWidth, constructorInject } from "./utils";
import { ContainsDfdLabels, LabelAssignment, LabelTypeRegistry, containsDfdLabelFeature } from "./labelTypes";
import { DeleteLabelAssignmentAction } from "./commands/labelTypes";

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

function renderNodeLabel(
    node: ContainsDfdLabels & SShapeElement & Hoverable,
    actionDispatcher: IActionDispatcher,
    labelTypeRegistry: LabelTypeRegistry,
    label: LabelAssignment,
    x: number,
    y: number,
): VNode {
    const labelType = labelTypeRegistry.getLabelType(label.labelTypeId);
    const labelTypeValue = labelType?.values.find((value) => value.id === label.labelTypeValueId);
    if (!labelType || !labelTypeValue) {
        return <g />;
    }

    const text = `${labelType.name}: ${labelTypeValue.text}`;
    const width = calculateTextWidth(text, "5pt sans-serif") + 8;
    const xLeft = x - width / 2;
    const xRight = x + width / 2;
    const height = 10;
    const radius = height / 2;

    const deleteLabelHandler = () => {
        const action = DeleteLabelAssignmentAction.create(node, label);
        actionDispatcher.dispatch(action);
    };

    return (
        <g class-node-label={true}>
            <rect x={xLeft} y={y} width={width} height={height} rx={radius} ry={radius} />
            <text x={node.bounds.width / 2} y={y + 7.25}>
                {text}
            </text>
            {
                // Put a x button to delete the element on the right upper edge
                node.hoverFeedback ? (
                    <g class-label-delete={true} on={{ click: deleteLabelHandler }}>
                        <circle cx={xRight} cy={y} r={radius * 0.8}></circle>
                        <text x={xRight} y={y + 2}>
                            x
                        </text>
                    </g>
                ) : (
                    <g />
                )
            }
        </g>
    );
}

function renderNodeLabels(
    node: ContainsDfdLabels & SShapeElement & Hoverable,
    actionDispatcher: IActionDispatcher,
    labelTypeRegistry: LabelTypeRegistry,
    baseY: number,
    labelSpacing = 12,
): VNode {
    return (
        <g>
            {node.labels.map((label, i) => {
                const x = node.bounds.width / 2;
                const y = baseY + i * labelSpacing;
                return renderNodeLabel(node, actionDispatcher, labelTypeRegistry, label, x, y);
            })}
        </g>
    );
}

@injectable()
export class StorageNodeView implements IView {
    constructor(
        @constructorInject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @constructorInject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher,
    ) {}

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
                } as DFDLabelArgs)}
                {renderNodeLabels(node, this.actionDispatcher, this.labelTypeRegistry, 25)}
                <line x1="0" y1={height} x2={width} y2={height} />
            </g>
        );
    }
}

export class FunctionNode extends RectangularDFDNode {
    override get anchorKind() {
        return ELLIPTIC_ANCHOR_KIND;
    }

    override get bounds(): Bounds {
        const diameter = calculateTextWidth(this.editableLabel?.text) + 5;
        // Clamp diameter to be between 30 and 60
        const clampedDiameter = Math.min(Math.max(diameter, 30), 60);

        return {
            x: this.position.x,
            y: this.position.y,
            width: clampedDiameter,
            height: clampedDiameter,
        };
    }
}

@injectable()
export class FunctionNodeView implements IView {
    render(node: Readonly<FunctionNode>, context: RenderingContext): VNode {
        const radius = Math.min(node.bounds.width, node.bounds.height) / 2;
        return (
            <g class-sprotty-node={true} class-function={true}>
                <circle r={radius} cx={radius} cy={radius} />
                {context.renderChildren(node)}
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
    constructor(
        @constructorInject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @constructorInject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher,
    ) {}

    render(node: Readonly<RectangularDFDNode>, context: RenderingContext): VNode {
        const width = node.bounds.width;
        const height = node.bounds.height;

        return (
            <g class-sprotty-node={true} class-io={true}>
                <rect x="0" y="0" width={width} height={height} />
                {context.renderChildren(node, {
                    xPosition: width / 2,
                    yPosition: 25,
                } as DFDLabelArgs)}
                {renderNodeLabels(node, this.actionDispatcher, this.labelTypeRegistry, 30)}
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

interface DFDLabelArgs extends IViewArgs {
    xPosition: number;
    yPosition: number;
}

@injectable()
export class DFDLabelView extends ShapeView {
    private getPosition(label: Readonly<SLabel>, args?: DFDLabelArgs | IViewArgs): Point {
        if (args && "xPosition" in args && "yPosition" in args) {
            return { x: args.xPosition, y: args.yPosition };
        } else {
            const parentSize = (label.parent as SNode | undefined)?.bounds;
            const width = parentSize?.width ?? 0;
            const height = parentSize?.height ?? 0;
            return { x: width / 2, y: height / 2 + 5 };
        }
    }

    render(label: Readonly<SLabel>, _context: RenderingContext, args?: DFDLabelArgs): VNode | undefined {
        const position = this.getPosition(label, args);

        return (
            <text class-sprotty-label={true} x={position.x} y={position.y}>
                {label.text}
            </text>
        );
    }
}
