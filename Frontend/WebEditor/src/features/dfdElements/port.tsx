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

export interface DfdPort extends SPort {
    behaviour: string;
}

@injectable()
export class DfdPortImpl extends DynamicChildrenPort implements WithEditableLabel {
    static readonly DEFAULT_FEATURES = [...super.DEFAULT_FEATURES, moveFeature, deletableFeature, withEditLabelFeature];

    behaviour: string = "";

    setChildren(schema: DfdPort): void {
        schema.children = [
            {
                id: schema.id + "-label",
                type: "label:invisible",
                text: schema.behaviour ?? "",
            } as SLabel,
        ];
    }

    removeChildren(schema: DfdPort): void {
        const label = schema.children?.find((element) => element.type === "label:invisible") as SLabel | undefined;

        schema.behaviour = label?.text ?? "";
        schema.children = [];
    }

    override get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: 6,
            height: 6,
        };
    }

    get editableLabel() {
        const label = this.children.find((element) => element.type === "label:invisible");
        if (label && isEditableLabel(label)) {
            return label;
        }

        return undefined;
    }
}

@injectable()
export class DfdPortView extends ShapeView {
    render(node: Readonly<SPortImpl>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const width = Math.max(node.bounds.width, 0);
        const height = Math.max(node.bounds.height, 0);

        return (
            <g class-sprotty-port={true} class-selected={node.selected}>
                <rect x="0" y="0" width={width} height={height} />
                {context.renderChildren(node)}
            </g>
        );
    }
}
