import { AbstractUIExtension, TYPES } from "sprotty";
import { ContainerModule, injectable } from "inversify";

import "./labelTypes.css";
import { constructorInject, generateRandomSprottyId } from "../utils";
import { LabelType, LabelTypeRegistry, LabelTypeValue } from "../labelTypeRegistry";

@injectable()
export class LabelTypeUI extends AbstractUIExtension {
    constructor(@constructorInject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry) {
        super();
        labelTypeRegistry.registerLabelType({
            id: generateRandomSprottyId(),
            name: "Test Label",
            values: ["Value1", "Value2"].map((value) => ({
                id: generateRandomSprottyId(),
                value,
            })),
        });
        labelTypeRegistry.registerLabelType({
            id: generateRandomSprottyId(),
            name: "Test Label 2",
            values: ["Foo", "Bar", "Baz"].map((value) => ({
                id: generateRandomSprottyId(),
                value,
            })),
        });
    }

    static readonly ID = "label-type-ui";

    id(): string {
        return LabelTypeUI.ID;
    }

    containerClass(): string {
        return LabelTypeUI.ID;
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.classList.add("ui-float");
        this.labelTypeRegistry.getLabelTypes().forEach((labelType) => {
            containerElement.appendChild(this.renderLabelType(labelType));
        });

        // Render add button for whole label type
        const addButton = document.createElement("button");
        addButton.innerText = "+ Label Type";
        addButton.onclick = () => {
            const labelType: LabelType = {
                id: generateRandomSprottyId(),
                name: "",
                values: [
                    {
                        id: generateRandomSprottyId(),
                        value: "Value",
                    },
                ],
            };
            this.labelTypeRegistry.registerLabelType(labelType);

            // Insert label type last but before the button
            const labelTypeElement = this.renderLabelType(labelType);
            containerElement.insertBefore(labelTypeElement, containerElement.lastChild);

            // Select the text input element of the new label type to allow entering the name
            labelTypeElement.querySelector("input")?.focus();
        };
        containerElement.appendChild(addButton);
    }

    private renderLabelType(labelType: LabelType): HTMLElement {
        const labelTypeElement = document.createElement("div");
        labelTypeElement.classList.add("label-type");

        const labelTypeNameInput = document.createElement("input");
        labelTypeNameInput.value = labelType.name;
        labelTypeNameInput.placeholder = "Label Type Name";
        labelTypeNameInput.classList.add("label-type-name");

        labelTypeNameInput.onchange = () => {
            labelType.name = labelTypeNameInput.value;
        };

        labelTypeElement.appendChild(labelTypeNameInput);

        labelType.values.forEach((possibleValue) => {
            labelTypeElement.appendChild(this.renderLabelTypeValue(labelType, possibleValue));
        });

        // Add + button
        const addButton = document.createElement("button");
        addButton.classList.add("label-type-value-add");
        addButton.innerText = "+ Value";
        addButton.onclick = () => {
            const labelValue: LabelTypeValue = {
                id: generateRandomSprottyId(),
                value: "",
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
        valueInput.value = labelTypeValue.value;
        valueInput.placeholder = "Value";
        valueInput.size = labelTypeValue.value.length;
        valueInput.onkeyup = () => {
            labelTypeValue.value = valueInput.value;
            valueInput.size = valueInput.value.length;
        };
        valueElement.appendChild(valueInput);

        const deleteButton = document.createElement("button");
        deleteButton.innerText = "-";
        deleteButton.onclick = () => {
            const index = labelType.values.indexOf(labelTypeValue);
            if (index >= 0) {
                labelType.values.splice(index, 1);
                valueElement.remove();
            }
        };
        valueElement.appendChild(deleteButton);
        return valueElement;
    }
}

export const labelTypeUiModule = new ContainerModule((bind) => {
    bind(LabelTypeUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(LabelTypeUI);
});
