/** @jsx svg */
import { injectable } from "inversify";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { svg, SRoutableElementImpl, ShapeView, SPortImpl, RenderingContext } from "sprotty";
import { SPort } from "sprotty-protocol";
import { ArrowEdgeImpl } from "../edges/ArrowEdge";
import { DfdPortImpl } from "./common";
import { VNode } from "snabbdom";

export type DfdInputPort = SPort;

@injectable()
export class DfdInputPortImpl extends DfdPortImpl {
    /**
     * Builds the name of the input port from the names of the incoming dfd edges.
     * @returns either the concatenated names of the incoming edges or undefined if there are no named incoming edges.
     */
    getName(): string | undefined {
        const edgeNames: string[] = [];

        this.incomingEdges.forEach((edge) => {
            if (edge instanceof ArrowEdgeImpl) {
                const name = edge.editableLabel?.text;
                if (name) {
                    edgeNames.push(name);
                }
            } else {
                return undefined;
            }
        });

        if (edgeNames.length === 0) {
            return undefined;
        } else {
            return edgeNames.sort().join("|");
        }
    }

    canConnect(_routable: SRoutableElementImpl, role: "source" | "target"): boolean {
        // Only allow edges into this port
        return role === "target";
    }
}

export class DfdInputPortView extends ShapeView {
    render(node: Readonly<SPortImpl>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const { width, height } = node.bounds;

        return (
            <g class-sprotty-port={true} class-selected={node.selected} style={{ opacity: node.opacity.toString() }}>
                <rect x="0" y="0" width={width} height={height} />
                <text x={width / 2} y={height / 2} class-port-text={true}>
                    I
                </text>
                {context.renderChildren(node)}
            </g>
        );
    }
}
