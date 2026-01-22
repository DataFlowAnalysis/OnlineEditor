import { ThreatModelingLabelType, ThreatModelingLabelTypeValue } from "../labels/ThreatModelingLabelType.ts";
import { AbstractUIExtension, IActionDispatcher, TYPES } from "sprotty";
import "./dialog.css";
import { inject } from "inversify";
import { marked } from "marked";
import { Action } from "sprotty-protocol";

export type ExcludesDialogData = {
    previousLabelAssignments: { labelType: ThreatModelingLabelType; labelTypeValue: ThreatModelingLabelTypeValue }[];
    newLabelAssignment: { labelType: ThreatModelingLabelType; labelTypeValue: ThreatModelingLabelTypeValue };
    confirmAction: Action
};

export class ExcludesDialog extends AbstractUIExtension {
    protected textContainer: HTMLDivElement = document.createElement("div");
    protected buttonContainer: HTMLDivElement = document.createElement("div");

    private state?: ExcludesDialogData;

    constructor(@inject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher) {
        super();
    }

    id(): string {
        return "excludes-collision-dialog";
    }

    containerClass(): string {
        return "dialog-container";
    }

    protected initializeContents(containerElement: HTMLElement): void {
        const dialog = document.createElement("div");
        dialog.classList.add("dialog");
        containerElement.appendChild(dialog);

        this.textContainer.classList.add("dialog-text");
        dialog.appendChild(this.textContainer);

        this.buttonContainer.classList.add("dialog-buttons");
        dialog.appendChild(this.buttonContainer);

        this.update();
    }

    public update(state?: ExcludesDialogData) {
        this.state = state;
        this.updateText();
        this.updateButtons();
    }

    private updateText(): void {
        if (!this.state) {
            this.textContainer.innerText = "Something went wrong: This dialog has no state.";
            return;
        }

        this.textContainer.innerHTML = marked.parse(
            "This element already has the labels " +
                this.state.previousLabelAssignments
                    .map((assignment) => `**${assignment.labelType.name}.${assignment.labelTypeValue.text}**`)
                    .join(", ") +
                " assigned to it.\n" +
                "The label " +
                `**${this.state.newLabelAssignment.labelType.name}.${this.state.newLabelAssignment.labelTypeValue.text}**` +
                " cannot be assigned at the same time, since they exclude each other.",
            { async: false },
        );
    }

    private updateButtons(): void {
        if (!this.state) {
            const closeButton = document.createElement("button");
            closeButton.classList.add("dialog-button");
            closeButton.innerText = "Close";
            closeButton.addEventListener("click", () => this.hide());
            this.buttonContainer.replaceChildren(closeButton);
            return;
        }

        const keepPreviousLabelButton = document.createElement("button");
        keepPreviousLabelButton.classList.add("dialog-button");
        keepPreviousLabelButton.innerText = `Keep previous labels`;
        keepPreviousLabelButton.addEventListener("click", () => this.hide());

        const overwriteWithNewLabelButton = document.createElement("button");
        overwriteWithNewLabelButton.classList.add("dialog-button");
        overwriteWithNewLabelButton.innerText =
            "Replace with " +
            `${this.state.newLabelAssignment.labelType.name}.${this.state.newLabelAssignment.labelTypeValue.text}`;

        const confirmAction = this.state.confirmAction
        overwriteWithNewLabelButton.addEventListener("click", () => {
            this.hide();
            this.actionDispatcher.dispatch(confirmAction)
        });

        this.buttonContainer.replaceChildren(keepPreviousLabelButton, overwriteWithNewLabelButton);
    }
}