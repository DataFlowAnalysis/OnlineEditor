import { AbstractUIExtension, ActionDispatcher, TYPES } from "sprotty";
import { ChangeEditorModeAction, EditorMode, EditorModeController } from "./editorModeController";
import { inject, injectable } from "inversify";

import "./modeSwitchUi.css";

/**
 * UI that shows the current editor mode (unless it is edit mode)
 * with details about the mode.
 * For validation mode the user can also choose to enable editing
 * and switch the editor to edit mode.
 */
@injectable()
export class EditorModeSwitchUi extends AbstractUIExtension {
    static readonly ID = "editor-mode-switcher";

    constructor(
        @inject(EditorModeController)
        private readonly editorModeController: EditorModeController,
        @inject(TYPES.IActionDispatcher)
        private readonly actionDispatcher: ActionDispatcher,
    ) {
        super();
    }

    id(): string {
        return EditorModeSwitchUi.ID;
    }
    containerClass(): string {
        return this.id();
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.classList.add("ui-float");
        this.editorModeController.onModeChange((mode) => this.reRender(mode));
        // Only for testing, TODO: remove when mode is loaded from the model
        this.editorModeController.setMode("validation");
    }

    private reRender(mode: EditorMode): void {
        this.containerElement.innerHTML = "";
        switch (mode) {
            case "edit":
                this.containerElement.style.visibility = "hidden";
                break;
            case "readonly":
                this.containerElement.style.visibility = "visible";
                this.renderReadonlyMode();
                break;
            case "validation":
                this.containerElement.style.visibility = "visible";
                this.renderValidationMode();
                break;
            default:
                throw new Error(`Unknown editor mode: ${mode}`);
        }
    }

    private renderValidationMode(): void {
        this.containerElement.innerHTML = `
            Currently validation errors from the analysis.</br>
            Enabling editing will remove the validation errors.</br>
            <button id="enableEditingButton">Enable editing</button>
        `;
        const enableEditingButton = this.containerElement.querySelector("#enableEditingButton");
        enableEditingButton?.addEventListener("click", () => {
            this.actionDispatcher.dispatch(ChangeEditorModeAction.create("edit"));
        });
    }

    private renderReadonlyMode(): void {
        this.containerElement.innerHTML = `
            This diagram was generated from a palladio model.</br>
            Model is readonly.
        `;
    }
}
