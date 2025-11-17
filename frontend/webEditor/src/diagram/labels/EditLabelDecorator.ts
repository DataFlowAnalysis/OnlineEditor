import { injectable } from "inversify";
import { IEditLabelValidationDecorator, EditLabelValidationResult } from "sprotty";
import "./editLabelDecorator.css"

/**
 * Renders the validation result of an dfd edge label to the label edit ui.
 */
@injectable()
export class DfdEditLabelValidatorDecorator implements IEditLabelValidationDecorator {
    private readonly cssClass = "label-validation-results";

    decorate(input: HTMLInputElement | HTMLTextAreaElement, validationResult: EditLabelValidationResult): void {
        const containerElement = input.parentElement;
        if (!containerElement) {
            return;
        }

        // Only display something when there is a validation error or warning
        if (validationResult.severity !== "ok") {
            const span = document.createElement("span");
            span.innerText = validationResult.message ?? validationResult.severity;
            span.classList.add(this.cssClass);

            // Place validation notice right under the input field
            span.style.top = `${input.clientHeight}px`;
            // Rest is styled in the corresponding css file, as it is not dynamic

            containerElement.appendChild(span);
        }
    }

    dispose(input: HTMLInputElement | HTMLTextAreaElement): void {
        const containerElement = input.parentElement;
        if (containerElement) {
            containerElement.querySelector(`span.${this.cssClass}`)?.remove();
        }
    }
}