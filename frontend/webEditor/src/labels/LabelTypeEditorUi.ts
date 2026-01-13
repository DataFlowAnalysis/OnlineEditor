import { AccordionUiExtension } from "../accordionUiExtension";
import { UiElementFactory } from "../utils/UiElementFactory";
import { LabelAssignment, LabelType } from "./LabelType";
import { inject } from "inversify";
import { LabelTypeRegistry } from "./LabelTypeRegistry";

import "./labelTypeEditorUi.css";
import { dynamicallySetInputSize } from "../utils/TextSize";
import { LABEL_ASSIGNMENT_MIME_TYPE } from "./dragAndDrop";
import { AddLabelAssignmentAction } from "./assignmentCommand";
import { IActionDispatcher, TYPES } from "sprotty";
import { SETTINGS } from "../settings/Settings";
import { EditorModeController } from "../settings/editorMode";
import { ReplaceAction } from "./renameCommand";
import { BeginLabelingProcessAction } from "../labelingProcess/labelingProcessCommand.ts";

export class LabelTypeEditorUi extends AccordionUiExtension {
    static readonly ID = "label-type-editor-ui";
    private labelSectionContainer?: HTMLElement;

    constructor(
        @inject(LabelTypeRegistry) private labelTypeRegistry: LabelTypeRegistry,
        @inject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher,
        @inject(SETTINGS.Mode) private readonly editorModeController: EditorModeController,
    ) {
        super("left", "down");
        labelTypeRegistry.onUpdate(() => this.renderLabelTypes());
    }

    id(): string {
        return LabelTypeEditorUi.ID;
    }
    containerClass(): string {
        return LabelTypeEditorUi.ID;
    }

    protected initializeHidableContent(contentElement: HTMLElement) {
        const addButton = UiElementFactory.buildAddButton("Label Type");

        addButton.onclick = () => {
            if (this.editorModeController.isReadOnly()) {
                return;
            }
            this.labelTypeRegistry.registerLabelType("");
        };

        this.labelSectionContainer = document.createElement("div");
        this.renderLabelTypes();

        contentElement.appendChild(this.buildAnnotationProcessButton())
        contentElement.appendChild(this.labelSectionContainer);
        contentElement.appendChild(addButton);
    }
    protected initializeHeaderContent(headerElement: HTMLElement) {
        headerElement.innerText = "Label Types";
    }

    private buildAnnotationProcessButton(): HTMLElement {
        const button = document.createElement("button");
        button.id = "annotation-process-button";
        button.innerHTML = "Start labeling process";
        button.onclick = () => {
            this.actionDispatcher.dispatch(BeginLabelingProcessAction.create(this.labelTypeRegistry));
        };

        return button;
    }

    private renderLabelTypes(): void {
        if (!this.labelSectionContainer) {
            return;
        }
        const width = this.labelSectionContainer.scrollWidth;
        const height = this.labelSectionContainer.scrollHeight;
        this.labelSectionContainer.style.width = `${width}px`;
        this.labelSectionContainer.style.height = `${height}px`;
        const fragment = document.createDocumentFragment();
        const labelTypes = this.labelTypeRegistry.getLabelTypes();
        for (let i = 0; i < labelTypes.length; i++) {
            fragment.appendChild(this.buildLabelTypeSection(labelTypes[i]));
            if (i < labelTypes.length - 1) {
                fragment.appendChild(document.createElement("hr"));
            }
        }
        this.labelSectionContainer!.replaceChildren(fragment);
        this.labelSectionContainer!.style.width = "";
        this.labelSectionContainer!.style.height = "";
    }

    private buildLabelTypeSection(labelType: LabelType): HTMLElement {
        const section = document.createElement("div");
        section.classList.add("label-section");

        const nameInput = document.createElement("input");
        nameInput.classList.add("label-type-name");
        const deleteButton = UiElementFactory.buildDeleteButton();
        const labelTypeValueHolder = document.createElement("div");
        labelTypeValueHolder.classList.add("label-type-values");
        const addButton = UiElementFactory.buildAddButton("Value");
        addButton.classList.add("label-type-value-add");

        nameInput.value = labelType.name;
        nameInput.placeholder = "Label Type Name";
        nameInput.oninput = (e: Event) => this.onInputHandler(e as InputEvent, nameInput);
        dynamicallySetInputSize(nameInput);
        setTimeout(() => dynamicallySetInputSize(nameInput), 0);
        nameInput.onchange = () => {
            if (this.editorModeController.isReadOnly()) {
                return;
            }
            const replacements = labelType.values.map((t) => ({
                old: `${labelType.name}.${t}`,
                replacement: `${nameInput.value}.${t}`,
                type: "label",
            }));
            this.labelTypeRegistry.updateLabelTypeName(labelType.id, nameInput.value);
            this.actionDispatcher.dispatch(ReplaceAction.create(replacements));
        };
        nameInput.onfocus = () => {
            if (this.editorModeController.isReadOnly()) {
                nameInput.blur();
            }
        };

        for (let i = 0; i < labelType.values.length; i++) {
            labelTypeValueHolder.appendChild(this.buildLabelTypeValue(labelType, i));
        }

        addButton.onclick = () => {
            if (this.editorModeController.isReadOnly()) {
                return;
            }
            this.labelTypeRegistry.registerLabelTypeValue(labelType.id, "");
        };

        deleteButton.onclick = () => {
            if (this.editorModeController.isReadOnly()) {
                return;
            }
            this.labelTypeRegistry.unregisterLabelType(labelType.id);
        };

        section.appendChild(nameInput);
        section.appendChild(deleteButton);
        section.appendChild(labelTypeValueHolder);
        section.appendChild(addButton);

        return section;
    }

    private buildLabelTypeValue(labelType: LabelType, valueIndex: number) {
        const holder = document.createElement("div");
        holder.classList.add("label-type-value");
        const nameInput = document.createElement("input");
        nameInput.classList.add("label-type-value-name");
        const deleteButton = UiElementFactory.buildDeleteButton();

        const value = labelType.values[valueIndex];

        nameInput.value = value.text;
        nameInput.placeholder = "Value";
        nameInput.oninput = (e: Event) => this.onInputHandler(e as InputEvent, nameInput);
        nameInput.style.width = "0px";
        setTimeout(() => dynamicallySetInputSize(nameInput), 0);

        nameInput.onchange = () => {
            if (this.editorModeController.isReadOnly()) {
                return;
            }
            const replacements = [
                {
                    old: `${labelType.name}.${value.text}`,
                    replacement: `${labelType.name}.${nameInput.value}`,
                    type: "label",
                },
            ];
            this.labelTypeRegistry.updateLabelTypeValueText(labelType.id, value.id, nameInput.value);
            this.actionDispatcher.dispatch(ReplaceAction.create(replacements));
        };

        deleteButton.onclick = () => {
            if (this.editorModeController.isReadOnly()) {
                return;
            }
            this.labelTypeRegistry.unregisterLabelTypeValue(labelType.id, value.id);
        };

        // Allow dragging to create a label assignment
        nameInput.draggable = true;
        nameInput.ondragstart = (event) => {
            if (this.editorModeController.isReadOnly()) {
                return;
            }
            const assignment: LabelAssignment = {
                labelTypeId: labelType.id,
                labelTypeValueId: value.id,
            };
            const assignmentJson = JSON.stringify(assignment);
            event.dataTransfer?.setData(LABEL_ASSIGNMENT_MIME_TYPE, assignmentJson);
        };

        // Only edit on double click
        nameInput.onclick = () => {
            if (this.editorModeController.isReadOnly()) {
                return;
            }
            if (nameInput.getAttribute("clicked") === "true") {
                return;
            }

            nameInput.setAttribute("clicked", "true");
            setTimeout(() => {
                if (nameInput.getAttribute("clicked") === "true") {
                    this.actionDispatcher.dispatch(
                        AddLabelAssignmentAction.create({
                            labelTypeId: labelType.id,
                            labelTypeValueId: value.id,
                        }),
                    );
                    nameInput.removeAttribute("clicked");
                }
            }, 500);
        };
        nameInput.ondblclick = () => {
            if (this.editorModeController.isReadOnly()) {
                return;
            }
            nameInput.removeAttribute("clicked");
            nameInput.focus();
        };
        nameInput.onfocus = (event) => {
            if (this.editorModeController.isReadOnly()) {
                nameInput.blur();
                return;
            }
            // we check for the single click here, since this gets triggered before the ondblclick event
            if (nameInput.getAttribute("clicked") !== "true") {
                event.preventDefault();
                // the blur needs to occur with a delay, as otherwise chromium browsers prevent the drag
                setTimeout(() => {
                    nameInput.blur();
                }, 0);
            }
        };

        holder.appendChild(nameInput);
        holder.appendChild(deleteButton);
        return holder;
    }

    private onInputHandler(event: InputEvent, input: HTMLInputElement) {
        if (!event.data?.match(/^[a-zA-Z0-9]*$/)) {
            event.preventDefault();
        }
        dynamicallySetInputSize(input);
    }
}
