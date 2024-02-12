import { inject } from "inversify";
import { Command, TYPES, CommandExecutionContext, CommandReturn } from "sprotty";
import { Action } from "sprotty-protocol";
import { DfdNodeValidationResult, DfdNodeImpl } from "../dfdElements/nodes";
import { EditorMode, EditorModeController } from "./editorModeController";

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
