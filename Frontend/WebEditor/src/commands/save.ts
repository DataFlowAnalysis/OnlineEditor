import { inject, injectable } from "inversify";
import { Command, CommandExecutionContext, LocalModelSource, SModelRoot, TYPES } from "sprotty";
import { Action, SModelRoot as SModelRootSchema } from "sprotty-protocol";
import { constructorInject } from "../utils";
import { DynamicChildrenProcessor } from "../dynamicChildren";
import { LabelType, LabelTypeRegistry } from "../labelTypeRegistry";

export interface SavedDiagram {
    model: SModelRootSchema;
    labelTypes: LabelType[];
}

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
    @inject(DynamicChildrenProcessor)
    private dynamicChildrenProcessor: DynamicChildrenProcessor = new DynamicChildrenProcessor();
    @inject(LabelTypeRegistry)
    private labelTypeRegistry: LabelTypeRegistry = new LabelTypeRegistry();

    constructor(@constructorInject(TYPES.Action) private action: SaveDiagramAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        // Convert the model to JSON
        // Do a copy because we're going to modify it
        const modelCopy = JSON.parse(JSON.stringify(this.modelSource.model));
        // Remove element children that are implementation detail
        this.dynamicChildrenProcessor.processGraphChildren(modelCopy, "remove");

        // Export the diagram as a JSON data URL.
        const diagram: SavedDiagram = {
            model: modelCopy,
            labelTypes: this.labelTypeRegistry.getLabelTypes(),
        };
        const diagramJson = JSON.stringify(diagram, undefined, 4);
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

    // Saving cannot be meaningfully undone/redone

    undo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }
}
