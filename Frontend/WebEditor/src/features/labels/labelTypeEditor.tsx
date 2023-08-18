import { injectable } from "inversify";
import { constructorInject, generateRandomSprottyId } from "../../utils";
import { AbstractUIExtension, CommitModelAction, IActionDispatcher, TYPES } from "sprotty";
import { LabelAssignment, LabelType, LabelTypeRegistry, LabelTypeValue } from "./labelTypeRegistry";
import { DeleteLabelTypeAction, DeleteLabelTypeValueAction } from "./commands";
import { LABEL_ASSIGNMENT_MIME_TYPE } from "./dropTool";

import "../../common/commonStyling.css";
import "./labelTypeEditor.css";

@injectable()
export class LabelTypeEditorUI extends AbstractUIExtension {
    constructor(
        @constructorInject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @constructorInject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher,
    ) {
        super();
        labelTypeRegistry.onUpdate(() => this.reRender());
    }

    static readonly ID = "label-type-editor-ui";

    id(): string {
        return LabelTypeEditorUI.ID;
    }

    containerClass(): string {
        return LabelTypeEditorUI.ID;
    }

    private reRender(): void {
        if (!this.containerElement) {
            // The ui extension has not been initialized yet.
            return;
        }

        // Remove all children
        this.containerElement.innerHTML = "";
        // Re-render
        this.initializeContents(this.containerElement);

        // Re-render sprotty model viewport by dispatching some command.
        // sprotty automatically triggers a re-render after any command is executed as it may change the model.

        // CommitModelAction is a great idea because that way we don't have to call it
        // each time we do some operation on the model inside the UI, like when removing a label type,
        // we also need to commit the removal from the model.
        // We can just do it here and not worry about it in the buttons/change handlers inside the ui.
        // All changes are propagated through the label type registry.
        this.actionDispatcher.dispatch(CommitModelAction.create());
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.classList.add("ui-float");
        containerElement.innerHTML = `
            <input type="checkbox" id="accordion-state-label-types" class="accordion-state" hidden>
            <label for="accordion-state-label-types">
                <div class="accordion-button">Keyboard Shortcuts</div>
            </label>
            <div class="accordion-content">
                <div class="label-type-edit-ui-inner"></div>
            </div>
        `;

        const innerContainerElement = containerElement.querySelector(".label-type-edit-ui-inner");
        if (!innerContainerElement) {
            throw new Error("Could not find inner container element");
        }

        this.labelTypeRegistry.getLabelTypes().forEach((labelType, idx) => {
            innerContainerElement.appendChild(this.renderLabelType(labelType));

            if (idx < this.labelTypeRegistry.getLabelTypes().length - 1) {
                // Add a horizontal line between label types
                const horizontalLine = document.createElement("hr");
                innerContainerElement.appendChild(horizontalLine);
            }
        });

        // Render add button for whole label type
        const addButton = document.createElement("button");
        addButton.innerHTML = '<span class="codicon codicon-add"></span> Label Type';
        addButton.onclick = () => {
            const labelType: LabelType = {
                id: generateRandomSprottyId(),
                name: "",
                values: [
                    {
                        id: generateRandomSprottyId(),
                        text: "Value",
                    },
                ],
            };
            this.labelTypeRegistry.registerLabelType(labelType);

            // Select the text input element of the new label type to allow entering the name
            const inputElement: HTMLElement | null = innerContainerElement.querySelector(
                `.label-type-${labelType.id} input`,
            );
            inputElement?.focus();
        };
        innerContainerElement.appendChild(addButton);
    }

    private renderLabelType(labelType: LabelType): HTMLElement {
        const labelTypeElement = document.createElement("div");
        labelTypeElement.classList.add("label-type");
        labelTypeElement.classList.add(`label-type-${labelType.id}`);

        const labelTypeNameInput = document.createElement("input");
        labelTypeNameInput.value = labelType.name;
        labelTypeNameInput.placeholder = "Label Type Name";
        labelTypeNameInput.classList.add("label-type-name");

        this.dynamicallySetInputSize(labelTypeNameInput);

        labelTypeNameInput.onchange = () => {
            labelType.name = labelTypeNameInput.value;
            this.labelTypeRegistry.labelTypeChanged();
        };

        labelTypeElement.appendChild(labelTypeNameInput);

        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = '<span class="codicon codicon-trash"></span>';
        deleteButton.onclick = () => {
            this.actionDispatcher.dispatch(DeleteLabelTypeAction.create(this.labelTypeRegistry, labelType.id));
        };
        labelTypeElement.appendChild(deleteButton);

        labelType.values.forEach((possibleValue) => {
            labelTypeElement.appendChild(this.renderLabelTypeValue(labelType, possibleValue));
        });

        // Add + button
        const addButton = document.createElement("button");
        addButton.classList.add("label-type-value-add");
        addButton.innerHTML = '<span class="codicon codicon-add"></span> Value';
        addButton.onclick = () => {
            const labelValue: LabelTypeValue = {
                id: generateRandomSprottyId(),
                text: "",
            };
            labelType.values.push(labelValue);

            // Insert label type last but before the button
            const newValueElement = this.renderLabelTypeValue(labelType, labelValue);
            labelTypeElement.insertBefore(newValueElement, labelTypeElement.lastChild);

            // Select the text input element of the new value to allow entering the value
            newValueElement.querySelector("input")?.focus();
        };
        labelTypeElement.appendChild(addButton);

        return labelTypeElement;
    }

    private renderLabelTypeValue(labelType: LabelType, labelTypeValue: LabelTypeValue): HTMLElement {
        const valueElement = document.createElement("div");
        valueElement.classList.add("label-type-value");

        const valueInput = document.createElement("input");
        valueInput.value = labelTypeValue.text;
        valueInput.placeholder = "Value";
        this.dynamicallySetInputSize(valueInput);

        valueInput.onchange = () => {
            labelTypeValue.text = valueInput.value;
            this.labelTypeRegistry.labelTypeChanged();
        };

        // Allow dragging to create a label assignment
        valueInput.draggable = true;
        valueInput.ondragstart = (event) => {
            const assignment: LabelAssignment = {
                labelTypeId: labelType.id,
                labelTypeValueId: labelTypeValue.id,
            };
            const assignmentJson = JSON.stringify(assignment);
            event.dataTransfer?.setData(LABEL_ASSIGNMENT_MIME_TYPE, assignmentJson);
        };

        valueElement.appendChild(valueInput);

        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = '<span class="codicon codicon-trash"></span>';
        deleteButton.onclick = () => {
            this.actionDispatcher.dispatch(
                DeleteLabelTypeValueAction.create(this.labelTypeRegistry, labelType.id, labelTypeValue.id),
            );
        };
        valueElement.appendChild(deleteButton);
        return valueElement;
    }

    /**
     * Sets and dynamically updates the size property of the passed input element.
     * When the text is zero the width is set to the placeholder length to make place for it.
     * When the text is changed the size gets updated with the keyup event.
     * @param inputElement the html dom input element to set the size property for
     */
    private dynamicallySetInputSize(inputElement: HTMLInputElement): void {
        const factor = 0.8;
        const rawSize = inputElement.value.length || inputElement.placeholder.length;
        inputElement.size = Math.round(rawSize * factor);

        inputElement.onkeyup = () => {
            const rawSize = inputElement.value.length || inputElement.placeholder.length;
            inputElement.size = Math.round(rawSize * factor);
        };
    }
}
