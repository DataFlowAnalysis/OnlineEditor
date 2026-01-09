import {
    AbstractUIExtension,
    IActionDispatcher,
    TYPES,
} from "sprotty";
import { inject, injectable } from "inversify";
import './labelingProcessUI.css'
import { LabelType, LabelTypeValue } from "../labels/LabelType.ts";
import { NextLabelingProcessAction } from "./labelingProcessCommand.ts";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry.ts";

export type LabelingProcessState
    = { state: 'pending' }
    | { state: 'inProgress', finishedLabels: LabelTypeValueWithLabelType[], activeLabel: LabelTypeValueWithLabelType }
    | { state: 'done' }

export type LabelTypeValueWithLabelType = {labelType: LabelType, labelTypeValue: LabelTypeValue}

@injectable()
export class LabelingProcessUi extends AbstractUIExtension {
    static readonly ID = "labeling-process-ui";

    private state: LabelingProcessState;

    constructor(
        @inject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher,
        @inject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry
    ) {
        super();
        this.state = { state:'pending' }
    }


    id(): string {
        return LabelingProcessUi.ID;
    }

    containerClass(): string {
        return "labeling-process-container"
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.classList.add("ui-float");
        this.updateContents();
    }

    private updateContents(): void {
        switch (this.state.state) {
            case "pending": return;
            case "inProgress": return this.showInProgressContents();
            case "done": return this.showDoneContents();
        }
    }

    private showInProgressContents(): void {
        if (this.state.state !== 'inProgress') return;

        const text = document.createElement('span')
        text.innerText = `Please click all nodes that are ${this.state.activeLabel?.labelType.name}.${this.state.activeLabel?.labelTypeValue.text}`

        const nextButton = document.createElement('button')
        nextButton.innerText = "Next label"
        nextButton.addEventListener('click', () => {
            if (this.state.state !== 'inProgress') return;
            this.actionDispatcher.dispatch(NextLabelingProcessAction.create(
                this.labelTypeRegistry,
                [...this.state.finishedLabels, this.state.activeLabel]
            ))
        })

        this.containerElement.replaceChildren(text, nextButton)
    }

    private showDoneContents(): void {
        if (this.state.state !== 'done') return;

        const text = document.createElement('span')
        text.innerText = 'You have completed this process.'

        this.containerElement.replaceChildren(text)
    }

    public getState(): LabelingProcessState {
        return this.state;
    }

    public setState(state: LabelingProcessState) {
        this.state = state;
        this.updateContents();
    }
}