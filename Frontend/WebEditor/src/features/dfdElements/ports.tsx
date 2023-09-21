/** @jsx svg */
import {
    svg,
    ShapeView,
    SPortImpl,
    RenderingContext,
    moveFeature,
    deletableFeature,
    withEditLabelFeature,
    WithEditableLabel,
    isEditableLabel,
} from "sprotty";
import { Bounds, SLabel, SPort } from "sprotty-protocol";
import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { DynamicChildrenPort } from "./dynamicChildren";
import { ArrowEdgeImpl } from "./edges";

const defaultPortFeatures = [...SPortImpl.DEFAULT_FEATURES, moveFeature, deletableFeature];
const portSize = 7;

export interface DfdInputPort extends SPort {}

@injectable()
export class DfdInputPortImpl extends SPortImpl {
    static readonly DEFAULT_FEATURES = defaultPortFeatures;

    override get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: portSize,
            height: portSize,
        };
    }

    getName(): string | undefined {
        const edgeNames: string[] = [];

        this.incomingEdges.forEach((edge) => {
            if (edge instanceof ArrowEdgeImpl) {
                console.log("labellol", edge);
                const name = edge.editableLabel?.text;
                if (name !== undefined) {
                    edgeNames.push(name);
                }
            } else {
                return undefined;
            }
        });

        if (edgeNames.length === 0) {
            return undefined;
        } else {
            return edgeNames.join("");
        }
    }
}

export class DfdInputPortView extends ShapeView {
    render(node: Readonly<SPortImpl>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const { width, height } = node.bounds;

        return (
            <g class-sprotty-port={true} class-selected={node.selected}>
                <rect x="0" y="0" width={width} height={height} />
                <text x={width / 2} y={height / 2} class-port-text={true}>
                    I
                </text>
                {context.renderChildren(node)}
            </g>
        );
    }
}

export interface DfdOutputPort extends SPort {
    behaviour: string;
}

@injectable()
export class DfdOutputPortImpl extends DynamicChildrenPort implements WithEditableLabel {
    static readonly DEFAULT_FEATURES = [...defaultPortFeatures, withEditLabelFeature];

    behaviour: string = "";

    setChildren(schema: DfdOutputPort): void {
        schema.children = [
            {
                id: schema.id + "-label",
                type: "label:invisible",
                text: schema.behaviour ?? "",
            } as SLabel,
        ];
    }

    removeChildren(schema: DfdOutputPort): void {
        const label = schema.children?.find((element) => element.type === "label:invisible") as SLabel | undefined;

        schema.behaviour = label?.text ?? "";
        schema.children = [];
    }

    override get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: portSize,
            height: portSize,
        };
    }

    get editableLabel() {
        const label = this.children.find((element) => element.type === "label:invisible");
        if (label && isEditableLabel(label)) {
            return label;
        }

        return undefined;
    }

    getAvailableInputs(): string[] {
        return this.parent.children
            .filter((child) => child instanceof DfdInputPortImpl)
            .map((child) => child as DfdInputPortImpl)
            .map((child) => child.getName())
            .filter((name) => name !== undefined) as string[];
    }
}

@injectable()
export class DfdOutputPortView extends ShapeView {
    render(node: Readonly<SPortImpl>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const { width, height } = node.bounds;

        return (
            <g class-sprotty-port={true} class-selected={node.selected}>
                <rect x="0" y="0" width={width} height={height} />
                <text x={width / 2} y={height / 2} class-port-text={true}>
                    O
                </text>
                {context.renderChildren(node)}
            </g>
        );
    }
}
