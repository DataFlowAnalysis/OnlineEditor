import { Bounds, SNode, SPort } from "sprotty-protocol";
import { DfdNodeAnnotation } from "../../annotation/DFDNodeAnnotation";
import { LabelAssignment } from "../../labels/LabelType";
import { isEditableLabel, SNodeImpl, WithEditableLabel, withEditLabelFeature } from "sprotty";
import { calculateTextSize } from "../../utils/TextSize";
import { ArrowEdgeImpl } from "../edges/ArrowEdge";
import { VNodeStyle } from "snabbdom";
import { DfdInputPortImpl } from "../ports/DfdInputPort";
import { inject } from "inversify";
import { DfdNodeLabelRenderer } from "./DfdNodeLabels";
import { containsDfdLabelFeature } from "../../labels/feature";

export interface DfdNode extends SNode {
    text: string;
    labels: LabelAssignment[];
    ports: SPort[];
    annotations?: DfdNodeAnnotation[];
}

export abstract class DfdNodeImpl extends SNodeImpl implements WithEditableLabel {
    static readonly DEFAULT_FEATURES = [...SNodeImpl.DEFAULT_FEATURES, withEditLabelFeature, containsDfdLabelFeature];
    static readonly DEFAULT_WIDTH = 50;
    static readonly WIDTH_PADDING = 12;
    static readonly NODE_COLOR = "var(--color-primary)";
    static readonly HIGHLIGHTED_COLOR = "var(--color-highlighted)";
    @inject(DfdNodeLabelRenderer) private readonly dfdNodeLabelRenderer?: DfdNodeLabelRenderer;
    text: string = "";
    color?: string;
    labels: LabelAssignment[] = [];
    ports: SPort[] = [];
    hideLabels: boolean = false;
    minimumWidth: number = DfdNodeImpl.DEFAULT_WIDTH;
    annotations: DfdNodeAnnotation[] = [];

    constructor() {
        super();
    }

    get editableLabel() {
        const label = this.children.find((element) => element.type === "label:positional");
        if (label && isEditableLabel(label)) {
            return label;
        }

        return undefined;
    }

    protected calculateWidth(): number {
        if (this.hideLabels) {
            return this.minimumWidth + DfdNodeImpl.WIDTH_PADDING;
        }
        const textWidth = calculateTextSize(this.text).width;
        const labelWidths = this.labels.map(
            (labelAssignment) => this.dfdNodeLabelRenderer?.computeLabelContent(labelAssignment)[1] ?? 0,
        );

        const neededWidth = Math.max(...labelWidths, textWidth, DfdNodeImpl.DEFAULT_WIDTH);
        return neededWidth + DfdNodeImpl.WIDTH_PADDING;
    }

    protected calculateHeight(): number {
        const hasLabels = this.labels.length > 0;
        if (hasLabels && !this.hideLabels) {
            return (
                this.labelStartHeight() +
                this.labels.length * DfdNodeLabelRenderer.LABEL_SPACING_HEIGHT +
                DfdNodeLabelRenderer.LABEL_SPACE_BETWEEN
            );
        } else {
            return this.noLabelHeight();
        }
    }

    protected abstract noLabelHeight(): number;
    protected abstract labelStartHeight(): number;

    override get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.calculateWidth(),
            height: this.calculateHeight(),
        };
    }

    /**
     * Gets the names of all available input ports.
     * @returns a list of the names of all available input ports.
     *          Can include undefined if a port has no named edges connected to it.
     */
    getAvailableInputs(): (string | undefined)[] {
        return this.children
            .filter((child) => child instanceof DfdInputPortImpl)
            .map((child) => child as DfdInputPortImpl)
            .map((child) => child.getName());
    }

    /**
     * Gets the text of all dfd edges that are connected to the input ports of this node.
     * Applies the passed filter to the edges.
     * If a edge has no label, the empty string is returned.
     */
    getEdgeTexts(edgePredicate: (e: ArrowEdgeImpl) => boolean): string[] {
        const inputPorts = this.children
            .filter((child) => child instanceof DfdInputPortImpl)
            .map((child) => child as DfdInputPortImpl);

        return inputPorts
            .flatMap((port) => port.incomingEdges)
            .filter((edge) => edge instanceof ArrowEdgeImpl)
            .map((edge) => edge as ArrowEdgeImpl)
            .filter(edgePredicate)
            .map((edge) => edge.editableLabel?.text ?? "");
    }

    /**
     * Generates the per-node inline style object for the view.
     * Contains the opacity and the color of the node that may be set by the annotation (if any).
     */
    geViewStyleObject(): VNodeStyle {
        const style: VNodeStyle = {
            opacity: this.opacity.toString(),
        };

        style["--border"] = "#FFFFFF";

        if (this.color) style["--color"] = this.color;

        return style;
    }

    public setColor(color: string, override: boolean = true) {
        if (override || this.color === DfdNodeImpl.NODE_COLOR) this.color = color;
    }
}
