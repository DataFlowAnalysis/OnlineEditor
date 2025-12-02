import { AbstractUIExtension } from "sprotty";
import { injectable } from "inversify";
import "./accordion.css";

/**
 * Base class for an expandable accordion floating element
 */
@injectable()
export abstract class AccordionUiExtension extends AbstractUIExtension {
    constructor(
        private chevronPosition: "left" | "right",
        private chevronOrientation: "up" | "down",
    ) {
        super();
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.classList.add("ui-float");

        // create hidden checkbox used for toggling
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        const checkboxId = this.id() + "-checkbox";
        checkbox.id = checkboxId;
        checkbox.classList.add("accordion-state");
        checkbox.hidden = true;

        // create clickable label for the checkbox
        const label = document.createElement("label");
        label.htmlFor = checkboxId;
        // create header inside label
        const header = document.createElement("div");
        header.classList.add(`chevron-${this.chevronPosition}`, "accordion-button");
        if (this.chevronOrientation === "up") {
            header.classList.add("flip-chevron");
        }
        this.initializeHeaderContent(header);
        label.appendChild(header);

        // create content holder and initialize it
        const accordionContent = document.createElement("div");
        accordionContent.classList.add("accordion-content");
        const contentHolder = document.createElement("div");
        this.initializeHidableContent(contentHolder);
        accordionContent.appendChild(contentHolder);

        containerElement.appendChild(checkbox);
        containerElement.appendChild(label);
        containerElement.appendChild(accordionContent);
    }

    /**
     * Initializes the hidable content of the accordion element
     * @param contentElement The containing element of the content
     */
    protected abstract initializeHidableContent(contentElement: HTMLElement): void;

    /**
     * Initializes the header of the accordion element
     * @param contentElement The containing element of the header
     */
    protected abstract initializeHeaderContent(headerElement: HTMLElement): void;
}
