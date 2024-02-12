import { inject, injectable } from "inversify";
import { Command, CommandExecutionContext, CommandReturn, TYPES } from "sprotty";
import { Action } from "sprotty-protocol";
import { DfdNodeImpl, DfdNodeValidationResult } from "../dfdElements/nodes";

export type EditorMode = "edit" | "validation" | "readonly";

/**
 * Holds the current editor mode in a central place.
 * Used to get the current mode in places where it is used.
 *
 * Changes to the mode should be done using the ChangeEditorModeCommand
 * and not directly on this class when done interactively
 * for undo/redo support and actions that are done to the model
 * when the mode changes.
 */
@injectable()
export class EditorModeController {
    private mode: EditorMode = "edit";
    private modeChangeCallbacks: ((mode: EditorMode) => void)[] = [];

    getCurrentMode(): EditorMode {
        return this.mode;
    }

    setMode(mode: EditorMode) {
        this.mode = mode;

        this.modeChangeCallbacks.forEach((callback) => callback(mode));
    }

    setDefaultMode() {
        this.mode = "edit";
    }

    onModeChange(callback: (mode: EditorMode) => void) {
        this.modeChangeCallbacks.push(callback);
    }
}

export interface ChangeEditorModeAction extends Action {
    kind: typeof ChangeEditorModeAction.KIND;
    newMode: EditorMode;
}
export namespace ChangeEditorModeAction {
    export const KIND = "changeEditorMode";

    export function create(newMode: EditorMode): ChangeEditorModeAction {
        return {
            kind: KIND,
            newMode,
        };
    }
}

export class ChangeEditorModeCommand extends Command {
    static readonly KIND = ChangeEditorModeAction.KIND;

    private oldMode?: EditorMode;
    private oldNodeValidationResults: Map<string, DfdNodeValidationResult> = new Map();

    @inject(EditorModeController)
    private readonly controller?: EditorModeController;

    constructor(@inject(TYPES.Action) private action: ChangeEditorModeAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        if (!this.controller) throw new Error("Missing injects");

        this.oldMode = this.controller.getCurrentMode();
        this.controller.setMode(this.action.newMode);
        this.postModeSwitch(context);

        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (!this.controller) throw new Error("Missing injects");

        if (!this.oldMode) {
            // This should never happen because execute() is called before undo() is called.
            throw new Error("No old mode to restore");
        }
        this.controller.setMode(this.oldMode);
        this.undoPostModeSwitch(context);

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }

    private postModeSwitch(context: CommandExecutionContext): void {
        if (this.oldMode === "validation" && this.action.newMode === "edit") {
            // Remove validation errors when enabling editing

            this.oldNodeValidationResults.clear();
            context.root.index.all().forEach((element) => {
                if (element instanceof DfdNodeImpl && element.validationResult) {
                    this.oldNodeValidationResults.set(element.id, element.validationResult);
                    element.validationResult = undefined;
                }
            });
        }
    }

    private undoPostModeSwitch(context: CommandExecutionContext): void {
        if (this.oldMode === "validation" && this.action.newMode === "edit") {
            // Restore validation errors when disabling editing
            this.oldNodeValidationResults.forEach((validationResult, id) => {
                const element = context.root.index.getById(id);
                if (element instanceof DfdNodeImpl) {
                    element.validationResult = validationResult;
                }
            });
        }
    }
}
