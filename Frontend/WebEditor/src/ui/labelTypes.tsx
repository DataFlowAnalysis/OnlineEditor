import { AbstractUIExtension, TYPES } from "sprotty";
import { ContainerModule, injectable } from "inversify";

import "./labelTypes.css";
import { constructorInject, generateRandomSprottyId } from "../utils";
import { LabelTypeRegistry } from "../labelTypeRegistry";

@injectable()
export class LabelTypeUI extends AbstractUIExtension {
    constructor(@constructorInject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry) {
        super();
        labelTypeRegistry.registerLabelType({
            id: generateRandomSprottyId(),
            name: "Test Label",
            values: ["Value1", "Value2"],
        });
        labelTypeRegistry.registerLabelType({
            id: generateRandomSprottyId(),
            name: "Test Label 2",
            values: ["Foo", "Bar", "Baz"],
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
            const labelTypeElement = document.createElement("div");
            labelTypeElement.classList.add("label-type");
            labelTypeElement.innerText = labelType.name;
            containerElement.appendChild(labelTypeElement);

            labelType.values.forEach((possibleValue) => {
                const valueElement = document.createElement("div");
                valueElement.classList.add("label-type-value");
                valueElement.innerText = possibleValue;
                labelTypeElement.appendChild(valueElement);
            });
        });
    }
}

export const labelTypeUiModule = new ContainerModule((bind) => {
    bind(LabelTypeUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(LabelTypeUI);
});
