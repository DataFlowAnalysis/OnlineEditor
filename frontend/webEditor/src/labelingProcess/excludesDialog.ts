import { AbstractDialog } from "../uiDialog";
import { ThreatModelingLabelType, ThreatModelingLabelTypeValue } from "../labels/ThreatModelingLabelType.ts";

export class ExcludesDialog extends AbstractDialog {

    private contentContainer: HTMLDivElement

    constructor(
    ) {
        super();
        this.contentContainer = document.createElement("div");
    }

    id(): string {
        return "excludes-collision-dialog";
    }

    public setContent(
        previousLabelAssignments: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue}[],
        newLabelAssignment: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue},
    ) {
        this.contentContainer.innerText = "The labels "
            + previousLabelAssignments
                .map(assignment => `${assignment.labelType.name}.${assignment.labelTypeValue.text}`)
                .join(", ")
            + " and "
            + `${newLabelAssignment.labelType.name}.${newLabelAssignment.labelTypeValue.text}`
            + " cannot be assigned at the same time, since they exclude each other."
    }

    protected initializeText(): HTMLElement {
        return this.contentContainer
    }

    protected initializeButtons(): HTMLButtonElement[] {
        const keepPreviousLabelButton = document.createElement("button")
        keepPreviousLabelButton.innerText = `Keep previous labels`;
        keepPreviousLabelButton.classList.add("labeling-process-button")

        const overwriteWithNewLabelButton = document.createElement("button");
        overwriteWithNewLabelButton.innerText = `Replace with new label`;
        overwriteWithNewLabelButton.classList.add("labeling-process-button")

        return [keepPreviousLabelButton, overwriteWithNewLabelButton];
    }
}