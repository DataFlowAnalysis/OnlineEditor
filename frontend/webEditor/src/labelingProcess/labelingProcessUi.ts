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
import { isThreatModelingLabelType, isThreatModelingLabelTypeValue } from "../labels/ThreatModelingLabelType.ts";
import { marked } from "marked";
import { SaveJsonFileAction } from "../serialize/saveJsonFile.ts";

export type LabelingProcessState
    = { state: 'pending' }
    | { state: 'inProgress', finishedLabels: LabelAssignment[], activeLabel: LabelAssignment }
    | { state: 'done' }

@injectable()
export class LabelingProcessUi extends AbstractUIExtension {
    static readonly ID = "labeling-process-ui";

    static readonly ASSIGNABLE_COLOR = "#00ff00"
    static readonly ALREADY_ASSIGNED_COLOR = "#ffff00"
    static readonly COLLISION_COLOR = "#ff0000"
    // ^ The colors are defined here, but the UI elements are colored during the 'LabelingProcessCommand' and the
    // respective AssignmentCommand

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
        this.containerElement.replaceChildren('')
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
                targetElement = labelType.intendedFor === "Vertex" ? "a node" : "an output pin"
            } else {
                targetElement = "a node or output pin"
            }

            const labelHTML = document.createElement("strong")
            labelHTML.innerText = `${labelType.name}.${labelTypeValue.text}`

            text.append(
                `Right click ${targetElement} to assign `,
                labelHTML,
                this.generateAdditionalInformation() ?? '',
                ' to it.'
            )
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
        finalStepsButton.addEventListener('click', async () => {
            await this.actionDispatcher.dispatch(SaveJsonFileAction.create())
            await this.actionDispatcher.dispatchAll([
                AnalyzeAction.create(),
                SelectConstraintsAction.create(this.constraintRegistry.getConstraintList().map((c) => c.name)),
            ])
            await this.actionDispatcher.dispatch(SaveThreatsTableAction.create())
        })

        this.containerElement.replaceChildren(text, finalStepsButton)
    }

    private generateAdditionalInformation(): HTMLElement | undefined {
        if (this.state.state !== "inProgress") return;

        const { labelTypeValue } = this.labelTypeRegistry.resolveLabelAssignment(this.state.activeLabel)
        if (!labelTypeValue
            || !isThreatModelingLabelTypeValue(labelTypeValue)
            || !labelTypeValue.additionalInformation
        ) return;

        const icon = document.createElement('span')
        icon.classList.add('additional-information-icon')

        const container = document.createElement('div')
        container.classList.add('additional-information-container', 'ui-float')

        const explanation = document.createElement('div')
        explanation.classList.add('additional-information-colors-explanation')
        explanation.append(
            'Colors: ',
            createColorLabel(LabelingProcessUi.ASSIGNABLE_COLOR, 'Label is assignable'),
            createColorLabel(LabelingProcessUi.ALREADY_ASSIGNED_COLOR, 'Label is already assigned'),
            createColorLabel(LabelingProcessUi.COLLISION_COLOR, 'Label will collide'),
        )

        icon.appendChild(container)
        container.innerHTML = marked.parse(labelTypeValue.additionalInformation, { async: false })
        container.appendChild(explanation)

        return icon;
    }

    public getState(): LabelingProcessState {
        return this.state;
    }

    public setState(state: LabelingProcessState) {
        this.state = state;
        this.updateContents();
    }
}

function createColorLabel(color: string, text: string): HTMLElement {
    const container = document.createElement('span')
    container.style.display = 'flex'
    container.style.flexDirection = 'row'
    container.style.gap = '4px'

    const box = document.createElement('div')
    box.style.background = color
    box.style.width = '12px'
    box.style.height = '12px'
    box.style.display = 'inline-block'
    box.style.verticalAlign = 'middle'

    const label = document.createElement('span')
    label.innerText = text

    container.append(box, label)
    return container
}