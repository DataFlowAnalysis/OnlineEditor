/** @jsx svg */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IActionDispatcher, SNodeImpl, svg, TYPES } from "sprotty";
import { LabelAssignment, LabelType, LabelTypeValue } from "../../labels/LabelType";
import { inject, injectable } from "inversify";
import { LabelTypeRegistry } from "../../labels/LabelTypeRegistry";
import { calculateTextSize } from "../../utils/TextSize";
import { VNode } from "snabbdom";
import { ContainsDfdLabels } from "../../labels/feature";
import { RemoveLabelAssignmentAction } from "../../labels/assignmentCommand";

@injectable()
export class DfdNodeLabelRenderer {
    static readonly LABEL_HEIGHT = 10;
    static readonly LABEL_SPACE_BETWEEN = 2;
    static readonly LABEL_SPACING_HEIGHT = DfdNodeLabelRenderer.LABEL_HEIGHT + DfdNodeLabelRenderer.LABEL_SPACE_BETWEEN;
    static readonly LABEL_TEXT_PADDING = 8;

    constructor(
        @inject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher,
        @inject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
    ) {}

    private getLabel(label: LabelAssignment): {type: LabelType, value: LabelTypeValue} | undefined {
        const labelType = this.labelTypeRegistry.getLabelType(label.labelTypeId);
        const labelTypeValue = labelType?.values.find((value) => value.id === label.labelTypeValueId);
        if (!labelType || ! labelTypeValue) {
            return undefined
        }
        return {
            type: labelType,
            value: labelTypeValue
        }
    }

    /**
     * Gets the label type of the assignment and builds the text to display.
     * From this text the width of the label is calculated using the corresponding font size and padding.
     * @returns a tuple containing the text and the width of the label in pixel
     */
    computeLabelContent(labelAssignment: LabelAssignment): [string, number] {
        const label = this.getLabel(labelAssignment)
        if (!label) {
            return ["", 0];
        }

        const text = `${label.type.name}: ${label.value.text}`;
        const width = calculateTextSize(text, "5pt sans-serif").width + DfdNodeLabelRenderer.LABEL_TEXT_PADDING;

        return [text, width];
    }

    renderSingleNodeLabel(node: ContainsDfdLabels & SNodeImpl, label: LabelAssignment, x: number, y: number): VNode {
        const [text, width] = this.computeLabelContent(label);
        const xLeft = x - width / 2;
        const xRight = x + width / 2;
        const height = DfdNodeLabelRenderer.LABEL_HEIGHT;
        const radius = height / 2;

        const deleteLabelHandler = () => {
            this.actionDispatcher.dispatch(RemoveLabelAssignmentAction.create(label, node));
        };

        return (
            <g class-node-label={true}>
                <rect x={xLeft} y={y} width={width} height={height} rx={radius} ry={radius} />
                <text x={x} y={y + height / 2}>
                    {text}
                </text>
                {
                    // Put a x button to delete the element on the right upper edge
                    node.hoverFeedback ? (
                        <g class-label-delete={true} on={{ click: deleteLabelHandler }}>
                            <circle cx={xRight} cy={y} r={radius * 0.8}></circle>
                            <text x={xRight} y={y}>
                                X
                            </text>
                        </g>
                    ) : undefined
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
            const labelTypeA = this.getLabel(a)
            const labelTypeB = this.getLabel(b)
            if (!labelTypeA || !labelTypeB) {
                return 0;
            }

            if (labelTypeA.type.name < labelTypeB.type.name) {
                return -1;
            } else if (labelTypeA.type.name > labelTypeB.type.name) {
                return 1;
            } else {
                return labelTypeA.value.text.localeCompare(labelTypeB.value.text);
            }
        });
    }

    renderNodeLabels(
        node: ContainsDfdLabels & SNodeImpl,
        baseY: number,
        xOffset = 0,
        labelSpacing = DfdNodeLabelRenderer.LABEL_SPACING_HEIGHT,
    ): VNode | undefined {
        this.sortLabels(node.labels);
        return (
            <g>
                {node.labels.map((label, i) => {
                    const x = node.bounds.width / 2;
                    const y = baseY + i * labelSpacing;
                    return this.renderSingleNodeLabel(node, label, x + xOffset, y);
                })}
            </g>
        );
    }
}

