/** @jsx svg */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IViewArgs, SLabelImpl, SNodeImpl, ShapeView, RenderingContext, svg } from "sprotty";
import { VNode } from "snabbdom";
import { injectable } from "inversify";
import { Point } from "sprotty-protocol";

export interface DfdPositionalLabelArgs extends IViewArgs {
    xPosition: number;
    yPosition: number;
}

@injectable()
export class DfdPositionalLabelView extends ShapeView {
    private getPosition(label: Readonly<SLabelImpl>, args?: DfdPositionalLabelArgs | IViewArgs): Point {
        if (args && "xPosition" in args && "yPosition" in args) {
            return { x: args.xPosition, y: args.yPosition };
        } else {
            const parentSize = (label.parent as SNodeImpl | undefined)?.bounds;
            const width = parentSize?.width ?? 0;
            const height = parentSize?.height ?? 0;
            return { x: width / 2, y: height / 2 };
        }
    }

    render(label: Readonly<SLabelImpl>, _context: RenderingContext, args?: DfdPositionalLabelArgs): VNode | undefined {
        const position = this.getPosition(label, args);

        return (
            <text class-sprotty-label={true} x={position.x} y={position.y}>
                {label.text}
            </text>
        );
    }
}