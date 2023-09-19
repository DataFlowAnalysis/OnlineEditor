/** @jsx svg */
import {
    SNodeImpl,
    WithEditableLabel,
    isEditableLabel,
    svg,
    withEditLabelFeature,
    RenderingContext,
    ShapeView,
    IViewArgs,
    SChildElementImpl,
} from "sprotty";
import { SNode, SLabel, Bounds, SModelElement, SPort } from "sprotty-protocol";
import { inject, injectable } from "inversify";
import { VNode } from "snabbdom";
import { LabelAssignment } from "../labels/labelTypeRegistry";
import { DynamicChildrenNode } from "./dynamicChildren";
import { containsDfdLabelFeature } from "../labels/elementFeature";
import { calculateTextSize } from "../../utils";
import { DfdNodeLabelRenderer } from "../labels/labelRenderer";
import { DfdPositionalLabelArgs } from "./labels";

export interface DfdNode extends SNode {
    text: string;
    labels: LabelAssignment[];
    ports: SPort[];
}

export abstract class DfdNodeImpl extends DynamicChildrenNode implements WithEditableLabel {
    static readonly DEFAULT_FEATURES = [...SNodeImpl.DEFAULT_FEATURES, withEditLabelFeature, containsDfdLabelFeature];
    static readonly DEFAULT_WIDTH = 50;
    static readonly WIDTH_PADDING = 12;

    text: string = "";
    labels: LabelAssignment[] = [];
    ports: SPort[] = [];

    override setChildren(schema: DfdNode): void {
        const children: SModelElement[] = [
            {
                type: "label:positional",
                text: schema.text ?? "",
                id: schema.id + "-label",
            } as SLabel,
        ];

        schema.ports?.forEach((port) => {
            // Remove wrongly serialized features Set.
            // Refer to preprocessModelSchema in the load action for more information.
            if ("features" in port) {
                delete port.features;
            }

            children.push(port);
        });
        schema.children = children;
    }

    override removeChildren(schema: DfdNode): void {
        const label = schema.children?.find((element) => element.type === "label:positional") as SLabel | undefined;
        const ports = schema.children?.filter((element) => element.type.startsWith("port")) ?? [];

        schema.text = label?.text ?? "";
        schema.ports = ports as SPort[];
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
        const textWidth = calculateTextSize(this.editableLabel?.text).width;
        const labelWidths = this.labels.map(
            (labelAssignment) => DfdNodeLabelRenderer.computeLabelContent(labelAssignment)[1],
        );

        const neededWidth = Math.max(...labelWidths, textWidth, DfdNodeImpl.DEFAULT_WIDTH);
        return neededWidth + DfdNodeImpl.WIDTH_PADDING;
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
export class StorageNodeImpl extends DfdNodeImpl {
    protected override calculateHeight(): number {
        const hasLabels = this.labels.length > 0;
        if (hasLabels) {
            return (
                StorageNodeImpl.LABEL_START_HEIGHT +
                this.labels.length * DfdNodeLabelRenderer.LABEL_SPACING_HEIGHT +
                DfdNodeLabelRenderer.LABEL_SPACE_BETWEEN
            );
        } else {
            return StorageNodeImpl.TEXT_HEIGHT;
        }
    }

    protected override calculateWidth(): number {
        return super.calculateWidth() + StorageNodeImpl.LEFT_PADDING;
    }

    static readonly TEXT_HEIGHT = 32;
    static readonly LABEL_START_HEIGHT = 28;
    static readonly LEFT_PADDING = 10;
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
            <g class-sprotty-node={true} class-io={true}>
                <rect x="0" y="0" width={width} height={height} />
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

export class FunctionNodeImpl extends DfdNodeImpl {
    protected override calculateHeight(): number {
        const hasLabels = this.labels.length > 0;
        if (hasLabels) {
            return (
                // height for text
                FunctionNodeImpl.LABEL_START_HEIGHT +
                // height for the labels
                this.labels.length * DfdNodeLabelRenderer.LABEL_SPACING_HEIGHT +
                // Spacing between last label and the under edge of the node rectangle
                DfdNodeLabelRenderer.LABEL_SPACE_BETWEEN
            );
        } else {
            return FunctionNodeImpl.LABEL_START_HEIGHT + FunctionNodeImpl.SEPARATOR_NO_LABEL_PADDING;
        }
    }

    static readonly TEXT_HEIGHT = 28;
    static readonly SEPARATOR_NO_LABEL_PADDING = 4;
    static readonly SEPARATOR_LABEL_PADDING = 4;
    static readonly LABEL_START_HEIGHT = this.TEXT_HEIGHT + this.SEPARATOR_LABEL_PADDING;
    static readonly BORDER_RADIUS = 5;
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
            <g class-sprotty-node={true} class-function={true}>
                <rect x="0" y="0" width={width} height={height} rx={r} ry={r} />
                {context.renderChildren(node, {
                    xPosition: width / 2,
                    yPosition: FunctionNodeImpl.TEXT_HEIGHT / 2,
                } as DfdPositionalLabelArgs)}
                <line x1="0" y1={FunctionNodeImpl.TEXT_HEIGHT} x2={width} y2={FunctionNodeImpl.TEXT_HEIGHT} />
                {this.labelRenderer.renderNodeLabels(node, FunctionNodeImpl.LABEL_START_HEIGHT)}
            </g>
        );
    }
}

@injectable()
export class IONodeImpl extends DfdNodeImpl {
    protected override calculateHeight(): number {
        const hasLabels = this.labels.length > 0;
        if (hasLabels) {
            return (
                IONodeImpl.LABEL_START_HEIGHT +
                this.labels.length * DfdNodeLabelRenderer.LABEL_SPACING_HEIGHT +
                DfdNodeLabelRenderer.LABEL_SPACE_BETWEEN
            );
        } else {
            return IONodeImpl.TEXT_HEIGHT;
        }
    }

    static readonly TEXT_HEIGHT = 32;
    static readonly LABEL_START_HEIGHT = 28;
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
            <g class-sprotty-node={true} class-storage={true}>
                {/* This transparent rect exists only to make this element easily selectable.
                    Without this you would need click the text or exactly hit one of the lines.
                    With this rect you can click anywhere between the two lines to select it.
                    This is especially important when there is no text given or it is short. */}
                <rect x="0" y="0" width={width} height={height} class-select-rect={true} />

                <line x1="0" y1="0" x2={width} y2="0" />
                {context.renderChildren(node, {
                    xPosition: width / 2,
                    yPosition: IONodeImpl.TEXT_HEIGHT / 2,
                } as DfdPositionalLabelArgs)}
                {this.labelRenderer.renderNodeLabels(node, IONodeImpl.LABEL_START_HEIGHT)}
                <line x1="0" y1={height} x2={width} y2={height} />
            </g>
        );
    }
}

/**
 * A sprotty view that renders nothing. Can be used to make invisible elements
 * that only serve some utility function but should not render anything.
 */
@injectable()
export class EmptyView extends ShapeView {
    render(
        _model: Readonly<SChildElementImpl>,
        _context: RenderingContext,
        _args?: IViewArgs | undefined,
    ): VNode | undefined {
        return undefined;
    }
}
