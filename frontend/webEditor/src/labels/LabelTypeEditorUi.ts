import { AccordionUiExtension } from "../accordionUiExtension";
import { UiElementFactory } from "../utils/UiElementFactory";
import { LabelType } from "./LabelType";
import { inject } from "inversify";
import { LabelTypeRegistry } from "./LabelTypeRegistry";

import './labelTypeEditorUi.css'
import { dynamicallySetInputSize } from "../utils/TextSize";

export class LabelTypeEditorUi extends AccordionUiExtension {
    static readonly ID = "label-type-editor-ui";
    private labelSectionContainer?: HTMLElement

    constructor(@inject(LabelTypeRegistry) private labelTypeRegistry: LabelTypeRegistry) {
        super('left', 'down')
        labelTypeRegistry.onUpdate(() => this.renderLabelTypes())
    }
    
    id(): string {
        return LabelTypeEditorUi.ID
    }
    containerClass(): string {
        return LabelTypeEditorUi.ID
    }

    protected initializeHidableContent(contentElement: HTMLElement) {
        const addButton = UiElementFactory.buildAddButton('Label Type')

        addButton.onclick = () => {
            this.labelTypeRegistry.registerLabelType('')
        }

        this.labelSectionContainer = document.createElement('div')
        this.renderLabelTypes()

        contentElement.appendChild(this.labelSectionContainer)
        contentElement.appendChild(addButton)
    }
    protected initializeHeaderContent(headerElement: HTMLElement) {
        headerElement.innerText = 'Label Types'
    }

    private renderLabelTypes(): void {
        if (!this.labelSectionContainer) {
            return
        }
        this.labelSectionContainer.innerHTML = '';
        const labelTypes = this.labelTypeRegistry.getLabelTypes()
        for (let i = 0; i < labelTypes.length; i++) {
            this.labelSectionContainer.appendChild(this.buildLabelTypeSection(labelTypes[i]))
            if (i < labelTypes.length - 1) {
                this.labelSectionContainer.appendChild(document.createElement('hr'))
            }
        }
    }

    private buildLabelTypeSection(labelType: LabelType): HTMLElement {
        const section = document.createElement('div')
        section.classList.add('label-section')

        const nameInput = document.createElement('input')
        nameInput.classList.add('label-type-name')
        const deleteButton = UiElementFactory.buildDeleteButton()
        const labelTypeValueHolder = document.createElement('div')
        labelTypeValueHolder.classList.add('label-type-values')
        const addButton = UiElementFactory.buildAddButton('Value')
        addButton.classList.add('label-type-value-add')

        nameInput.value = labelType.name
        nameInput.placeholder = 'Label Type Name'
        nameInput.oninput = (e: InputEvent) => this.onInputHandler(e, nameInput)
        setTimeout(() => dynamicallySetInputSize(nameInput), 0)
        nameInput.onchange = () => {
            this.labelTypeRegistry.updateLabelTypeName(labelType.id, nameInput.value)
        }

        for (let i = 0; i < labelType.values.length; i++) {
            labelTypeValueHolder.appendChild(this.buildLabelTypeValue(labelType, i))
        }

        addButton.onclick = () => {
            this.labelTypeRegistry.registerLabelTypeValue(labelType.id, '')
        }

        deleteButton.onclick = () => {
            this.labelTypeRegistry.unregisterLabelType(labelType.id)
        }

        section.appendChild(nameInput)
        section.appendChild(deleteButton)
        section.appendChild(labelTypeValueHolder)
        section.appendChild(addButton)

        return section
    }

    private buildLabelTypeValue(labelType: LabelType, valueIndex: number) {
        const holder = document.createElement('div');
        holder.classList.add('label-type-value')
        const nameInput = document.createElement('input');
        nameInput.classList.add('label-type-value-name')
        const deleteButton = UiElementFactory.buildDeleteButton()

        const value = labelType.values[valueIndex]

        
        nameInput.value = value.text
        nameInput.placeholder = 'Value'
        nameInput.oninput = (e: InputEvent) => this.onInputHandler(e, nameInput)
        setTimeout(() => dynamicallySetInputSize(nameInput), 0)

        nameInput.onchange = () => {
            this.labelTypeRegistry.updateLabelTypeValueText(labelType.id, value.id, nameInput.value)
        }

        deleteButton.onclick = () => {
            this.labelTypeRegistry.unregisterLabelTypeValue(labelType.id, value.id)
        }

        holder.appendChild(nameInput)
        holder.appendChild(deleteButton)
        return holder
    }

    private onInputHandler(event: InputEvent, input: HTMLInputElement) {
        if (!event.data?.match(/^[a-zA-Z0-9]*$/)) {
            event.preventDefault()
        }
        dynamicallySetInputSize(input)
    }
} 