import { inject, injectable } from "inversify";
import { Command, CommandExecutionContext, LocalModelSource, SModelRoot, TYPES } from "sprotty";
import { Action } from "sprotty-protocol";
import { constructorInject } from "../utils";

export interface SaveDiagramAction extends Action {
    kind: typeof SaveDiagramAction.KIND;
    suggestedFileName: string;
}
export namespace SaveDiagramAction {
    export const KIND = "save-diagram";

    export function create(suggestedFileName: string): SaveDiagramAction {
        return {
            kind: KIND,
            suggestedFileName,
        };
    }
}

@injectable()
export class SaveDiagramCommand extends Command {
    static readonly KIND = SaveDiagramAction.KIND;
    @inject(TYPES.ModelSource)
    private modelSource: LocalModelSource = new LocalModelSource();

    constructor(@constructorInject(TYPES.Action) private action: SaveDiagramAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        // Export the diagram as a JSON data URL.
        const diagramJson = JSON.stringify(this.modelSource.model, undefined, 4);
        const jsonBlob = new Blob([diagramJson], { type: "application/json" });
        const jsonUrl = URL.createObjectURL(jsonBlob);

        // Download the JSON file using a temporary anchor element.
        // The cleaner way to do this would be showSaveFilePicker(),
        // but safari and firefox don't support it at the time of writing this code:
        // https://developer.mozilla.org/en-US/docs/web/api/window/showsavefilepicker#browser_compatibility
        const tempLink = document.createElement("a");
        tempLink.href = jsonUrl;
        tempLink.setAttribute("download", this.action.suggestedFileName);
        tempLink.click();

        // Free the url data
        URL.revokeObjectURL(jsonUrl);
        tempLink.remove();

        return context.root;
    }

    // Saving cannot be undone and should not be redone.

    undo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }
}
