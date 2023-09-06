/** @jsx svg */
import { svg, ShapeView, SPortImpl, RenderingContext, moveFeature, deletableFeature } from "sprotty";
import { SPort } from "sprotty-protocol";
import { injectable } from "inversify";
import { VNode } from "snabbdom";

export interface DfdPort extends SPort {
    behaviour: string;
}

@injectable()
export class DfdPortImpl extends SPortImpl {
    static readonly DEFAULT_FEATURES = [...super.DEFAULT_FEATURES, moveFeature, deletableFeature];

    behaviour: string = "";
}

@injectable()
export class DfdPortView extends ShapeView {
    render(node: Readonly<SPortImpl>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const width = Math.max(node.size.width, 0);
        const height = Math.max(node.size.height, 0);

        return (
            <g class-sprotty-port={true} class-selected={node.selected}>
                <rect x="0" y="0" width={width} height={height} />
                {context.renderChildren(node)}
            </g>
        );
    }
}
