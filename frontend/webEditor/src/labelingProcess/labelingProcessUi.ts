import {
    AbstractUIExtension,
    IActionDispatcher,
    TYPES,
} from "sprotty";
import { inject, injectable } from "inversify";
import './labelingProcessUI.css'
import { LabelAssignment } from "../labels/LabelType.ts";
import { NextLabelingProcessAction } from "./labelingProcessCommand.ts";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry.ts";
import { AnalyzeAction } from "../serialize/analyze.ts";
import { SelectConstraintsAction } from "../constraint/selection.ts";
import { ConstraintRegistry } from "../constraint/constraintRegistry.ts";
import { SaveThreatsTableAction } from "../serialize/saveThreatsTable.ts";
import { isThreatModelingLabelType } from "../labels/ThreatModelingLabelType.ts";

export type LabelingProcessState
    = { state: 'pending' }
    | { state: 'inProgress', finishedLabels: LabelAssignment[], activeLabel: LabelAssignment }
    | { state: 'done' }

@injectable()
export class LabelingProcessUi extends AbstractUIExtension {
    static readonly ID = "labeling-process-ui";

    private state: LabelingProcessState;

    constructor(
        @inject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher,
        @inject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @inject(ConstraintRegistry) private readonly constraintRegistry: ConstraintRegistry,
    ) {
        super();
        this.state = { state: 'pending' }
    }


    id(): string {
        return LabelingProcessUi.ID;
    }

    containerClass(): string {
        return "labeling-process-container"
    }

    protected initializeContents(): void {
        this.updateContents();
    }

    private updateContents(): void {
        switch (this.state.state) {
            case "pending": return this.showPendingContents();
            case "inProgress": return this.showInProgressContents();
            case "done": return this.showDoneContents();
        }
    }

    private showPendingContents(): void {
        this.containerElement.classList.remove("ui-float")
    }

    private showInProgressContents(): void {
        this.containerElement.classList.add("ui-float");
        if (this.state.state !== 'inProgress') return;

        const text = document.createElement('span')
        const { labelType, labelTypeValue } = this.labelTypeRegistry.resolveLabelAssignment(this.state.activeLabel)
        if (!labelType || !labelTypeValue) {
            text.innerText = `Couldn't resolve the LabelType or LabelTypeValue`
        } else {
            let targetElement = ""
            if (isThreatModelingLabelType(labelType)) {
                targetElement = labelType.intendedFor === "Vertex" ? "node" : "output pin"
            } else {
                targetElement = "node or output pin"
            }

            text.innerText = `Right click to assign ${labelType.name}.${labelTypeValue.text} to a ${targetElement}`
        }

        const nextStepButton = document.createElement('button')
        nextStepButton.innerText = "Next label"
        nextStepButton.classList.add("labeling-process-button")
        nextStepButton.addEventListener('click', () => {
            if (this.state.state !== 'inProgress') return;
            this.actionDispatcher.dispatch(NextLabelingProcessAction.create(
                this.labelTypeRegistry,
                [...this.state.finishedLabels, this.state.activeLabel]
            ))
        })

        this.containerElement.replaceChildren(text, nextStepButton)
    }

    private showDoneContents(): void {
        this.containerElement.classList.add("ui-float");
        if (this.state.state !== 'done') return;

        const text = document.createElement('span')
        text.innerText = 'You have completed this process.'

        const finalStepsButton = document.createElement('button')
        finalStepsButton.innerText = "Check constraints and download threats"
        finalStepsButton.classList.add("labeling-process-button")
        finalStepsButton.addEventListener('click', () => {
            this.actionDispatcher.dispatchAll([
                AnalyzeAction.create(),
                SelectConstraintsAction.create(this.constraintRegistry.getConstraintList().map((c) => c.name)),
            ]).then(() =>
                this.actionDispatcher.dispatch(SaveThreatsTableAction.create())
            )
        })

        this.containerElement.replaceChildren(text, finalStepsButton)
    }

    public getState(): LabelingProcessState {
        return this.state;
    }

    public setState(state: LabelingProcessState) {
        this.state = state;
        this.updateContents();
    }
}