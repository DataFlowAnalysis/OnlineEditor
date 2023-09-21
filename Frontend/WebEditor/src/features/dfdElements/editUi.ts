import { EditLabelUI, SChildElementImpl } from "sprotty";
import { DfdOutputPortImpl } from "./ports";

export class CustomEditLabelUI extends EditLabelUI {
    private inputLabelDiv: HTMLDivElement | undefined;

    protected initializeContents(containerElement: HTMLElement) {
        super.initializeContents(containerElement);

        this.inputLabelDiv = document.createElement("div");
        this.inputLabelDiv.classList.add("labelEditAvailableInputs");
        this.containerElement.appendChild(this.inputLabelDiv);
    }

    protected applyTextContents(): void {
        if (!this.inputLabelDiv) {
            throw new Error("inputLabelDiv is undefined");
        }

        if (this.label instanceof SChildElementImpl && this.label.parent instanceof DfdOutputPortImpl) {
            const availableInputs = this.label.parent.getAvailableInputs();
            this.inputLabelDiv.innerText = `Available inputs: ${availableInputs.join(",")}`;
            this.inputLabelDiv.style.visibility = "visible";
        } else {
            this.inputLabelDiv.style.visibility = "hidden";
        }

        super.applyTextContents();
    }
}
