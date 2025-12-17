/** @jsx svg */
import { injectable } from "inversify";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { svg, ShapeView, SLabelImpl, RenderingContext } from "sprotty";
import { calculateTextSize } from "../../utils/TextSize";
import { VNode } from "snabbdom";

/**
 * A sprotty label view that renders the label text with a filled background behind it.
 * This is used to make the element behind the label invisible.
 */
@injectable()
export class FilledBackgroundLabelView extends ShapeView {
    static readonly PADDING = 5;

    render(label: Readonly<SLabelImpl>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(label, context)) {
            return undefined;
        }

        const size = calculateTextSize(label.text);
        const width = size.width + FilledBackgroundLabelView.PADDING;
        const height = size.height + FilledBackgroundLabelView.PADDING;

        return (
            <g class-label-background={true}>
                {label.text ? <rect x={-width / 2} y={-height / 2} width={width} height={height} /> : undefined}
                <text class-sprotty-label={true}>{label.text}</text>
            </g>
        );
    }
}
