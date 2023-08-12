/** @jsx svg */
import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { Hoverable, IActionDispatcher, SShapeElement, TYPES, svg } from "sprotty";
import { calculateTextWidth, constructorInject } from "../../utils";
import { LabelAssignment, LabelTypeRegistry, globalLabelTypeRegistry } from "./labelTypeRegistry";
import { DeleteLabelAssignmentAction } from "./commands";
import { ContainsDfdLabels } from "./elementFeature";

@injectable()
export class DfdNodeLabelRenderer {
    constructor(
        @constructorInject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @constructorInject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher,
    ) {}

    /**
     * Gets the label type of the assignment and builds the text to display.
     * From this text the width of the label is calculated using the corresponding font size and padding.
     * @returns a tuple containing the text and the width of the label in pixel
     */
    static computeLabelContent(label: LabelAssignment): [string, number] {
        const labelType = globalLabelTypeRegistry.getLabelType(label.labelTypeId);
        const labelTypeValue = labelType?.values.find((value) => value.id === label.labelTypeValueId);
        if (!labelType || !labelTypeValue) {
            return ["", 0];
        }

        const text = `${labelType.name}: ${labelTypeValue.text}`;
        const width = calculateTextWidth(text, "5pt sans-serif") + 8;

        return [text, width];
    }

    renderSingleNodeLabel(
        node: ContainsDfdLabels & SShapeElement & Hoverable,
        label: LabelAssignment,
        x: number,
        y: number,
    ): VNode {
        const [text, width] = DfdNodeLabelRenderer.computeLabelContent(label);
        const xLeft = x - width / 2;
        const xRight = x + width / 2;
        const height = 10;
        const radius = height / 2;

        const deleteLabelHandler = () => {
            const action = DeleteLabelAssignmentAction.create(node, label);
            this.actionDispatcher.dispatch(action);
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

    /**
     * Sorts the labels alphabetically by label type name (primary) and label type value text (secondary).
     *
     * @param labels the labels to sort. The operation is performed in-place.
     */
    private sortLabels(labels: LabelAssignment[]): void {
        labels.sort((a, b) => {
            const labelTypeA = this.labelTypeRegistry.getLabelType(a.labelTypeId);
            const labelTypeB = this.labelTypeRegistry.getLabelType(b.labelTypeId);
            if (!labelTypeA || !labelTypeB) {
                return 0;
            }

            if (labelTypeA.name < labelTypeB.name) {
                return -1;
            } else if (labelTypeA.name > labelTypeB.name) {
                return 1;
            } else {
                const labelTypeValueA = labelTypeA.values.find((value) => value.id === a.labelTypeValueId);
                const labelTypeValueB = labelTypeB.values.find((value) => value.id === b.labelTypeValueId);
                if (!labelTypeValueA || !labelTypeValueB) {
                    return 0;
                }

                return labelTypeValueA.text.localeCompare(labelTypeValueB.text);
            }
        });
    }

    renderNodeLabels(node: ContainsDfdLabels & SShapeElement & Hoverable, baseY: number, labelSpacing = 12): VNode {
        this.sortLabels(node.labels);
        return (
            <g>
                {node.labels.map((label, i) => {
                    const x = node.bounds.width / 2;
                    const y = baseY + i * labelSpacing;
                    return this.renderSingleNodeLabel(node, label, x, y);
                })}
            </g>
        );
    }
}
