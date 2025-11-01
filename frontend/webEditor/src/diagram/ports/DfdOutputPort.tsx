/** @jsx svg */
import { injectable } from "inversify";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { svg, isEditableLabel, SRoutableElementImpl, ShapeView, RenderingContext } from "sprotty";
import { SPort } from "sprotty-protocol";
import { DfdPortImpl } from "./common";
import { VNode, VNodeStyle } from "snabbdom";

export interface DfdOutputPort extends SPort {
    behavior: string;
}

@injectable()
export class DfdOutputPortImpl extends DfdPortImpl {
    private behavior: string = "";
    private validBehavior: boolean = true;


    get editableLabel() {
        const label = this.children.find((element) => element.type === "label:invisible");
        if (label && isEditableLabel(label)) {
            return label;
        }

        return undefined;
    }

    canConnect(_routable: SRoutableElementImpl, role: "source" | "target"): boolean {
        // Only allow edges from this port outwards
        return role === "source";
    }

    /**
     * Generates the per-node inline style object for the view.
     */
    geViewStyleObject(): VNodeStyle {
        const style: VNodeStyle = {
            opacity: this.opacity.toString(),
        };
        // TODO
        // if (!labelTypeRegistry) return style;

        if (!this.validBehavior) {
            style["--port-border"] = "#ff0000";
            style["--port-color"] = "#ff6961";
        }

        return style;
    }

    public setBehavior(value: string) {
        this.behavior = value;
        if (value === "") {
            this.validBehavior = true;
            return;
        }
        // TODO
        const errors = []/*new AutoCompleteTree(TreeBuilder.buildTree(labelTypeRegistry, this)).verify(
            this.behavior.split("\n"),
        );*/
        this.validBehavior = errors.length === 0;
    }

    public getBehavior() {
        return this.behavior;
    }
}

@injectable()
export class DfdOutputPortView extends ShapeView {
    render(node: Readonly<DfdOutputPortImpl>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const { width, height } = node.bounds;

        return (
            <g class-sprotty-port={true} class-selected={node.selected} style={node.geViewStyleObject()}>
                <rect x="0" y="0" width={width} height={height} />
                <text x={width / 2} y={height / 2} class-port-text={true}>
                    O
                </text>
                {context.renderChildren(node)}
            </g>
        );
    }
}
